package com.hotel.backend.service;

import com.hotel.backend.dto.GuestLoginRequest;
import com.hotel.backend.dto.GuestSessionResponse;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.exception.TooManyRequestsException;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Room;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.RoomRepository;
import com.hotel.backend.security.JwtUtil;
import com.hotel.backend.security.LoginRateLimiter;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * Passwordless QR Guest Portal authentication using registered email or phone number.
 * Strictly binds each session to an active occupied room stay and immediately revokes access on checkout.
 */
@Service
public class GuestAuthService {

    public record GuestLoginResult(GuestSessionResponse session, String token) {}

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final HotelStayService hotelStayService;
    private final JwtUtil jwtUtil;
    private final LoginRateLimiter rateLimiter;

    public GuestAuthService(
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            HotelStayService hotelStayService,
            JwtUtil jwtUtil,
            LoginRateLimiter rateLimiter) {
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.hotelStayService = hotelStayService;
        this.jwtUtil = jwtUtil;
        this.rateLimiter = rateLimiter;
    }

    @Transactional(noRollbackFor = {BadCredentialsException.class, AccessDeniedException.class})
    public GuestLoginResult loginWithIdentifier(GuestLoginRequest request, String clientIp) {
        String rawIdentifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        if (rawIdentifier.isEmpty()) {
            throw new IllegalArgumentException("Please enter your registered email address or phone number.");
        }

        String ipKey = "guest-ip:" + (clientIp != null ? clientIp : "unknown");
        String idKey = "guest-id:" + rawIdentifier.toLowerCase();
        if (!rateLimiter.isAllowed(ipKey) || !rateLimiter.isAllowed(idKey)) {
            throw new TooManyRequestsException("Too many verification attempts. Please wait a moment before trying again.");
        }

        Hotel hotel = hotelRepository.findById(request.getHotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + request.getHotelId()));
        if (!hotel.isActive()) {
            throw new AccessDeniedException("This hotel property is currently inactive.");
        }

        boolean isEmailLookup = rawIdentifier.contains("@");
        String normalizedEmail = isEmailLookup ? GuestContactHelper.normalizeEmail(rawIdentifier) : null;
        String normalizedPhone = !isEmailLookup ? GuestContactHelper.normalizePhone(rawIdentifier) : null;
        String canonicalSubject = isEmailLookup ? normalizedEmail : GuestContactHelper.extractDigits(normalizedPhone);

        List<Room> rooms = roomRepository.findByHotelOrderByFloorAscRoomNumberAsc(hotel);

        Room matchedActiveRoom = rooms.stream()
                .filter(Room::isOccupied)
                .filter(r -> matchesContact(r, isEmailLookup, normalizedEmail, normalizedPhone))
                .findFirst()
                .orElse(null);

        if (matchedActiveRoom != null) {
            if (matchedActiveRoom.getBookingRef() == null || matchedActiveRoom.getBookingRef().isBlank()) {
                matchedActiveRoom.setBookingRef("STAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
                matchedActiveRoom = roomRepository.save(matchedActiveRoom);
            }
            String token = jwtUtil.generateGuestToken(hotel, matchedActiveRoom, canonicalSubject);
            return new GuestLoginResult(toSessionResponse(hotel, matchedActiveRoom), token);
        }

        // Provide clear feedback when a reservation is registered for arrival but Front Desk hasn't checked them in yet
        Room matchedExpectedRoom = rooms.stream()
                .filter(r -> !r.isOccupied() && "EXPECTED".equalsIgnoreCase(r.getBadgeStatus()))
                .filter(r -> matchesContact(r, isEmailLookup, normalizedEmail, normalizedPhone))
                .findFirst()
                .orElse(null);

        if (matchedExpectedRoom != null) {
            throw new AccessDeniedException(
                    "Your stay for Room " + matchedExpectedRoom.getRoomNumber()
                            + " is registered as arriving. Please ask Front Desk to complete check-in to unlock your room portal.");
        }

        throw new BadCredentialsException(
                "No active stay found for that email or phone number at " + hotel.getName()
                        + ". Please verify your details with Front Desk.");
    }

