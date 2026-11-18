package com.hotel.backend.controller;

import com.hotel.backend.dto.CreateEmployeeRequest;
import com.hotel.backend.dto.EmployeeCredentialResponse;
import com.hotel.backend.dto.EmployeeDto;
import com.hotel.backend.dto.ResetPasswordRequest;
import com.hotel.backend.dto.UpdateEmployeeRequest;
import com.hotel.backend.security.AuthenticatedUserPrincipal;
import com.hotel.backend.service.HotelEmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotels/{slug}/employees")
@PreAuthorize("@tenantAuth.canManageHotelStaff(authentication, #slug)")
public class HotelEmployeeController {

    private final HotelEmployeeService employeeService;

    public HotelEmployeeController(HotelEmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDto>> listEmployees(@PathVariable String slug) {
        return ResponseEntity.ok(employeeService.listEmployees(slug));
    }

    @PostMapping
    public ResponseEntity<EmployeeCredentialResponse> createEmployee(
            @PathVariable String slug,
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeCredentialResponse created = employeeService.createEmployee(slug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<EmployeeDto> getEmployee(
            @PathVariable String slug,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(employeeService.getEmployee(slug, employeeId));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<EmployeeDto> updateEmployee(
            @PathVariable String slug,
            @PathVariable Long employeeId,
            @Valid @RequestBody UpdateEmployeeRequest request,
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal) {
        Long actorId = principal != null ? principal.getUserId() : null;
        return ResponseEntity.ok(employeeService.updateEmployee(slug, employeeId, request, actorId));
    }

    @PatchMapping("/{employeeId}/status")
    public ResponseEntity<EmployeeDto> toggleEmployeeStatus(
            @PathVariable String slug,
            @PathVariable Long employeeId,
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal) {
        Long actorId = principal != null ? principal.getUserId() : null;
        return ResponseEntity.ok(employeeService.toggleEmployeeStatus(slug, employeeId, actorId));
    }

    @PostMapping("/{employeeId}/reset-password")
    public ResponseEntity<EmployeeCredentialResponse> resetEmployeePassword(
            @PathVariable String slug,
            @PathVariable Long employeeId,
            @Valid @RequestBody(required = false) ResetPasswordRequest request,
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal) {
        Long actorId = principal != null ? principal.getUserId() : null;
        return ResponseEntity.ok(employeeService.resetEmployeePassword(slug, employeeId, request, actorId));
    }
}
