package com.hotel.backend.security;

import com.hotel.backend.model.Role;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Reusable multi-tenant authorization service invoked via @PreAuthorize("@tenantAuth....").
 * Never trusts frontend-supplied hotelId/role; always inspects the DB-backed AuthenticatedUserPrincipal.
 */
@Service("tenantAuth")
public class TenantAuthorizationService {

    public boolean isAdmin(Authentication authentication) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        return p != null && p.isActive() && p.getRole() == Role.ADMIN;
    }

    /**
     * Platform ADMIN or the GENERAL_MANAGER belonging to the target hotel slug.
     */
    public boolean canManageHotelStaff(Authentication authentication, String slug) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        if (p == null || !p.isActive() || slug == null || slug.isBlank()) {
            return false;
        }
        if (p.getRole() == Role.ADMIN) {
            return true;
        }
        return p.getRole() == Role.GENERAL_MANAGER && matchesHotelSlug(p, slug);
    }

    /**
     * Strictly the GENERAL_MANAGER belonging to the target hotel slug (or ADMIN for platform oversight).
     */
    public boolean canManageDepartments(Authentication authentication, String slug) {
        return canManageHotelStaff(authentication, slug);
    }

    /**
     * Any authenticated employee belonging to the target hotel slug (or ADMIN).
     */
    public boolean canAccessHotelBySlug(Authentication authentication, String slug) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        if (p == null || !p.isActive() || slug == null || slug.isBlank()) {
            return false;
        }
        if (p.getRole() == Role.ADMIN) {
            return true;
        }
        return matchesHotelSlug(p, slug);
    }

    /**
     * Room/floor read access: ADMIN or any active staff member of that exact hotel.
     */
    public boolean canReadRooms(Authentication authentication, String slug) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        if (p == null || !p.isActive() || slug == null || slug.isBlank()) {
            return false;
        }
        if (p.getRole() == Role.ADMIN) {
            return true;
        }
        return matchesHotelSlug(p, slug) && (
                p.getRole() == Role.GENERAL_MANAGER
                        || p.getRole() == Role.FRONT_DESK
                        || p.getRole() == Role.SUPERVISOR
                        || p.getRole() == Role.FULFILLER
        );
    }

    /**
     * Room/floor write access: ADMIN or GENERAL_MANAGER / FRONT_DESK / SUPERVISOR of that exact hotel.
     */
    public boolean canManageRooms(Authentication authentication, String slug) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        if (p == null || !p.isActive() || slug == null || slug.isBlank()) {
            return false;
        }
        if (p.getRole() == Role.ADMIN) {
            return true;
        }
        return matchesHotelSlug(p, slug) && (
                p.getRole() == Role.GENERAL_MANAGER
                        || p.getRole() == Role.FRONT_DESK
                        || p.getRole() == Role.SUPERVISOR
        );
    }

    /**
     * QR management endpoints: ADMIN (any hotel) or GENERAL_MANAGER of that exact hotelId.
     */
    public boolean canManageHotelQr(Authentication authentication, Long hotelId) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        if (p == null || !p.isActive() || hotelId == null) {
            return false;
        }
        if (p.getRole() == Role.ADMIN) {
            return true;
        }
        return p.getRole() == Role.GENERAL_MANAGER && hotelId.equals(p.getHotelId());
    }

    /**
     * Department-scoped resource check for SUPERVISOR / FULFILLER.
     */
    public boolean canAccessDepartment(Authentication authentication, String slug, Long departmentId) {
        AuthenticatedUserPrincipal p = extractPrincipal(authentication);
        if (p == null || !p.isActive() || slug == null || departmentId == null) {
            return false;
        }
        if (p.getRole() == Role.ADMIN) {
            return true;
        }
        if (!matchesHotelSlug(p, slug)) {
            return false;
        }
        if (p.getRole() == Role.GENERAL_MANAGER) {
            return true;
        }
        return (p.getRole() == Role.SUPERVISOR || p.getRole() == Role.FULFILLER)
                && departmentId.equals(p.getDepartmentId());
    }

    private boolean matchesHotelSlug(AuthenticatedUserPrincipal p, String slug) {
        return p.getHotelSlug() != null && p.getHotelSlug().equalsIgnoreCase(slug.trim());
    }

    private AuthenticatedUserPrincipal extractPrincipal(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthenticatedUserPrincipal authPrincipal) {
            return authPrincipal;
        }
        return null;
    }
}
