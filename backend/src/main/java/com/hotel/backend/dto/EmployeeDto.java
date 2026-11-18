package com.hotel.backend.dto;

import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;

import java.time.LocalDateTime;

public class EmployeeDto {
    private Long id;
    private String employeeCode;
    private String fullName;
    private String email;
    private Role role;
    private Long hotelId;
    private String hotelSlug;
    private Long departmentId;
    private String departmentName;
    private boolean active;
    private boolean mustChangePassword;
    private LocalDateTime createdAt;

    public EmployeeDto() {}

    public EmployeeDto(
            Long id,
            String employeeCode,
            String fullName,
            String email,
            Role role,
            Long hotelId,
            String hotelSlug,
            Long departmentId,
            String departmentName,
            boolean active,
            boolean mustChangePassword,
            LocalDateTime createdAt) {
        this.id = id;
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.hotelId = hotelId;
        this.hotelSlug = hotelSlug;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.active = active;
        this.mustChangePassword = mustChangePassword;
        this.createdAt = createdAt;
    }

    public static EmployeeDto fromEntity(User u) {
        return new EmployeeDto(
                u.getId(),
                u.getEmployeeCode(),
                u.getFullName(),
                u.getEmail(),
                u.getRole(),
                u.getHotel() != null ? u.getHotel().getId() : null,
                u.getHotel() != null ? u.getHotel().getSlug() : null,
                u.getDepartment() != null ? u.getDepartment().getId() : null,
                u.getDepartment() != null ? u.getDepartment().getName() : null,
                u.isActive(),
                u.isMustChangePassword(),
                u.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getHotelSlug() { return hotelSlug; }
    public void setHotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
