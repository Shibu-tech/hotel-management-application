package com.hotel.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class MoveStayRequest {

    @NotBlank(message = "Source room number is required.")
    private String fromRoomNumber;

    @NotBlank(message = "Destination room number is required.")
    private String toRoomNumber;

    private Integer toFloor;
    private String toTypeTag;
    private String toTypeFull;

    // Fallback metadata if source room was seeded only in frontend store before first sync
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private String checkInDate;
    private String checkOutDate;
    private String duration;
    private boolean vip;

    public MoveStayRequest() {}

    public String getFromRoomNumber() { return fromRoomNumber; }
    public void setFromRoomNumber(String fromRoomNumber) { this.fromRoomNumber = fromRoomNumber; }

    public String getToRoomNumber() { return toRoomNumber; }
    public void setToRoomNumber(String toRoomNumber) { this.toRoomNumber = toRoomNumber; }

    public Integer getToFloor() { return toFloor; }
    public void setToFloor(Integer toFloor) { this.toFloor = toFloor; }

    public String getToTypeTag() { return toTypeTag; }
    public void setToTypeTag(String toTypeTag) { this.toTypeTag = toTypeTag; }

    public String getToTypeFull() { return toTypeFull; }
    public void setToTypeFull(String toTypeFull) { this.toTypeFull = toTypeFull; }

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

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public boolean isVip() { return vip; }
    public void setVip(boolean vip) { this.vip = vip; }
}
