package com.hotel.backend.security;

import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.Principal;
import java.util.Collection;
import java.util.Collections;

/**
 * Immutable authenticated user principal stored in Spring SecurityContext.
 * Populated exclusively from trusted PostgreSQL user/hotel/department records after JWT verification.
 */
public class AuthenticatedUserPrincipal implements Principal {

    private final Long userId;
    private final String email;
    private final String fullName;
    private final Role role;
    private final String employeeCode;
    private final Long hotelId;
    private final String hotelSlug;
    private final String hotelName;
    private final Long departmentId;
    private final String departmentName;
    private final boolean active;
    private final boolean mustChangePassword;
    private final long tokenVersion;

    public AuthenticatedUserPrincipal(
            Long userId,
            String email,
            String fullName,
            Role role,
            String employeeCode,
            Long hotelId,
            String hotelSlug,
            String hotelName,
            Long departmentId,
            String departmentName,
            boolean active,
            boolean mustChangePassword,
            long tokenVersion) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.employeeCode = employeeCode;
        this.hotelId = hotelId;
        this.hotelSlug = hotelSlug;
        this.hotelName = hotelName;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.active = active;
        this.mustChangePassword = mustChangePassword;
        this.tokenVersion = tokenVersion;
    }

    public static AuthenticatedUserPrincipal fromUser(User user) {
        Long hId = user.getHotel() != null ? user.getHotel().getId() : null;
        String hSlug = user.getHotel() != null ? user.getHotel().getSlug() : null;
        String hName = user.getHotel() != null ? user.getHotel().getName() : null;
        Long dId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        String dName = user.getDepartment() != null ? user.getDepartment().getName() : null;
        return new AuthenticatedUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getEmployeeCode(),
                hId,
                hSlug,
                hName,
                dId,
                dName,
                user.isActive(),
                user.isMustChangePassword(),
                user.getTokenVersion()
        );
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getName() {
        return email;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public Role getRole() { return role; }
    public String getEmployeeCode() { return employeeCode; }
    public Long getHotelId() { return hotelId; }
    public String getHotelSlug() { return hotelSlug; }
    public String getHotelName() { return hotelName; }
    public Long getDepartmentId() { return departmentId; }
    public String getDepartmentName() { return departmentName; }
    public boolean isActive() { return active; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public long getTokenVersion() { return tokenVersion; }
}
