package com.hotel.backend.service;

import com.hotel.backend.dto.HotelPublicDto;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.repository.HotelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HotelPublicService {

    private final HotelRepository hotelRepository;

    public HotelPublicService(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    @Transactional(readOnly = true)
    public List<HotelPublicDto> getPublicHotels() {
        return hotelRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(h -> HotelPublicDto.builder()
                        .id(h.getId())
                        .name(h.getName())
                        .slug(h.getSlug())
                        .active(h.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HotelPublicDto getPublicHotelById(Long hotelId) {
        if (hotelId == null || hotelId <= 0) {
            throw new ResourceNotFoundException("Invalid hotel ID: " + hotelId);
        }
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));
        return HotelPublicDto.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .slug(hotel.getSlug())
                .active(hotel.isActive())
                .build();
    }
}
