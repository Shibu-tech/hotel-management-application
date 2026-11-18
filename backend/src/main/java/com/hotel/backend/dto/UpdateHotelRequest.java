package com.hotel.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateHotelRequest {

    @NotBlank(message = "Hotel name is required")
    @Size(max = 120, message = "Hotel name cannot exceed 120 characters")
    private String name;

    @Email(message = "Invalid hotel contact email format")
    @Size(max = 150, message = "Contact email cannot exceed 150 characters")
    private String contactEmail;

    @Size(max = 40, message = "Contact phone cannot exceed 40 characters")
    private String contactPhone;

    @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

    public UpdateHotelRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
