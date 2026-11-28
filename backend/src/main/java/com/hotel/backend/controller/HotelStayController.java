package com.hotel.backend.controller;

import com.hotel.backend.dto.MoveStayRequest;
import com.hotel.backend.dto.RoomDto;
import com.hotel.backend.dto.UpsertStayRequest;
import com.hotel.backend.service.HotelStayService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotels/{slug}/stays")
@PreAuthorize("@tenantAuth.canManageRooms(authentication, #slug)")
public class HotelStayController {

    private final HotelStayService hotelStayService;

    public HotelStayController(HotelStayService hotelStayService) {
        this.hotelStayService = hotelStayService;
    }

    @PostMapping
    public ResponseEntity<RoomDto> upsertStay(
            @PathVariable String slug,
            @Valid @RequestBody UpsertStayRequest request) {
        return ResponseEntity.ok(hotelStayService.upsertStay(slug, request));
    }

    @PostMapping("/{roomNumber}/check-in")
    public ResponseEntity<RoomDto> checkInStay(
            @PathVariable String slug,
            @PathVariable String roomNumber) {
        return ResponseEntity.ok(hotelStayService.checkInStay(slug, roomNumber));
    }

    @PostMapping("/{roomNumber}/check-out")
    public ResponseEntity<RoomDto> checkOutStay(
            @PathVariable String slug,
            @PathVariable String roomNumber) {
        return ResponseEntity.ok(hotelStayService.checkOutStay(slug, roomNumber));
    }

    @PostMapping("/move")
    public ResponseEntity<RoomDto> moveStay(
            @PathVariable String slug,
            @Valid @RequestBody MoveStayRequest request) {
        return ResponseEntity.ok(hotelStayService.moveStay(slug, request));
    }
}
