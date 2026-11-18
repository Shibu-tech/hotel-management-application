package com.hotel.backend.dto;

import java.time.LocalDateTime;

public class HotelAdminResponse {
    private Long id;
    private String name;
    private String slug;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String gmName;
    private String gmEmail;
    private boolean active;
    private LocalDateTime createdAt;

    public HotelAdminResponse() {}

    public HotelAdminResponse(
            Long id, String name, String slug, String contactEmail, String contactPhone, String address,
            String gmName, String gmEmail, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.address = address;
        this.gmName = gmName;
        this.gmEmail = gmEmail;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String name;
        private String slug;
        private String contactEmail;
        private String contactPhone;
        private String address;
        private String gmName;
        private String gmEmail;
        private boolean active;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder contactEmail(String contactEmail) { this.contactEmail = contactEmail; return this; }
        public Builder contactPhone(String contactPhone) { this.contactPhone = contactPhone; return this; }
        public Builder address(String address) { this.address = address; return this; }
        public Builder gmName(String gmName) { this.gmName = gmName; return this; }
        public Builder gmEmail(String gmEmail) { this.gmEmail = gmEmail; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public HotelAdminResponse build() {
            return new HotelAdminResponse(id, name, slug, contactEmail, contactPhone, address,
                    gmName, gmEmail, active, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getGmName() { return gmName; }
    public void setGmName(String gmName) { this.gmName = gmName; }

    public String getGmEmail() { return gmEmail; }
    public void setGmEmail(String gmEmail) { this.gmEmail = gmEmail; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
