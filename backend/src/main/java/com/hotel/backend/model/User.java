package com.hotel.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_hotel_id", columnList = "hotel_id"),
    @Index(name = "idx_user_role", columnList = "role"),
    @Index(name = "idx_user_department_id", columnList = "department_id"),
    @Index(name = "idx_user_employee_code", columnList = "employee_code")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role;

    @Column(name = "employee_code", length = 40)
    private String employeeCode;

    /**
     * Global ADMIN has hotel_id = NULL so a single platform owner account manages all N hotels.
     * All other roles (GENERAL_MANAGER, SUPERVISOR, FRONT_DESK, FULFILLER, GUEST) belong to exactly one hotel.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = true)
    private Hotel hotel;

    /**
     * Optional hotel-scoped department (required for SUPERVISOR & FULFILLER; optional for FRONT_DESK; NULL for ADMIN & GM).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = true)
    private Department department;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = false;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "token_version", nullable = false)
    private long tokenVersion = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public User() {}

    public User(
            Long id,
            String email,
            String password,
            String fullName,
            Role role,
            String employeeCode,
            Hotel hotel,
            Department department,
            boolean active,
            boolean mustChangePassword,
            int failedLoginAttempts,
            LocalDateTime lockedUntil,
            long tokenVersion,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.employeeCode = employeeCode;
        this.hotel = hotel;
        this.department = department;
        this.active = active;
        this.mustChangePassword = mustChangePassword;
        this.failedLoginAttempts = failedLoginAttempts;
        this.lockedUntil = lockedUntil;
        this.tokenVersion = tokenVersion;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String email;
        private String password;
        private String fullName;
        private Role role;
        private String employeeCode;
        private Hotel hotel;
        private Department department;
        private boolean active = true;
        private boolean mustChangePassword = false;
        private int failedLoginAttempts = 0;
        private LocalDateTime lockedUntil;
        private long tokenVersion = 0L;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder role(Role role) { this.role = role; return this; }
        public Builder employeeCode(String employeeCode) { this.employeeCode = employeeCode; return this; }
        public Builder hotel(Hotel hotel) { this.hotel = hotel; return this; }
        public Builder department(Department department) { this.department = department; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder mustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; return this; }
        public Builder failedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; return this; }
        public Builder lockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; return this; }
        public Builder tokenVersion(long tokenVersion) { this.tokenVersion = tokenVersion; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public User build() {
            return new User(id, email, password, fullName, role, employeeCode, hotel, department,
                    active, mustChangePassword, failedLoginAttempts, lockedUntil, tokenVersion, createdAt, updatedAt);
        }
    }

    @PrePersist
    @PreUpdate
    private void validateTenantAssociation() {
        if (this.role == Role.ADMIN) {
            this.hotel = null;
            this.department = null;
            return;
        }
        if (this.hotel == null) {
            throw new IllegalStateException("Non-ADMIN user with role " + this.role + " must be assigned to a specific hotel tenant.");
        }
        if (this.department != null && this.department.getHotel() != null && this.hotel.getId() != null
                && this.department.getHotel().getId() != null
                && !this.department.getHotel().getId().equals(this.hotel.getId())) {
            throw new IllegalStateException("User department must belong to the same hotel tenant.");
        }
    }

    public void incrementTokenVersion() {
        this.tokenVersion = this.tokenVersion + 1;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    public long getTokenVersion() { return tokenVersion; }
    public void setTokenVersion(long tokenVersion) { this.tokenVersion = tokenVersion; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
