package com.hotel.backend.controller;

import com.hotel.backend.dto.CreateHotelRequest;
import com.hotel.backend.dto.EmployeeCredentialResponse;
import com.hotel.backend.dto.HotelAdminResponse;
import com.hotel.backend.dto.ResetPasswordRequest;
import com.hotel.backend.dto.UpdateHotelRequest;
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

    @GetMapping
    public ResponseEntity<List<HotelAdminResponse>> getAllHotels() {
        return ResponseEntity.ok(adminHotelService.getAllHotelsForAdmin());
    }

    @PostMapping
    public ResponseEntity<HotelAdminResponse> createHotel(@Valid @RequestBody CreateHotelRequest request) {
        HotelAdminResponse createdHotel = adminHotelService.createHotelWithGeneralManager(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHotel);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HotelAdminResponse> updateHotel(
            @PathVariable Long id,
            @Valid @RequestBody UpdateHotelRequest request) {
        return ResponseEntity.ok(adminHotelService.updateHotel(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHotel(@PathVariable Long id) {
        adminHotelService.deleteHotel(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<HotelAdminResponse> toggleHotelActive(@PathVariable Long id) {
        return ResponseEntity.ok(adminHotelService.toggleHotelActive(id));
    }

    @PostMapping("/{id}/reset-gm-password")
    public ResponseEntity<EmployeeCredentialResponse> resetGmPassword(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ResetPasswordRequest request) {
        return ResponseEntity.ok(adminHotelService.resetGeneralManagerPassword(id, request));
    }
}
