package com.hotel.backend.dto;

import com.hotel.backend.model.Room;

public class RoomDto {
    private String no;
    private int floor;
    private String typeTag;
    private String typeFull;
    private String readiness;
    private boolean occupied;
    private boolean dnd;
    private String badgeStatus;
    private String statusLabel;
    private String statusKind;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
    private String bookingRef;
    private String checkInDate;
    private String checkOutDate;
    private String duration;
    private Integer guestsCount;
    private String vipTier;
    private String folioBalance;
    private String preferences;
    private String cleanerAssigned;
    private String cleaningCategory;
    private boolean vip;
    private String pin;

    public RoomDto() {}

    public static RoomDto fromEntity(Room room) {
        RoomDto dto = new RoomDto();
        dto.setNo(room.getRoomNumber());
        dto.setFloor(room.getFloor());
        dto.setTypeTag(room.getTypeTag() != null ? room.getTypeTag() : "DLX");
        dto.setTypeFull(room.getTypeFull() != null ? room.getTypeFull() : "Deluxe Room");
        dto.setReadiness(room.getReadiness() != null ? room.getReadiness() : "ready");
        dto.setOccupied(room.isOccupied());
        dto.setDnd(room.isDnd());
        dto.setBadgeStatus(room.getBadgeStatus() != null ? room.getBadgeStatus() : (room.isOccupied() ? "OCCUPIED" : "READY"));
        dto.setGuestName(room.getGuestName());
        dto.setGuestPhone(room.getGuestPhone());
        dto.setGuestEmail(room.getGuestEmail());
        dto.setBookingRef(room.getBookingRef());
        dto.setCheckInDate(room.getCheckInDate());
        dto.setCheckOutDate(room.getCheckOutDate());
        dto.setDuration(room.getDuration());
        dto.setGuestsCount(room.getGuestsCount());
        dto.setVipTier(room.getVipTier());
        dto.setFolioBalance(room.getFolioBalance());
        dto.setPreferences(room.getPreferences());
        dto.setCleanerAssigned(room.getCleanerAssigned());
        dto.setCleaningCategory(room.getCleaningCategory());
        dto.setVip(room.isVip());
        dto.setPin(room.getPin());

        // Derived status fields for frontend display
        if (room.isDnd()) {
            dto.setStatusKind("dnd");
            dto.setStatusLabel("DND");
        } else if ("out_of_order".equalsIgnoreCase(room.getReadiness())) {
            dto.setStatusKind("dirty");
            dto.setStatusLabel("Out of Order");
        } else if ("cleaning".equalsIgnoreCase(room.getReadiness()) || "inspection_pending".equalsIgnoreCase(room.getReadiness())) {
            dto.setStatusKind("cleaning");
            dto.setStatusLabel("inspection_pending".equalsIgnoreCase(room.getReadiness()) ? "Inspection Pending" : "Cleaning");
        } else if ("dirty".equalsIgnoreCase(room.getReadiness())) {
            dto.setStatusKind("dirty");
            dto.setStatusLabel("Dirty");
        } else if (room.isOccupied()) {
            dto.setStatusKind("occupied");
            dto.setStatusLabel(room.getGuestName() != null ? room.getGuestName().split(" ")[0] : "Occupied");
        } else if ("EXPECTED".equalsIgnoreCase(room.getBadgeStatus()) && room.getGuestName() != null) {
            dto.setStatusKind("checkin");
            dto.setStatusLabel("Check-In · " + room.getGuestName().split(" ")[0]);
        } else {
            dto.setStatusKind("ready");
            dto.setStatusLabel("Ready");
        }

        return dto;
    }

    public String getNo() { return no; }
    public void setNo(String no) { this.no = no; }

    public int getFloor() { return floor; }
    public void setFloor(int floor) { this.floor = floor; }

    public String getTypeTag() { return typeTag; }
    public void setTypeTag(String typeTag) { this.typeTag = typeTag; }

    public String getTypeFull() { return typeFull; }
    public void setTypeFull(String typeFull) { this.typeFull = typeFull; }

    public String getReadiness() { return readiness; }
    public void setReadiness(String readiness) { this.readiness = readiness; }

    public boolean isOccupied() { return occupied; }
    public void setOccupied(boolean occupied) { this.occupied = occupied; }

    public boolean isDnd() { return dnd; }
    public void setDnd(boolean dnd) { this.dnd = dnd; }

    public String getBadgeStatus() { return badgeStatus; }
    public void setBadgeStatus(String badgeStatus) { this.badgeStatus = badgeStatus; }

    public String getStatusLabel() { return statusLabel; }
    public void setStatusLabel(String statusLabel) { this.statusLabel = statusLabel; }

    public String getStatusKind() { return statusKind; }
    public void setStatusKind(String statusKind) { this.statusKind = statusKind; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public String getBookingRef() { return bookingRef; }
    public void setBookingRef(String bookingRef) { this.bookingRef = bookingRef; }

    public String getCheckInDate() { return checkInDate; }
    public void setCheckInDate(String checkInDate) { this.checkInDate = checkInDate; }

    public String getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(String checkOutDate) { this.checkOutDate = checkOutDate; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Integer getGuestsCount() { return guestsCount; }
    public void setGuestsCount(Integer guestsCount) { this.guestsCount = guestsCount; }

    public String getVipTier() { return vipTier; }
    public void setVipTier(String vipTier) { this.vipTier = vipTier; }

    public String getFolioBalance() { return folioBalance; }
    public void setFolioBalance(String folioBalance) { this.folioBalance = folioBalance; }

    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }

    public String getCleanerAssigned() { return cleanerAssigned; }
    public void setCleanerAssigned(String cleanerAssigned) { this.cleanerAssigned = cleanerAssigned; }

    public String getCleaningCategory() { return cleaningCategory; }
    public void setCleaningCategory(String cleaningCategory) { this.cleaningCategory = cleaningCategory; }

    public boolean isVip() { return vip; }
    public void setVip(boolean vip) { this.vip = vip; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
}
