package com.hotel.backend.service;

import com.hotel.backend.dto.CreateHotelRequest;
import com.hotel.backend.dto.EmployeeCredentialResponse;
import com.hotel.backend.dto.EmployeeDto;
import com.hotel.backend.dto.HotelAdminResponse;
import com.hotel.backend.dto.ResetPasswordRequest;
import com.hotel.backend.dto.UpdateHotelRequest;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.DepartmentRepository;
import com.hotel.backend.repository.FloorRepository;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.RoomRepository;
import com.hotel.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdminHotelService {

    private static final String TEMP_PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminHotelService(
            HotelRepository hotelRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            RoomRepository roomRepository,
            FloorRepository floorRepository,
            PasswordEncoder passwordEncoder) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.roomRepository = roomRepository;
        this.floorRepository = floorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<HotelAdminResponse> getAllHotelsForAdmin() {
        return hotelRepository.findAll().stream()
                .map(this::toAdminResponse)
                .collect(Collectors.toList());
    }

    /**
     * Dynamically creates a new hotel tenant AND provisions its initial GENERAL_MANAGER
     * atomically in a single @Transactional operation.
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

        Hotel hotel = Hotel.builder()
                .name(request.getName().trim())
                .slug(cleanSlug)
                .contactEmail(cleanOptional(request.getContactEmail()))
                .contactPhone(cleanOptional(request.getContactPhone()))
                .address(cleanOptional(request.getAddress()))
                .active(true)
                .build();
        Hotel savedHotel = hotelRepository.save(hotel);

        User gm = User.builder()
                .fullName(request.getGmName().trim())
                .email(cleanGmEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.GENERAL_MANAGER)
                .employeeCode("GM-0001")
                .hotel(savedHotel)
                .active(true)
                .mustChangePassword(true)
                .build();
        User savedGm = userRepository.save(gm);

        return HotelAdminResponse.builder()
                .id(savedHotel.getId())
                .name(savedHotel.getName())
                .slug(savedHotel.getSlug())
                .contactEmail(savedHotel.getContactEmail())
                .contactPhone(savedHotel.getContactPhone())
                .address(savedHotel.getAddress())
                .gmName(savedGm.getFullName())
                .gmEmail(savedGm.getEmail())
                .active(savedHotel.isActive())
                .createdAt(savedHotel.getCreatedAt())
                .build();
    }

    @Transactional
    public HotelAdminResponse updateHotel(Long hotelId, UpdateHotelRequest request) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));

        hotel.setName(request.getName().trim());
        hotel.setContactEmail(cleanOptional(request.getContactEmail()));
        hotel.setContactPhone(cleanOptional(request.getContactPhone()));
        hotel.setAddress(cleanOptional(request.getAddress()));

        Hotel updated = hotelRepository.save(hotel);
        return toAdminResponse(updated);
    }

    @Transactional
    public void deleteHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));
        roomRepository.deleteByHotelId(hotelId);
        floorRepository.deleteByHotelId(hotelId);
        userRepository.deleteByHotelId(hotelId);
        departmentRepository.deleteByHotelId(hotelId);
        hotelRepository.delete(hotel);
    }

    @Transactional
    public HotelAdminResponse toggleHotelActive(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));

        boolean nextActive = !hotel.isActive();
        hotel.setActive(nextActive);
        Hotel updated = hotelRepository.save(hotel);

        // If suspending hotel, immediately invalidate active sessions of all staff belonging to this hotel
        if (!nextActive) {
            List<User> hotelUsers = userRepository.findByHotelId(hotelId);
            for (User u : hotelUsers) {
                u.incrementTokenVersion();
            }
            userRepository.saveAll(hotelUsers);
        }

        return toAdminResponse(updated);
    }

    @Transactional
    public EmployeeCredentialResponse resetGeneralManagerPassword(Long hotelId, ResetPasswordRequest request) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));
        User gm = userRepository.findFirstByHotelIdAndRole(hotel.getId(), Role.GENERAL_MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("General Manager not found for hotel id: " + hotelId));

        String tempPass = (request != null && request.getTemporaryPassword() != null && !request.getTemporaryPassword().isBlank())
                ? request.getTemporaryPassword()
                : generateSecureTempPassword(12);

        gm.setPassword(passwordEncoder.encode(tempPass));
        gm.setMustChangePassword(true);
        gm.setFailedLoginAttempts(0);
        gm.setLockedUntil(null);
        gm.incrementTokenVersion();
        User saved = userRepository.save(gm);

        return new EmployeeCredentialResponse(EmployeeDto.fromEntity(saved), tempPass);
    }

    private HotelAdminResponse toAdminResponse(Hotel hotel) {
        Optional<User> gm = userRepository.findFirstByHotelIdAndRole(hotel.getId(), Role.GENERAL_MANAGER);
        return HotelAdminResponse.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .slug(hotel.getSlug())
                .contactEmail(hotel.getContactEmail())
                .contactPhone(hotel.getContactPhone())
                .address(hotel.getAddress())
                .gmName(gm.map(User::getFullName).orElse("Not Assigned"))
                .gmEmail(gm.map(User::getEmail).orElse("Not Assigned"))
                .active(hotel.isActive())
                .createdAt(hotel.getCreatedAt())
                .build();
    }

    private String cleanOptional(String val) {
        if (val == null || val.trim().isEmpty()) {
            return null;
        }
        return val.trim();
    }

    private static String generateSecureTempPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TEMP_PASS_CHARS.charAt(SECURE_RANDOM.nextInt(TEMP_PASS_CHARS.length())));
        }
        return sb.toString();
    }
}
