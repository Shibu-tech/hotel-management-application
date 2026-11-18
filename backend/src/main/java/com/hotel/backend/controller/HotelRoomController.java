package com.hotel.backend.controller;

import com.hotel.backend.dto.*;
import com.hotel.backend.service.HotelRoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hotels/{slug}")
public class HotelRoomController {

    private final HotelRoomService hotelRoomService;

    public HotelRoomController(HotelRoomService hotelRoomService) {
        this.hotelRoomService = hotelRoomService;
    }

    @GetMapping("/rooms")
    @PreAuthorize("@tenantAuth.canReadRooms(authentication, #slug)")
    public ResponseEntity<HotelInventoryResponse> getInventory(@PathVariable String slug) {
        HotelInventoryResponse response = hotelRoomService.getInventory(slug);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/rooms")
    @PreAuthorize("@tenantAuth.canManageRooms(authentication, #slug)")
    public ResponseEntity<RoomDto> addRoom(
            @PathVariable String slug,
            @RequestBody CreateRoomRequest request) {
        RoomDto created = hotelRoomService.addRoom(slug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/rooms/{roomNo}")
    @PreAuthorize("@tenantAuth.canManageRooms(authentication, #slug)")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable String slug,
            @PathVariable String roomNo) {
        hotelRoomService.deleteRoom(slug, roomNo);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/floors")
    @PreAuthorize("@tenantAuth.canManageRooms(authentication, #slug)")
    public ResponseEntity<FloorDto> addFloor(
            @PathVariable String slug,
            @RequestBody CreateFloorRequest request) {
        FloorDto created = hotelRoomService.addFloor(slug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/floors/{floor}")
    @PreAuthorize("@tenantAuth.canManageRooms(authentication, #slug)")
    public ResponseEntity<Void> deleteFloor(
            @PathVariable String slug,
            @PathVariable Integer floor) {
        hotelRoomService.deleteFloor(slug, floor);
        return ResponseEntity.noContent().build();
    }
}
