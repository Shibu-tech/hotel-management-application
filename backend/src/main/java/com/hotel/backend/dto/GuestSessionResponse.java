package com.hotel.backend.dto;

public class GuestSessionResponse {

    private Long hotelId;
    private String hotelName;
    private String hotelSlug;
    private String roomNumber;
    private String roomType;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private String checkInDate;
    private String checkOutDate;
    private String bookingRef;
    private boolean vip;
    private String redirectUrl;

    public GuestSessionResponse() {}

    public GuestSessionResponse(
            Long hotelId, String hotelName, String hotelSlug, String roomNumber, String roomType,
            String guestName, String guestEmail, String guestPhone, String checkInDate,
            String checkOutDate, String bookingRef, boolean vip, String redirectUrl) {
        this.hotelId = hotelId;
        this.hotelName = hotelName;
        this.hotelSlug = hotelSlug;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.guestPhone = guestPhone;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.bookingRef = bookingRef;
        this.vip = vip;
        this.redirectUrl = redirectUrl;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long hotelId;
        private String hotelName;
        private String hotelSlug;
        private String roomNumber;
        private String roomType;
        private String guestName;
        private String guestEmail;
        private String guestPhone;
        private String checkInDate;
        private String checkOutDate;
        private String bookingRef;
        private boolean vip;
        private String redirectUrl;

        public Builder hotelId(Long hotelId) { this.hotelId = hotelId; return this; }
        public Builder hotelName(String hotelName) { this.hotelName = hotelName; return this; }
        public Builder hotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; return this; }
        public Builder roomNumber(String roomNumber) { this.roomNumber = roomNumber; return this; }
        public Builder roomType(String roomType) { this.roomType = roomType; return this; }
        public Builder guestName(String guestName) { this.guestName = guestName; return this; }
        public Builder guestEmail(String guestEmail) { this.guestEmail = guestEmail; return this; }
        public Builder guestPhone(String guestPhone) { this.guestPhone = guestPhone; return this; }
        public Builder checkInDate(String checkInDate) { this.checkInDate = checkInDate; return this; }
        public Builder checkOutDate(String checkOutDate) { this.checkOutDate = checkOutDate; return this; }
        public Builder bookingRef(String bookingRef) { this.bookingRef = bookingRef; return this; }
        public Builder vip(boolean vip) { this.vip = vip; return this; }
        public Builder redirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; return this; }

        public GuestSessionResponse build() {
            return new GuestSessionResponse(hotelId, hotelName, hotelSlug, roomNumber, roomType,
                    guestName, guestEmail, guestPhone, checkInDate, checkOutDate, bookingRef, vip, redirectUrl);
        }
    }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getHotelName() { return hotelName; }
    public void setHotelName(String hotelName) { this.hotelName = hotelName; }

    public String getHotelSlug() { return hotelSlug; }
    public void setHotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

    public String getCheckInDate() { return checkInDate; }
    public void setCheckInDate(String checkInDate) { this.checkInDate = checkInDate; }

    public String getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(String checkOutDate) { this.checkOutDate = checkOutDate; }

    public String getBookingRef() { return bookingRef; }
    public void setBookingRef(String bookingRef) { this.bookingRef = bookingRef; }

    public boolean isVip() { return vip; }
    public void setVip(boolean vip) { this.vip = vip; }

    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }
}
