package com.hotel.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    /**
     * Optional tenant scope when Multi-Hotel mode is selected.
     * If user is global ADMIN, hotelSlug is null or ignored.
     */
    private String hotelSlug;

    public LoginRequest() {}

    public LoginRequest(String email, String password, String hotelSlug) {
        this.email = email;
        this.password = password;
        this.hotelSlug = hotelSlug;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String email;
        private String password;
        private String hotelSlug;

        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder hotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; return this; }

        public LoginRequest build() {
            return new LoginRequest(email, password, hotelSlug);
        }
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getHotelSlug() { return hotelSlug; }
    public void setHotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; }
}
