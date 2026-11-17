package com.hotel.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "rooms",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_hotel_room_number", columnNames = {"hotel_id", "room_number"})
    },
    indexes = {
        @Index(name = "idx_room_hotel_floor", columnList = "hotel_id, floor")
    }
)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(nullable = false)
    private Integer floor;

    @Column(name = "type_tag", length = 20)
    private String typeTag; // KNG, TWN, STE, PRS, RYL, PNT, etc.

    @Column(name = "type_full", length = 100)
    private String typeFull; // Deluxe King, Suite, etc.

    @Column(nullable = false, length = 40)
    private String readiness = "ready"; // ready, dirty, cleaning, inspection_pending, out_of_order

    @Column(nullable = false)
    private boolean occupied = false;

    @Column(nullable = false)
    private boolean dnd = false;

    @Column(name = "badge_status", length = 40)
    private String badgeStatus = "READY";

    @Column(name = "guest_name", length = 120)
    private String guestName;

    @Column(name = "guest_phone", length = 40)
    private String guestPhone;

    @Column(name = "guest_email", length = 120)
    private String guestEmail;

    @Column(name = "booking_ref", length = 60)
    private String bookingRef;

    @Column(name = "check_in_date", length = 60)
    private String checkInDate;

    @Column(name = "check_out_date", length = 60)
    private String checkOutDate;

    @Column(length = 60)
    private String duration;

    @Column(name = "guests_count")
    private Integer guestsCount = 1;

    @Column(name = "vip_tier", length = 60)
    private String vipTier;

    @Column(name = "folio_balance", length = 60)
    private String folioBalance;

    @Column(length = 1000)
    private String preferences;

    @Column(name = "cleaner_assigned", length = 120)
    private String cleanerAssigned;

    @Column(name = "cleaning_category", length = 60)
    private String cleaningCategory;

    @Column(nullable = false)
    private boolean vip = false;

    @Column(length = 20)
    private String pin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Room() {}

    public Room(Long id, Hotel hotel, String roomNumber, Integer floor, String typeTag, String typeFull,
                String readiness, boolean occupied, boolean dnd, String badgeStatus, String guestName,
                String guestPhone, String guestEmail, String bookingRef, String checkInDate,
                String checkOutDate, String duration, Integer guestsCount, String vipTier,
                String folioBalance, String preferences, String cleanerAssigned, String cleaningCategory,
                boolean vip, String pin) {
        this.id = id;
        this.hotel = hotel;
        this.roomNumber = roomNumber;
        this.floor = floor;
        this.typeTag = typeTag;
        this.typeFull = typeFull;
        this.readiness = readiness != null ? readiness : "ready";
        this.occupied = occupied;
        this.dnd = dnd;
        this.badgeStatus = badgeStatus != null ? badgeStatus : (occupied ? "OCCUPIED" : "READY");
        this.guestName = guestName;
        this.guestPhone = guestPhone;
        this.guestEmail = guestEmail;
        this.bookingRef = bookingRef;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.duration = duration;
        this.guestsCount = guestsCount != null ? guestsCount : 1;
        this.vipTier = vipTier;
        this.folioBalance = folioBalance;
        this.preferences = preferences;
        this.cleanerAssigned = cleanerAssigned;
        this.cleaningCategory = cleaningCategory;
        this.vip = vip;
        this.pin = pin;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Hotel hotel;
        private String roomNumber;
        private Integer floor;
        private String typeTag;
        private String typeFull;
        private String readiness = "ready";
        private boolean occupied = false;
        private boolean dnd = false;
        private String badgeStatus = "READY";
        private String guestName;
        private String guestPhone;
        private String guestEmail;
        private String bookingRef;
        private String checkInDate;
        private String checkOutDate;
        private String duration;
        private Integer guestsCount = 1;
        private String vipTier;
        private String folioBalance;
        private String preferences;
        private String cleanerAssigned;
        private String cleaningCategory;
        private boolean vip = false;
        private String pin;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder hotel(Hotel hotel) { this.hotel = hotel; return this; }
        public Builder roomNumber(String roomNumber) { this.roomNumber = roomNumber; return this; }
        public Builder floor(Integer floor) { this.floor = floor; return this; }
        public Builder typeTag(String typeTag) { this.typeTag = typeTag; return this; }
        public Builder typeFull(String typeFull) { this.typeFull = typeFull; return this; }
        public Builder readiness(String readiness) { this.readiness = readiness; return this; }
        public Builder occupied(boolean occupied) { this.occupied = occupied; return this; }
        public Builder dnd(boolean dnd) { this.dnd = dnd; return this; }
        public Builder badgeStatus(String badgeStatus) { this.badgeStatus = badgeStatus; return this; }
        public Builder guestName(String guestName) { this.guestName = guestName; return this; }
        public Builder guestPhone(String guestPhone) { this.guestPhone = guestPhone; return this; }
        public Builder guestEmail(String guestEmail) { this.guestEmail = guestEmail; return this; }
        public Builder bookingRef(String bookingRef) { this.bookingRef = bookingRef; return this; }
        public Builder checkInDate(String checkInDate) { this.checkInDate = checkInDate; return this; }
        public Builder checkOutDate(String checkOutDate) { this.checkOutDate = checkOutDate; return this; }
        public Builder duration(String duration) { this.duration = duration; return this; }
        public Builder guestsCount(Integer guestsCount) { this.guestsCount = guestsCount; return this; }
        public Builder vipTier(String vipTier) { this.vipTier = vipTier; return this; }
        public Builder folioBalance(String folioBalance) { this.folioBalance = folioBalance; return this; }
        public Builder preferences(String preferences) { this.preferences = preferences; return this; }
        public Builder cleanerAssigned(String cleanerAssigned) { this.cleanerAssigned = cleanerAssigned; return this; }
        public Builder cleaningCategory(String cleaningCategory) { this.cleaningCategory = cleaningCategory; return this; }
        public Builder vip(boolean vip) { this.vip = vip; return this; }
        public Builder pin(String pin) { this.pin = pin; return this; }

        public Room build() {
            return new Room(id, hotel, roomNumber, floor, typeTag, typeFull, readiness, occupied,
                    dnd, badgeStatus, guestName, guestPhone, guestEmail, bookingRef, checkInDate,
                    checkOutDate, duration, guestsCount, vipTier, folioBalance, preferences,
                    cleanerAssigned, cleaningCategory, vip, pin);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }

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

    public boolean isOccupied() { return occupied; }
    public void setOccupied(boolean occupied) { this.occupied = occupied; }

    public boolean isDnd() { return dnd; }
    public void setDnd(boolean dnd) { this.dnd = dnd; }

    public String getBadgeStatus() { return badgeStatus; }
    public void setBadgeStatus(String badgeStatus) { this.badgeStatus = badgeStatus; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
