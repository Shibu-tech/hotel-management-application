package com.hotel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpsertStayRequest {

    @NotBlank(message = "Room number is required.")
    private String roomNumber;

    private Integer floor;
    private String typeTag;
    private String typeFull;

    @NotBlank(message = "Guest name is required.")
    @Size(min = 2, max = 120, message = "Guest name must be between 2 and 120 characters.")
    private String guestName;

    private String guestEmail;
    private String guestPhone;
    private String category; // "in_house", "departing", or "arriving"
    private String readiness;
    private String checkInDate;
    private String checkOutDate;
    private String duration;
    private String bookingRef;
    private String folioBalance;
    private boolean vip;

    public UpsertStayRequest() {}

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getTypeTag() { return typeTag; }
    public void setTypeTag(String typeTag) { this.typeTag = typeTag; }

    public String getTypeFull() { return typeFull; }
    public void setTypeFull(String typeFull) { this.typeFull = typeFull; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getReadiness() { return readiness; }
    public void setReadiness(String readiness) { this.readiness = readiness; }

    public String getCheckInDate() { return checkInDate; }
    public void setCheckInDate(String checkInDate) { this.checkInDate = checkInDate; }

    public String getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(String checkOutDate) { this.checkOutDate = checkOutDate; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getBookingRef() { return bookingRef; }
    public void setBookingRef(String bookingRef) { this.bookingRef = bookingRef; }

    public String getFolioBalance() { return folioBalance; }
    public void setFolioBalance(String folioBalance) { this.folioBalance = folioBalance; }

    public boolean isVip() { return vip; }
    public void setVip(boolean vip) { this.vip = vip; }
}
