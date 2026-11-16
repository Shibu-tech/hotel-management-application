package com.hotel.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateHotelRequest {

    @NotBlank(message = "Hotel name is required")
    @Size(max = 120, message = "Hotel name cannot exceed 120 characters")
    private String name;

    @NotBlank(message = "Hotel slug is required")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase alphanumeric characters and hyphens")
    @Size(max = 80, message = "Slug cannot exceed 80 characters")
    private String slug;

    @NotBlank(message = "General Manager full name is required")
    @Size(max = 120, message = "Name cannot exceed 120 characters")
    private String gmName;

    @NotBlank(message = "General Manager email is required")
    @Email(message = "Invalid General Manager email format")
    private String gmEmail;

    @NotBlank(message = "Initial password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    public CreateHotelRequest() {}

    public CreateHotelRequest(String name, String slug, String gmName, String gmEmail, String password) {
        this.name = name;
        this.slug = slug;
        this.gmName = gmName;
        this.gmEmail = gmEmail;
        this.password = password;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String name;
        private String slug;
        private String gmName;
        private String gmEmail;
        private String password;

        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder gmName(String gmName) { this.gmName = gmName; return this; }
        public Builder gmEmail(String gmEmail) { this.gmEmail = gmEmail; return this; }
        public Builder password(String password) { this.password = password; return this; }

        public CreateHotelRequest build() {
            return new CreateHotelRequest(name, slug, gmName, gmEmail, password);
        }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getGmName() { return gmName; }
    public void setGmName(String gmName) { this.gmName = gmName; }

    public String getGmEmail() { return gmEmail; }
    public void setGmEmail(String gmEmail) { this.gmEmail = gmEmail; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
