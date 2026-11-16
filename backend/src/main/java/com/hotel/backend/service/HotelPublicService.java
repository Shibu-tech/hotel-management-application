package com.hotel.backend.service;

import com.hotel.backend.dto.HotelPublicDto;
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
                        .build())
                .collect(Collectors.toList());
    }
}
