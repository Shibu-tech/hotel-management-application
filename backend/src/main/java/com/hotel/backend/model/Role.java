package com.hotel.backend.model;

/**
 * Exact 6 system roles:
 * - ADMIN: Global platform administrator managing all N hotels (hotel_id = NULL)
 * - GENERAL_MANAGER: Executive leadership tied to a specific hotel tenant
 * - SUPERVISOR: Department dispatcher and operational supervisor
 * - FRONT_DESK: Front desk coordinator handling rooms, stays, check-in/out
 * - FULFILLER: Task fulfiller (housekeeper, engineer, runner)
 * - GUEST: In-room guest portal user
 */
public enum Role {
    ADMIN,
    GENERAL_MANAGER,
    SUPERVISOR,
    FRONT_DESK,
    FULFILLER,
    GUEST
}
