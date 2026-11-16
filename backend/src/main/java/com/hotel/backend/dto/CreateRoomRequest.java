package com.hotel.backend.dto;

public class CreateRoomRequest {
    private String roomNumber;
    private Integer floor;
    private String typeTag;
    private String typeFull;
    private String readiness;
    private Boolean occupied;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
    private String pin;

    public CreateRoomRequest() {}

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getTypeTag() { return typeTag; }
    public void setTypeTag(String typeTag) { this.typeTag = typeTag; }

    public String getTypeFull() { return typeFull; }
    public void setTypeFull(String typeFull) { this.typeFull = typeFull; }

    public String getReadiness() { return readiness; }
    public void setReadiness(String readiness) { this.readiness = readiness; }

    public Boolean getOccupied() { return occupied; }
    public void setOccupied(Boolean occupied) { this.occupied = occupied; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
}
