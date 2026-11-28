package com.hotel.backend.service;

import com.hotel.backend.dto.MoveStayRequest;
import com.hotel.backend.dto.RoomDto;
import com.hotel.backend.dto.UpsertStayRequest;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Floor;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Room;
import com.hotel.backend.repository.FloorRepository;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

/**
 * Manages persisted hotel stays on PostgreSQL Room records:
 * registering guest email/phone per room, check-in, room moves, and checkout access revocation.
 */
@Service
public class HotelStayService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;

    public HotelStayService(
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            FloorRepository floorRepository) {
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.floorRepository = floorRepository;
    }

    @Transactional
    public RoomDto upsertStay(String slug, UpsertStayRequest req) {
        Hotel hotel = findHotelOrThrow(slug);
        String roomNumber = req.getRoomNumber().trim();
        String guestName = req.getGuestName().trim();
        if (guestName.length() < 2) {
            throw new IllegalArgumentException("Guest name must be at least 2 characters.");
        }

        GuestContactHelper.ValidatedContact contact =
                GuestContactHelper.validateAndRequireAtLeastOne(req.getGuestEmail(), req.getGuestPhone());

        ensureNoContactConflict(hotel, roomNumber, contact);

        Room room = findOrProvisionRoom(hotel, roomNumber, req.getFloor(), req.getTypeTag(), req.getTypeFull());
        boolean hasExistingOccupant = (room.isOccupied() || "EXPECTED".equalsIgnoreCase(room.getBadgeStatus()))
                && room.getGuestName() != null && !room.getGuestName().isBlank();
        String requestedRef = req.getBookingRef() != null ? req.getBookingRef().trim() : "";
        boolean sameExistingStay = hasExistingOccupant
                && !requestedRef.isEmpty()
                && requestedRef.equals(room.getBookingRef());
        if (hasExistingOccupant && !sameExistingStay) {
            throw new IllegalStateException("Room " + roomNumber + " already has an active stay (" + room.getGuestName() + ").");
        }

        boolean isExpected = "arriving".equalsIgnoreCase(req.getCategory())
                || "expected".equalsIgnoreCase(req.getCategory());

        String stayRef = !requestedRef.isEmpty() ? requestedRef : nextStayRef();
        String readiness = (req.getReadiness() != null && !req.getReadiness().isBlank())
                ? req.getReadiness().trim().toLowerCase()
                : "ready";

        room.setOccupied(!isExpected);
        room.setBadgeStatus(isExpected ? "EXPECTED" : "OCCUPIED");
        room.setReadiness(isExpected ? readiness : "ready");
        room.setGuestName(guestName);
        room.setGuestEmail(contact.email());
        room.setGuestPhone(contact.phone());
        room.setBookingRef(stayRef);
        room.setCheckInDate(cleanOptional(req.getCheckInDate()));
        room.setCheckOutDate(cleanOptional(req.getCheckOutDate()));
        room.setDuration(cleanOptional(req.getDuration()));
        room.setFolioBalance(cleanOptional(req.getFolioBalance()));
        room.setVip(req.isVip());
        if (req.getTypeFull() != null && !req.getTypeFull().isBlank()) {
            room.setTypeFull(req.getTypeFull().trim());
        }
        if (req.getTypeTag() != null && !req.getTypeTag().isBlank()) {
            room.setTypeTag(req.getTypeTag().trim());
        }
        if (room.getPin() == null || room.getPin().isBlank()) {
            room.setPin(generateRandomPin());
        }

        Room saved = roomRepository.save(room);
        return RoomDto.fromEntity(saved);
    }

    @Transactional
    public RoomDto checkInStay(String slug, String roomNumber) {
        Hotel hotel = findHotelOrThrow(slug);
        String cleanRoomNo = roomNumber != null ? roomNumber.trim() : "";
        Room room = roomRepository.findByHotelAndRoomNumber(hotel, cleanRoomNo)
                .orElseThrow(() -> new ResourceNotFoundException("Room " + cleanRoomNo + " not found."));

        if (room.getGuestName() == null || room.getGuestName().isBlank()) {
            throw new IllegalStateException("No expected guest arrival registered for Room " + cleanRoomNo + ".");
        }

        room.setOccupied(true);
        room.setReadiness("ready");
        room.setBadgeStatus("OCCUPIED");
        if (room.getBookingRef() == null || room.getBookingRef().isBlank()) {
            room.setBookingRef(nextStayRef());
        }
        if (room.getPin() == null || room.getPin().isBlank()) {
            room.setPin(generateRandomPin());
        }

        Room saved = roomRepository.save(room);
        return RoomDto.fromEntity(saved);
    }

    @Transactional
    public RoomDto checkOutStay(String slug, String roomNumber) {
        Hotel hotel = findHotelOrThrow(slug);
        return clearRoomStay(hotel, roomNumber);
    }

    @Transactional
    public RoomDto checkOutStayByHotelAndRoom(Hotel hotel, String roomNumber) {
        return clearRoomStay(hotel, roomNumber);
    }

    @Transactional
    public RoomDto moveStay(String slug, MoveStayRequest req) {
        Hotel hotel = findHotelOrThrow(slug);
        String fromNo = req.getFromRoomNumber().trim();
        String toNo = req.getToRoomNumber().trim();
        if (fromNo.equalsIgnoreCase(toNo)) {
            throw new IllegalArgumentException("Source and destination rooms must be different.");
        }

        Room source = roomRepository.findByHotelAndRoomNumber(hotel, fromNo).orElse(null);
        String guestName = source != null && source.getGuestName() != null ? source.getGuestName() : cleanOptional(req.getGuestName());
        String guestEmail = source != null && source.getGuestEmail() != null ? source.getGuestEmail() : GuestContactHelper.normalizeEmail(req.getGuestEmail());
        String guestPhone = source != null && source.getGuestPhone() != null ? source.getGuestPhone() : GuestContactHelper.normalizePhone(req.getGuestPhone());
        String checkInDate = source != null && source.getCheckInDate() != null ? source.getCheckInDate() : cleanOptional(req.getCheckInDate());
        String checkOutDate = source != null && source.getCheckOutDate() != null ? source.getCheckOutDate() : cleanOptional(req.getCheckOutDate());
        String duration = source != null && source.getDuration() != null ? source.getDuration() : cleanOptional(req.getDuration());
        boolean vip = (source != null && source.isVip()) || req.isVip();

        if (guestName == null || guestName.isBlank()) {
            throw new ResourceNotFoundException("No active guest stay found in Room " + fromNo + ".");
        }

        Room dest = findOrProvisionRoom(hotel, toNo, req.getToFloor(), req.getToTypeTag(), req.getToTypeFull());
        if (dest.isOccupied() && dest.getGuestName() != null && !dest.getGuestName().isBlank()) {
            throw new IllegalStateException("Destination Room " + toNo + " is already occupied.");
        }

        // Clear source room access immediately (old bookingRef/contact wiped and PIN rotated)
        if (source != null) {
            clearGuestFieldsAndMarkDirty(source);
            roomRepository.save(source);
        }

        // Assign fresh session ref on destination room so old room tokens remain unusable
        dest.setOccupied(true);
        dest.setReadiness("ready");
        dest.setBadgeStatus("OCCUPIED");
        dest.setGuestName(guestName);
        dest.setGuestEmail(guestEmail);
        dest.setGuestPhone(guestPhone);
        dest.setBookingRef(nextStayRef());
        dest.setCheckInDate(checkInDate);
        dest.setCheckOutDate(checkOutDate);
        dest.setDuration(duration);
        dest.setVip(vip);
        if (req.getToTypeFull() != null && !req.getToTypeFull().isBlank()) {
            dest.setTypeFull(req.getToTypeFull().trim());
        }
        dest.setPin(generateRandomPin());

        return RoomDto.fromEntity(roomRepository.save(dest));
    }

    private RoomDto clearRoomStay(Hotel hotel, String roomNumber) {
        String cleanRoomNo = roomNumber != null ? roomNumber.trim() : "";
        Room room = roomRepository.findByHotelAndRoomNumber(hotel, cleanRoomNo).orElse(null);
        if (room == null) {
            // Provision dirty vacant placeholder for seeded demo rooms not yet persisted in rooms table
            room = findOrProvisionRoom(hotel, cleanRoomNo, null, null, null);
        }
        clearGuestFieldsAndMarkDirty(room);
        Room saved = roomRepository.save(room);
        return RoomDto.fromEntity(saved);
    }

    private void clearGuestFieldsAndMarkDirty(Room room) {
        room.setOccupied(false);
        room.setReadiness("dirty");
        room.setBadgeStatus("CLEANING");
        room.setDnd(false);
        room.setGuestName(null);
        room.setGuestPhone(null);
        room.setGuestEmail(null);
        room.setBookingRef(null);
        room.setCheckInDate(null);
        room.setCheckOutDate(null);
        room.setDuration(null);
        room.setVip(false);
        room.setVipTier(null);
        room.setFolioBalance(null);
        room.setPreferences(null);
        room.setPin(generateRandomPin());
    }

    private void ensureNoContactConflict(Hotel hotel, String targetRoomNumber, GuestContactHelper.ValidatedContact contact) {
        List<Room> existingRooms = roomRepository.findByHotelOrderByFloorAscRoomNumberAsc(hotel);
        for (Room other : existingRooms) {
            if (other.getRoomNumber().equalsIgnoreCase(targetRoomNumber)) {
                continue;
            }
            boolean hasActiveStay = other.isOccupied() || "EXPECTED".equalsIgnoreCase(other.getBadgeStatus());
            if (!hasActiveStay) {
                continue;
            }
            if (contact.email() != null && GuestContactHelper.emailsMatch(other.getGuestEmail(), contact.email())) {
                throw new IllegalStateException(
                        "Email '" + contact.email() + "' is already registered to Room " + other.getRoomNumber() + ".");
            }
            if (contact.phone() != null && GuestContactHelper.phonesMatch(other.getGuestPhone(), contact.phone())) {
                throw new IllegalStateException(
                        "Phone number '" + contact.phone() + "' is already registered to Room " + other.getRoomNumber() + ".");
            }
        }
    }

    private Room findOrProvisionRoom(
            Hotel hotel, String roomNumber, Integer floorOpt, String typeTag, String typeFull) {
        return roomRepository.findByHotelAndRoomNumber(hotel, roomNumber).orElseGet(() -> {
            int floorNo = (floorOpt != null && floorOpt > 0) ? floorOpt : inferFloorNumber(roomNumber);
            if (!floorRepository.existsByHotelAndFloorNumber(hotel, floorNo)) {
                floorRepository.save(Floor.builder()
                        .hotel(hotel)
                        .floorNumber(floorNo)
                        .name("FLOOR " + floorNo)
                        .wing("Floor " + floorNo + " Wing")
                        .build());
            }
            return Room.builder()
                    .hotel(hotel)
                    .roomNumber(roomNumber)
                    .floor(floorNo)
                    .typeTag(typeTag != null && !typeTag.isBlank() ? typeTag.trim() : "DLX")
                    .typeFull(typeFull != null && !typeFull.isBlank() ? typeFull.trim() : "Deluxe Room")
                    .readiness("ready")
                    .occupied(false)
                    .dnd(false)
                    .badgeStatus("READY")
                    .pin(generateRandomPin())
                    .vip(false)
                    .build();
        });
    }

    private Hotel findHotelOrThrow(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new ResourceNotFoundException("Hotel slug is required.");
        }
        return hotelRepository.findBySlug(slug.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with slug: " + slug));
    }

    private static int inferFloorNumber(String roomNumber) {
        if (roomNumber != null && !roomNumber.isBlank()) {
            String digits = roomNumber.replaceAll("\\D", "");
            if (digits.length() >= 3) {
                try {
                    int f = Integer.parseInt(digits.substring(0, digits.length() - 2));
                    if (f > 0) return f;
                } catch (NumberFormatException ignored) {}
            }
            if (!digits.isEmpty()) {
                try {
                    int first = Integer.parseInt(digits.substring(0, 1));
                    if (first > 0) return first;
                } catch (NumberFormatException ignored) {}
            }
        }
        return 1;
    }

    private static String nextStayRef() {
        return "STAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private static String generateRandomPin() {
        return (1000 + RANDOM.nextInt(9000)) + "#";
    }

    private static String cleanOptional(String s) {
        return (s != null && !s.isBlank()) ? s.trim() : null;
    }
}
