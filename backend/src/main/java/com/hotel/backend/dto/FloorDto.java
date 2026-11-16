package com.hotel.backend.dto;

import com.hotel.backend.model.Floor;

public class FloorDto {
    private int floor;
    private String name;
    private String wing;

    public FloorDto() {}

    public FloorDto(int floor, String name, String wing) {
        this.floor = floor;
        this.name = name;
        this.wing = wing;
    }

    public static FloorDto fromEntity(Floor floor) {
        return new FloorDto(floor.getFloorNumber(), floor.getName(), floor.getWing());
    }

    public int getFloor() { return floor; }
    public void setFloor(int floor) { this.floor = floor; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getWing() { return wing; }
    public void setWing(String wing) { this.wing = wing; }
}
