package com.hotel.backend.service;

import com.hotel.backend.dto.*;
import com.hotel.backend.model.Floor;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Room;
import com.hotel.backend.repository.FloorRepository;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HotelRoomService {

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;

    public HotelRoomService(
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            FloorRepository floorRepository) {
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.floorRepository = floorRepository;
    }

    @Transactional(readOnly = true)
    public HotelInventoryResponse getInventory(String slug) {
        Hotel hotel = hotelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found with slug: " + slug));

        List<Room> rooms = roomRepository.findByHotelOrderByFloorAscRoomNumberAsc(hotel);
        List<Floor> floors = floorRepository.findByHotelOrderByFloorNumberAsc(hotel);

        List<RoomDto> roomDtos = rooms.stream().map(RoomDto::fromEntity).collect(Collectors.toList());

        Map<Integer, FloorDto> floorInfoMap = new LinkedHashMap<>();
        Set<Integer> uniqueFloors = new TreeSet<>();

        for (Floor f : floors) {
            floorInfoMap.put(f.getFloorNumber(), FloorDto.fromEntity(f));
            uniqueFloors.add(f.getFloorNumber());
        }

        // Also ensure floors from rooms are present
        for (Room r : rooms) {
            uniqueFloors.add(r.getFloor());
            if (!floorInfoMap.containsKey(r.getFloor())) {
                floorInfoMap.put(r.getFloor(), new FloorDto(r.getFloor(), "FLOOR " + r.getFloor(), "Wing " + r.getFloor()));
            }
        }

        return new HotelInventoryResponse(
                hotel.getSlug(),
                hotel.getName(),
                roomDtos,
                new ArrayList<>(uniqueFloors),
                floorInfoMap
        );
    }

    @Transactional
    public RoomDto addRoom(String slug, CreateRoomRequest req) {
        Hotel hotel = hotelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found with slug: " + slug));

        String roomNo = req.getRoomNumber() != null ? req.getRoomNumber().trim() : "";
        if (roomNo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room number is required");
        }
        if (req.getFloor() == null || req.getFloor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid positive floor number is required");
        }

        if (roomRepository.existsByHotelAndRoomNumber(hotel, roomNo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room " + roomNo + " already exists in hotel " + slug);
        }

        // Ensure floor exists
        if (!floorRepository.existsByHotelAndFloorNumber(hotel, req.getFloor())) {
            Floor newFloor = Floor.builder()
                    .hotel(hotel)
                    .floorNumber(req.getFloor())
                    .name("FLOOR " + req.getFloor())
                    .wing("Floor " + req.getFloor() + " Wing")
                    .build();
            floorRepository.save(newFloor);
        }

        boolean occupied = Boolean.TRUE.equals(req.getOccupied());
        String readiness = req.getReadiness() != null ? req.getReadiness().trim().toLowerCase() : "ready";
        String badgeStatus = occupied ? "OCCUPIED" : (readiness.equalsIgnoreCase("ready") ? "READY" : readiness.toUpperCase());

        String pin = req.getPin();
        if (pin == null || pin.isEmpty()) {
            try {
                int n = Integer.parseInt(roomNo.replaceAll("\\D+", ""));
                int code = ((n * 137 + 49) % 9000) + 1000;
                pin = code + "#";
            } catch (Exception e) {
                pin = "1001#";
            }
        }

        Room room = Room.builder()
                .hotel(hotel)
                .roomNumber(roomNo)
                .floor(req.getFloor())
                .typeTag(req.getTypeTag() != null ? req.getTypeTag() : "DLX")
                .typeFull(req.getTypeFull() != null ? req.getTypeFull() : "Deluxe Room")
                .readiness(readiness)
                .occupied(occupied)
                .dnd(false)
                .badgeStatus(badgeStatus)
                .guestName(req.getGuestName())
                .guestPhone(req.getGuestPhone())
                .guestEmail(req.getGuestEmail())
                .pin(pin)
                .vip(false)
                .build();

        Room saved = roomRepository.save(room);
        return RoomDto.fromEntity(saved);
    }

    @Transactional
    public void deleteRoom(String slug, String roomNo) {
        Hotel hotel = hotelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found with slug: " + slug));

        roomRepository.deleteByHotelAndRoomNumber(hotel, roomNo);
    }

    @Transactional
    public FloorDto addFloor(String slug, CreateFloorRequest req) {
        Hotel hotel = hotelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found with slug: " + slug));

        if (req.getFloor() == null || req.getFloor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid positive floor number is required");
        }

        if (floorRepository.existsByHotelAndFloorNumber(hotel, req.getFloor())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Floor " + req.getFloor() + " already exists in hotel " + slug);
        }

        String name = req.getName() != null && !req.getName().trim().isEmpty() ? req.getName().trim() : "FLOOR " + req.getFloor();
        String wing = req.getWing() != null && !req.getWing().trim().isEmpty() ? req.getWing().trim() : "Floor " + req.getFloor() + " Wing";

        Floor floor = Floor.builder()
                .hotel(hotel)
                .floorNumber(req.getFloor())
                .name(name)
                .wing(wing)
                .build();

        Floor saved = floorRepository.save(floor);
        return FloorDto.fromEntity(saved);
    }

    @Transactional
    public void deleteFloor(String slug, Integer floorNumber) {
        Hotel hotel = hotelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found with slug: " + slug));

        // Delete all rooms on this floor
        roomRepository.deleteByHotelAndFloor(hotel, floorNumber);
        // Delete the floor itself
        floorRepository.deleteByHotelAndFloorNumber(hotel, floorNumber);
    }
}
