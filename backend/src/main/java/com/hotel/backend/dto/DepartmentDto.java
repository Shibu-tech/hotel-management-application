package com.hotel.backend.dto;

import com.hotel.backend.model.Department;

import java.time.LocalDateTime;

public class DepartmentDto {
    private Long id;
    private Long hotelId;
    private String name;
    private boolean active;
    private LocalDateTime createdAt;

    public DepartmentDto() {}

    public DepartmentDto(Long id, Long hotelId, String name, boolean active, LocalDateTime createdAt) {
        this.id = id;
        this.hotelId = hotelId;
        this.name = name;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static DepartmentDto fromEntity(Department dept) {
        return new DepartmentDto(
                dept.getId(),
                dept.getHotel() != null ? dept.getHotel().getId() : null,
                dept.getName(),
                dept.isActive(),
                dept.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
