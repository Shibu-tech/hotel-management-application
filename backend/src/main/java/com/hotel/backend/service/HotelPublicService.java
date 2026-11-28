package com.hotel.backend.service;

import com.hotel.backend.dto.HotelPublicDto;
import com.hotel.backend.dto.StaffPresetDto;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HotelPublicService {

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;

    public HotelPublicService(HotelRepository hotelRepository, UserRepository userRepository) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<HotelPublicDto> getPublicHotels() {
        return hotelRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(h -> {
                    User gm = userRepository.findFirstByHotelIdAndRole(h.getId(), Role.GENERAL_MANAGER).orElse(null);
                    return HotelPublicDto.builder()
                            .id(h.getId())
                            .name(h.getName())
                            .slug(h.getSlug())
                            .active(h.isActive())
                            .gmName(gm != null ? gm.getFullName() : null)
                            .gmEmail(gm != null ? gm.getEmail() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HotelPublicDto getPublicHotelById(Long hotelId) {
        if (hotelId == null || hotelId <= 0) {
            throw new ResourceNotFoundException("Invalid hotel ID: " + hotelId);
        }
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));
        User gm = userRepository.findFirstByHotelIdAndRole(hotel.getId(), Role.GENERAL_MANAGER).orElse(null);
        return HotelPublicDto.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .slug(hotel.getSlug())
                .active(hotel.isActive())
                .gmName(gm != null ? gm.getFullName() : null)
                .gmEmail(gm != null ? gm.getEmail() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<StaffPresetDto> getPublicStaffPresets(String slug) {
        if (slug == null || slug.isBlank()) {
            return Collections.emptyList();
        }
        Hotel hotel = hotelRepository.findBySlug(slug.trim().toLowerCase())
                .orElse(null);
        if (hotel == null || !hotel.isActive()) {
            return Collections.emptyList();
        }
        List<User> staff = userRepository.findByHotelIdWithDepartment(hotel.getId());
        return staff.stream()
                .filter(User::isActive)
                .map(u -> StaffPresetDto.builder()
                        .id(u.getId())
                        .name(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .hotelSlug(hotel.getSlug())
                        .departmentName(u.getDepartment() != null ? u.getDepartment().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }
}
