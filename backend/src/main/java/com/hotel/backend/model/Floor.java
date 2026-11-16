package com.hotel.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "floors",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_hotel_floor_number", columnNames = {"hotel_id", "floor_number"})
    },
    indexes = {
        @Index(name = "idx_floor_hotel", columnList = "hotel_id")
    }
)
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 120)
    private String wing;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Floor() {}

    public Floor(Long id, Hotel hotel, Integer floorNumber, String name, String wing) {
        this.id = id;
        this.hotel = hotel;
        this.floorNumber = floorNumber;
        this.name = name;
        this.wing = wing;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Hotel hotel;
        private Integer floorNumber;
        private String name;
        private String wing;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder hotel(Hotel hotel) { this.hotel = hotel; return this; }
        public Builder floorNumber(Integer floorNumber) { this.floorNumber = floorNumber; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder wing(String wing) { this.wing = wing; return this; }

        public Floor build() {
            return new Floor(id, hotel, floorNumber, name, wing);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }

    public Integer getFloorNumber() { return floorNumber; }
    public void setFloorNumber(Integer floorNumber) { this.floorNumber = floorNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getWing() { return wing; }
    public void setWing(String wing) { this.wing = wing; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
