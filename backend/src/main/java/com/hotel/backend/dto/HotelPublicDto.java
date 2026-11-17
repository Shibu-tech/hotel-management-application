package com.hotel.backend.dto;

public class HotelPublicDto {
    private Long id;
    private String name;
    private String slug;
    private boolean active = true;

    public HotelPublicDto() {}

    public HotelPublicDto(Long id, String name, String slug, boolean active) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.active = active;
    }

    public HotelPublicDto(Long id, String name, String slug) {
        this(id, name, slug, true);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String slug;
        private boolean active = true;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder slug(String slug) { this.slug = slug; return this; }
        public Builder active(boolean active) { this.active = active; return this; }

        public HotelPublicDto build() {
            return new HotelPublicDto(id, name, slug, active);
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
}
