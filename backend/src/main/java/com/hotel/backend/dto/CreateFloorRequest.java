package com.hotel.backend.dto;

public class CreateFloorRequest {
    private Integer floor;
    private String name;
    private String wing;

    public CreateFloorRequest() {}

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getWing() { return wing; }
    public void setWing(String wing) { this.wing = wing; }
}
