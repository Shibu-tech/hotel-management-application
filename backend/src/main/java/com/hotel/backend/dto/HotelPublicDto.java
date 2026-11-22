package com.hotel.backend.dto;

public class HotelPublicDto {
    private Long id;
    private String name;
    private String slug;
    private boolean active = true;
    private String gmName;
    private String gmEmail;

    public HotelPublicDto() {}

    public HotelPublicDto(Long id, String name, String slug, boolean active, String gmName, String gmEmail) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.active = active;
        this.gmName = gmName;
        this.gmEmail = gmEmail;
    }

    public HotelPublicDto(Long id, String name, String slug, boolean active) {
        this(id, name, slug, active, null, null);
    }

    public HotelPublicDto(Long id, String name, String slug) {
        this(id, name, slug, true, null, null);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String slug;
        private boolean active = true;
        private String gmName;
        private String gmEmail;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder active(boolean active) { this.active = active; return this; }
        public Builder gmName(String gmName) { this.gmName = gmName; return this; }
        public Builder gmEmail(String gmEmail) { this.gmEmail = gmEmail; return this; }

        public HotelPublicDto build() {
            return new HotelPublicDto(id, name, slug, active, gmName, gmEmail);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getGmName() { return gmName; }
    public void setGmName(String gmName) { this.gmName = gmName; }

    public String getGmEmail() { return gmEmail; }
    public void setGmEmail(String gmEmail) { this.gmEmail = gmEmail; }
}
