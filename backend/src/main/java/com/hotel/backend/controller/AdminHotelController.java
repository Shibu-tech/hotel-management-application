package com.hotel.backend.controller;

import com.hotel.backend.dto.CreateHotelRequest;
import com.hotel.backend.dto.HotelAdminResponse;
import com.hotel.backend.service.AdminHotelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/hotels")
@PreAuthorize("hasRole('ADMIN')")
public class AdminHotelController {

    private final AdminHotelService adminHotelService;

    public AdminHotelController(AdminHotelService adminHotelService) {
        this.adminHotelService = adminHotelService;
    }

    /**
     * Requirement 2:
     * Returns a list of all active hotels in the database with their slugs, names, and General Manager emails.
     */
    @GetMapping
    public ResponseEntity<List<HotelAdminResponse>> getAllHotels() {
        List<HotelAdminResponse> hotels = adminHotelService.getAllHotelsForAdmin();
        return ResponseEntity.ok(hotels);
    }

    /**
     * Requirement 2:
     * Allows the global ADMIN to dynamically create a new hotel tenant AND provision
     * its first GENERAL_MANAGER account in a single @Transactional operation.
     */
    @PostMapping
    public ResponseEntity<HotelAdminResponse> createHotel(@Valid @RequestBody CreateHotelRequest request) {
        HotelAdminResponse createdHotel = adminHotelService.createHotelWithGeneralManager(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHotel);
    }

    /**
     * Allows the global ADMIN to dynamically delete a hotel tenant and its associated accounts.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHotel(@PathVariable Long id) {
        adminHotelService.deleteHotel(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Allows the global ADMIN to toggle hotel active status (suspend / reactivate).
     */
    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<HotelAdminResponse> toggleHotelActive(@PathVariable Long id) {
        HotelAdminResponse updated = adminHotelService.toggleHotelActive(id);
        return ResponseEntity.ok(updated);
    }
}
