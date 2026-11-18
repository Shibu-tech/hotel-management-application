package com.hotel.backend.dto;

import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    /**
     * Optional custom temporary password. If null/blank, a cryptographically secure password is generated.
     */
    @Size(min = 8, max = 128, message = "Temporary password must be between 8 and 128 characters")
    private String temporaryPassword;

    public ResetPasswordRequest() {}

    public ResetPasswordRequest(String temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }

    public String getTemporaryPassword() { return temporaryPassword; }
    public void setTemporaryPassword(String temporaryPassword) { this.temporaryPassword = temporaryPassword; }
}
