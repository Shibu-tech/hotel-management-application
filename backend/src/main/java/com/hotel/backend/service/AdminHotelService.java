package com.hotel.backend.service;

import com.hotel.backend.dto.CreateHotelRequest;
import com.hotel.backend.dto.HotelAdminResponse;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminHotelService {

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminHotelService(
            HotelRepository hotelRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Requirement 2:
     * Returns a list of all active hotels in the database with their slugs, names, and General Manager emails.
     */
    @Transactional(readOnly = true)
    public List<HotelAdminResponse> getAllHotelsForAdmin() {
        return hotelRepository.findAll().stream().map(hotel -> {
            Optional<User> gm = userRepository.findFirstByHotelIdAndRole(hotel.getId(), Role.GENERAL_MANAGER);
            return HotelAdminResponse.builder()
                    .id(hotel.getId())
                    .name(hotel.getName())
                    .slug(hotel.getSlug())
                    .gmName(gm.map(User::getFullName).orElse("Not Assigned"))
                    .gmEmail(gm.map(User::getEmail).orElse("Not Assigned"))
                    .active(hotel.isActive())
                    .createdAt(hotel.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Requirement 2:
     * Allows the global ADMIN to dynamically create a new hotel tenant AND provision
     * its first GENERAL_MANAGER account in a single @Transactional operation.
     */
    @Transactional
    public HotelAdminResponse createHotelWithGeneralManager(CreateHotelRequest request) {
        String cleanSlug = request.getSlug().trim().toLowerCase();
        if (hotelRepository.existsBySlug(cleanSlug)) {
            throw new IllegalArgumentException("A hotel with slug '" + cleanSlug + "' already exists.");
        }

        String cleanGmEmail = request.getGmEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanGmEmail)) {
            throw new IllegalArgumentException("A user with email '" + cleanGmEmail + "' already exists.");
        }

        // 1. Create and persist new hotel tenant
        Hotel hotel = Hotel.builder()
                .name(request.getName().trim())
                .slug(cleanSlug)
                .active(true)
                .build();
        Hotel savedHotel = hotelRepository.save(hotel);

        // 2. Provision its first GENERAL_MANAGER account tied via FK to hotel
        User gm = User.builder()
                .fullName(request.getGmName().trim())
                .email(cleanGmEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.GENERAL_MANAGER)
                .hotel(savedHotel)
                .active(true)
                .build();
        User savedGm = userRepository.save(gm);

        return HotelAdminResponse.builder()
                .id(savedHotel.getId())
                .name(savedHotel.getName())
                .slug(savedHotel.getSlug())
                .gmName(savedGm.getFullName())
                .gmEmail(savedGm.getEmail())
                .active(savedHotel.isActive())
                .createdAt(savedHotel.getCreatedAt())
                .build();
    }

    /**
     * Allows the global ADMIN to dynamically remove a hotel tenant and its associated staff accounts from the database.
     */
    @Transactional
    public void deleteHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new IllegalArgumentException("Hotel not found with id: " + hotelId));
        userRepository.deleteByHotelId(hotelId);
        hotelRepository.delete(hotel);
    }

    /**
     * Allows the global ADMIN to dynamically activate or deactivate a hotel tenant.
     */
    @Transactional
    public HotelAdminResponse toggleHotelActive(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new IllegalArgumentException("Hotel not found with id: " + hotelId));
        hotel.setActive(!hotel.isActive());
        Hotel updated = hotelRepository.save(hotel);
        Optional<User> gm = userRepository.findFirstByHotelIdAndRole(updated.getId(), Role.GENERAL_MANAGER);
        return HotelAdminResponse.builder()
                .id(updated.getId())
                .name(updated.getName())
                .slug(updated.getSlug())
                .gmName(gm.map(User::getFullName).orElse("Not Assigned"))
                .gmEmail(gm.map(User::getEmail).orElse("Not Assigned"))
                .active(updated.isActive())
                .createdAt(updated.getCreatedAt())
                .build();
    }
}
