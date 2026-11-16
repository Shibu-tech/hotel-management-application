package com.hotel.backend.dto;

public class HotelQrUrlResponse {

    private Long hotelId;
    private String url;

    public HotelQrUrlResponse() {}

    public HotelQrUrlResponse(Long hotelId, String url) {
        this.hotelId = hotelId;
        this.url = url;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long hotelId;
        private String url;

        public Builder hotelId(Long hotelId) {
            this.hotelId = hotelId;
            return this;
        }

        public Builder url(String url) {
            this.url = url;
            return this;
        }

        public HotelQrUrlResponse build() {
            return new HotelQrUrlResponse(hotelId, url);
        }
    }

    public Long getHotelId() {
        return hotelId;
    }

    public void setHotelId(Long hotelId) {
        this.hotelId = hotelId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
