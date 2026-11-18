package com.hotel.backend.controller;

import com.hotel.backend.dto.CreateDepartmentRequest;
import com.hotel.backend.dto.DepartmentDto;
import com.hotel.backend.dto.UpdateDepartmentRequest;
import com.hotel.backend.service.HotelDepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotels/{slug}/departments")
public class HotelDepartmentController {

    private final HotelDepartmentService departmentService;

    public HotelDepartmentController(HotelDepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    @PreAuthorize("@tenantAuth.canAccessHotelBySlug(authentication, #slug)")
    public ResponseEntity<List<DepartmentDto>> listDepartments(@PathVariable String slug) {
        return ResponseEntity.ok(departmentService.listDepartments(slug));
    }

    @PostMapping
    @PreAuthorize("@tenantAuth.canManageDepartments(authentication, #slug)")
    public ResponseEntity<DepartmentDto> createDepartment(
            @PathVariable String slug,
            @Valid @RequestBody CreateDepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(departmentService.createDepartment(slug, request));
    }

    @PutMapping("/{departmentId}")
    @PreAuthorize("@tenantAuth.canManageDepartments(authentication, #slug)")
    public ResponseEntity<DepartmentDto> updateDepartment(
            @PathVariable String slug,
            @PathVariable Long departmentId,
            @Valid @RequestBody UpdateDepartmentRequest request) {
        return ResponseEntity.ok(departmentService.updateDepartment(slug, departmentId, request));
    }

    @PatchMapping("/{departmentId}/status")
    @PreAuthorize("@tenantAuth.canManageDepartments(authentication, #slug)")
    public ResponseEntity<DepartmentDto> toggleDepartmentStatus(
            @PathVariable String slug,
            @PathVariable Long departmentId) {
        return ResponseEntity.ok(departmentService.toggleDepartmentStatus(slug, departmentId));
    }
}
