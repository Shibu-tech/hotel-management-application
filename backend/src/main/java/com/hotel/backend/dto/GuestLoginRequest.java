package com.hotel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GuestLoginRequest {

    @NotNull(message = "Hotel ID is required.")
    private Long hotelId;

    @NotBlank(message = "Please enter your email address or phone number.")
    private String identifier;

    public GuestLoginRequest() {}

    public GuestLoginRequest(Long hotelId, String identifier) {
        this.hotelId = hotelId;
        this.identifier = identifier;
    }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
}
