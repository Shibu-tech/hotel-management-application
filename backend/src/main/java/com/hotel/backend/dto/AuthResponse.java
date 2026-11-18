package com.hotel.backend.dto;

import com.hotel.backend.model.Role;

/**
 * Non-sensitive authentication session payload returned by /api/auth/login, /api/auth/me,
 * and /api/auth/change-password. Session JWT is transmitted exclusively via HttpOnly cookie.
 */
public class AuthResponse {
    private Long userId;
    private String email;
    private String fullName;
    private Role role;
    private String employeeCode;
    private Long hotelId;
    private String hotelName;
    private String hotelSlug;
    private Long departmentId;
    private String departmentName;
    private boolean mustChangePassword;
    private String redirectUrl;

    public AuthResponse() {}

    public AuthResponse(
            Long userId,
            String email,
            String fullName,
            Role role,
            String employeeCode,
            Long hotelId,
            String hotelName,
            String hotelSlug,
            Long departmentId,
            String departmentName,
            boolean mustChangePassword,
            String redirectUrl) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.employeeCode = employeeCode;
        this.hotelId = hotelId;
        this.hotelName = hotelName;
        this.hotelSlug = hotelSlug;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.mustChangePassword = mustChangePassword;
        this.redirectUrl = redirectUrl;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long userId;
        private String email;
        private String fullName;
        private Role role;
        private String employeeCode;
        private Long hotelId;
        private String hotelName;
        private String hotelSlug;
        private Long departmentId;
        private String departmentName;
        private boolean mustChangePassword;
        private String redirectUrl;

        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder role(Role role) { this.role = role; return this; }
        public Builder employeeCode(String employeeCode) { this.employeeCode = employeeCode; return this; }
        public Builder hotelId(Long hotelId) { this.hotelId = hotelId; return this; }
        public Builder hotelName(String hotelName) { this.hotelName = hotelName; return this; }
        public Builder hotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; return this; }
        public Builder departmentId(Long departmentId) { this.departmentId = departmentId; return this; }
        public Builder departmentName(String departmentName) { this.departmentName = departmentName; return this; }
        public Builder mustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; return this; }
        public Builder redirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; return this; }

        public AuthResponse build() {
            return new AuthResponse(userId, email, fullName, role, employeeCode, hotelId, hotelName,
                    hotelSlug, departmentId, departmentName, mustChangePassword, redirectUrl);
        }
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getHotelName() { return hotelName; }
    public void setHotelName(String hotelName) { this.hotelName = hotelName; }

    public String getHotelSlug() { return hotelSlug; }
    public void setHotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
}
