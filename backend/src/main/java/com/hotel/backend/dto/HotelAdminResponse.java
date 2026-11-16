package com.hotel.backend.dto;

import java.time.LocalDateTime;

public class HotelAdminResponse {
    private Long id;
    private String name;
    private String slug;
    private String gmName;
    private String gmEmail;
    private boolean active;
    private LocalDateTime createdAt;

    public HotelAdminResponse() {}

    public HotelAdminResponse(Long id, String name, String slug, String gmName, String gmEmail, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.gmName = gmName;
        this.gmEmail = gmEmail;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String slug;
        private String gmName;
        private String gmEmail;
        private boolean active;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder gmName(String gmName) { this.gmName = gmName; return this; }
        public Builder gmEmail(String gmEmail) { this.gmEmail = gmEmail; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public HotelAdminResponse build() {
            return new HotelAdminResponse(id, name, slug, gmName, gmEmail, active, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getGmName() { return gmName; }
    public void setGmName(String gmName) { this.gmName = gmName; }

    public String getGmEmail() { return gmEmail; }
    public void setGmEmail(String gmEmail) { this.gmEmail = gmEmail; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