    @Transactional(readOnly = true)
    public GuestSessionResponse verifyGuestSession(String token) {
        if (token == null || token.isBlank()) {
            throw new BadCredentialsException("No active guest session found.");
        }

        Claims claims;
        try {
            claims = jwtUtil.extractAllClaims(token);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid or expired guest session.");
        }

        if (!jwtUtil.isGuestToken(claims)) {
            throw new BadCredentialsException("Invalid guest session token.");
        }

        Number hotelIdNum = claims.get("hotelId", Number.class);
        String roomNumber = claims.get("roomNumber", String.class);
        String stayRef = claims.get("stayRef", String.class);
        String subjectIdentifier = claims.getSubject();

        if (hotelIdNum == null || roomNumber == null || roomNumber.isBlank()
                || stayRef == null || stayRef.isBlank() || subjectIdentifier == null) {
            throw new BadCredentialsException("Incomplete guest session.");
        }

        Hotel hotel = hotelRepository.findById(hotelIdNum.longValue())
                .orElseThrow(() -> new BadCredentialsException("Hotel property no longer exists."));
        if (!hotel.isActive()) {
            throw new BadCredentialsException("Hotel property is currently inactive.");
        }

        Room room = roomRepository.findByHotelAndRoomNumber(hotel, roomNumber)
                .orElseThrow(() -> new BadCredentialsException("Room session no longer exists."));

        // Immediate revocation on check-out or room move
        boolean stillCheckedIn = room.isOccupied()
                && room.getBookingRef() != null
                && stayRef.equals(room.getBookingRef());

        if (!stillCheckedIn) {
            throw new BadCredentialsException("Your stay has ended. Room portal access has been revoked.");
        }

        boolean isEmailSubject = subjectIdentifier.contains("@");
        boolean contactStillRegistered = isEmailSubject
                ? GuestContactHelper.emailsMatch(room.getGuestEmail(), subjectIdentifier)
                : GuestContactHelper.phonesMatch(room.getGuestPhone(), subjectIdentifier);

        if (!contactStillRegistered) {
            throw new BadCredentialsException("Guest room access credentials have been revoked.");
        }

        return toSessionResponse(hotel, room);
    }

    @Transactional
    public void checkoutCurrentGuestSession(String token) {
        GuestSessionResponse session = verifyGuestSession(token);
        Hotel hotel = hotelRepository.findById(session.getHotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found."));
        hotelStayService.checkOutStayByHotelAndRoom(hotel, session.getRoomNumber());
    }

    private boolean matchesContact(Room room, boolean isEmailLookup, String normalizedEmail, String normalizedPhone) {
        if (isEmailLookup) {
            return GuestContactHelper.emailsMatch(room.getGuestEmail(), normalizedEmail);
        }
        return GuestContactHelper.phonesMatch(room.getGuestPhone(), normalizedPhone);
    }

    private GuestSessionResponse toSessionResponse(Hotel hotel, Room room) {
        String encodedRoom = URLEncoder.encode(room.getRoomNumber(), StandardCharsets.UTF_8);
        String redirectUrl = "/hotel/" + hotel.getSlug() + "/guest?room=" + encodedRoom;
        return GuestSessionResponse.builder()
                .hotelId(hotel.getId())
                .hotelName(hotel.getName())
                .hotelSlug(hotel.getSlug())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getTypeFull())
                .guestName(room.getGuestName())
                .guestEmail(room.getGuestEmail())
                .guestPhone(room.getGuestPhone())
                .checkInDate(room.getCheckInDate())
                .checkOutDate(room.getCheckOutDate())
                .bookingRef(room.getBookingRef())
                .vip(room.isVip())
                .redirectUrl(redirectUrl)
                .build();
    }
}
