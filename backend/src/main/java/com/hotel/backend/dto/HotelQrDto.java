package com.hotel.backend.dto;

public class HotelQrDto {

    private Long hotelId;
    private String name;
    private String slug;
    private String destinationUrl;
    private String qrImageUrl;
    private String qrDownloadUrl;
    private boolean active;

    public HotelQrDto() {}

    public HotelQrDto(Long hotelId, String name, String slug, String destinationUrl, String qrImageUrl, String qrDownloadUrl, boolean active) {
        this.hotelId = hotelId;
        this.name = name;
        this.slug = slug;
        this.destinationUrl = destinationUrl;
        this.qrImageUrl = qrImageUrl;
        this.qrDownloadUrl = qrDownloadUrl;
        this.active = active;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long hotelId;
        private String name;
        private String slug;
        private String destinationUrl;
        private String qrImageUrl;
        private String qrDownloadUrl;
        private boolean active;

        public Builder hotelId(Long hotelId) {
            this.hotelId = hotelId;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder slug(String slug) {
            this.slug = slug;
            return this;
        }

        public Builder destinationUrl(String destinationUrl) {
            this.destinationUrl = destinationUrl;
            return this;
        }

        public Builder qrImageUrl(String qrImageUrl) {
            this.qrImageUrl = qrImageUrl;
            return this;
        }

        public Builder qrDownloadUrl(String qrDownloadUrl) {
            this.qrDownloadUrl = qrDownloadUrl;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        public HotelQrDto build() {
            return new HotelQrDto(hotelId, name, slug, destinationUrl, qrImageUrl, qrDownloadUrl, active);
        }
    }

    public Long getHotelId() {
        return hotelId;
    }

    public void setHotelId(Long hotelId) {
        this.hotelId = hotelId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDestinationUrl() {
        return destinationUrl;
    }

    public void setDestinationUrl(String destinationUrl) {
        this.destinationUrl = destinationUrl;
    }

    public String getQrImageUrl() {
        return qrImageUrl;
    }

    public void setQrImageUrl(String qrImageUrl) {
        this.qrImageUrl = qrImageUrl;
    }

    public String getQrDownloadUrl() {
        return qrDownloadUrl;
    }

    public void setQrDownloadUrl(String qrDownloadUrl) {
        this.qrDownloadUrl = qrDownloadUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
