package com.hotel.backend.controller;

import com.hotel.backend.dto.HotelPublicDto;
import com.hotel.backend.service.HotelPublicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class PublicHotelController {

    private final HotelPublicService hotelPublicService;

    public PublicHotelController(HotelPublicService hotelPublicService) {
        this.hotelPublicService = hotelPublicService;
    }

    /**
     * Requirement 3:
     * Fetch and display a dropdown/list of all active hotels registered in the system
     * for the Multi-Hotel / Multi-Tenant mode selector.
     */
    @GetMapping("/public-list")
    public ResponseEntity<List<HotelPublicDto>> getPublicHotelList() {
        List<HotelPublicDto> list = hotelPublicService.getPublicHotels();
        return ResponseEntity.ok(list);
    }
}
