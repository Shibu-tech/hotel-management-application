package com.hotel.backend.dto;

import java.util.List;
import java.util.Map;

public class HotelInventoryResponse {
    private String hotelSlug;
    private String hotelName;
    private List<RoomDto> allRooms;
    private List<Integer> floors;
    private Map<Integer, FloorDto> floorInfo;

    public HotelInventoryResponse() {}

    public HotelInventoryResponse(String hotelSlug, String hotelName, List<RoomDto> allRooms, List<Integer> floors, Map<Integer, FloorDto> floorInfo) {
        this.hotelSlug = hotelSlug;
        this.hotelName = hotelName;
        this.allRooms = allRooms;
        this.floors = floors;
        this.floorInfo = floorInfo;
    }

    public String getHotelSlug() { return hotelSlug; }
    public void setHotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; }

    public String getHotelName() { return hotelName; }
    public void setHotelName(String hotelName) { this.hotelName = hotelName; }

    public List<RoomDto> getAllRooms() { return allRooms; }
    public void setAllRooms(List<RoomDto> allRooms) { this.allRooms = allRooms; }

    public List<Integer> getFloors() { return floors; }
    public void setFloors(List<Integer> floors) { this.floors = floors; }

    public Map<Integer, FloorDto> getFloorInfo() { return floorInfo; }
    public void setFloorInfo(Map<Integer, FloorDto> floorInfo) { this.floorInfo = floorInfo; }
}
