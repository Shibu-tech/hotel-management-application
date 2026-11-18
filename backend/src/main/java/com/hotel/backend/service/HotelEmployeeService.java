package com.hotel.backend.service;

import com.hotel.backend.dto.CreateEmployeeRequest;
import com.hotel.backend.dto.EmployeeCredentialResponse;
import com.hotel.backend.dto.EmployeeDto;
import com.hotel.backend.dto.ResetPasswordRequest;
import com.hotel.backend.dto.UpdateEmployeeRequest;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Department;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.DepartmentRepository;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class HotelEmployeeService {

    private static final Set<Role> PERMITTED_GM_ASSIGNABLE_ROLES =
            EnumSet.of(Role.SUPERVISOR, Role.FRONT_DESK, Role.FULFILLER);

    private static final String TEMP_PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public HotelEmployeeService(
            HotelRepository hotelRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<EmployeeDto> listEmployees(String slug) {
        Hotel hotel = resolveHotel(slug);
        return userRepository.findByHotelIdWithDepartment(hotel.getId()).stream()
                .filter(u -> u.getRole() != Role.ADMIN && u.getRole() != Role.GUEST)
                .map(EmployeeDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployee(String slug, Long employeeId) {
        Hotel hotel = resolveHotel(slug);
        User user = userRepository.findByIdAndHotelIdWithDepartment(employeeId, hotel.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found in this hotel."));
        return EmployeeDto.fromEntity(user);
    }

    @Transactional
    public EmployeeCredentialResponse createEmployee(String slug, CreateEmployeeRequest request) {
        Hotel hotel = resolveHotel(slug);
        validateAssignableRole(request.getRole());

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new IllegalArgumentException("An account with email '" + cleanEmail + "' already exists.");
        }

        Department department = resolveAndValidateDepartment(hotel, request.getRole(), request.getDepartmentId());

        String employeeCode = (request.getEmployeeCode() != null && !request.getEmployeeCode().isBlank())
                ? request.getEmployeeCode().trim().toUpperCase()
                : generateUniqueEmployeeCode(hotel.getId(), request.getRole());

        if (userRepository.existsByHotelIdAndEmployeeCode(hotel.getId(), employeeCode)) {
            throw new IllegalArgumentException("Employee code '" + employeeCode + "' already exists in this hotel.");
        }

        String rawTempPassword = (request.getInitialPassword() != null && !request.getInitialPassword().isBlank())
                ? request.getInitialPassword()
                : generateSecureTempPassword(12);

        User employee = User.builder()
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .password(passwordEncoder.encode(rawTempPassword))
                .role(request.getRole())
                .employeeCode(employeeCode)
                .hotel(hotel)
                .department(department)
                .active(true)
                .mustChangePassword(true)
                .build();

        User saved = userRepository.save(employee);
        return new EmployeeCredentialResponse(EmployeeDto.fromEntity(saved), rawTempPassword);
    }

    @Transactional
    public EmployeeDto updateEmployee(String slug, Long employeeId, UpdateEmployeeRequest request, Long actorUserId) {
        Hotel hotel = resolveHotel(slug);
        User target = userRepository.findByIdAndHotelIdWithDepartment(employeeId, hotel.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found in this hotel."));

        if (target.getRole() == Role.ADMIN || target.getRole() == Role.GENERAL_MANAGER) {
            throw new AccessDeniedException("Cannot modify ADMIN or GENERAL_MANAGER role via hotel employee endpoint.");
        }
        if (actorUserId != null && actorUserId.equals(target.getId())) {
            throw new AccessDeniedException("You cannot modify your own role assignment.");
        }

        validateAssignableRole(request.getRole());
        Department department = resolveAndValidateDepartment(hotel, request.getRole(), request.getDepartmentId());

        boolean roleOrDeptChanged = target.getRole() != request.getRole()
                || !sameDepartment(target.getDepartment(), department);

        target.setFullName(request.getFullName().trim());
        target.setRole(request.getRole());
        target.setDepartment(department);

        if (roleOrDeptChanged) {
            target.incrementTokenVersion();
        }

        return EmployeeDto.fromEntity(userRepository.save(target));
    }

    @Transactional
    public EmployeeDto toggleEmployeeStatus(String slug, Long employeeId, Long actorUserId) {
        Hotel hotel = resolveHotel(slug);
        User target = userRepository.findByIdAndHotelIdWithDepartment(employeeId, hotel.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found in this hotel."));

        if (target.getRole() == Role.ADMIN || target.getRole() == Role.GENERAL_MANAGER) {
            throw new AccessDeniedException("Cannot deactivate ADMIN or GENERAL_MANAGER from employee roster.");
        }
        if (actorUserId != null && actorUserId.equals(target.getId())) {
            throw new AccessDeniedException("You cannot deactivate your own account.");
        }

        target.setActive(!target.isActive());
        target.incrementTokenVersion(); // Immediately invalidate existing session if disabled
        return EmployeeDto.fromEntity(userRepository.save(target));
    }

    @Transactional
    public EmployeeCredentialResponse resetEmployeePassword(
            String slug, Long employeeId, ResetPasswordRequest request, Long actorUserId) {
        Hotel hotel = resolveHotel(slug);
        User target = userRepository.findByIdAndHotelIdWithDepartment(employeeId, hotel.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found in this hotel."));

        if (target.getRole() == Role.ADMIN || target.getRole() == Role.GENERAL_MANAGER) {
            throw new AccessDeniedException("Cannot reset ADMIN or GENERAL_MANAGER password from hotel employee roster.");
        }
        if (actorUserId != null && actorUserId.equals(target.getId())) {
            throw new AccessDeniedException("Use change-password to update your own password.");
        }

        String rawTempPassword = (request != null && request.getTemporaryPassword() != null && !request.getTemporaryPassword().isBlank())
                ? request.getTemporaryPassword()
                : generateSecureTempPassword(12);

        target.setPassword(passwordEncoder.encode(rawTempPassword));
        target.setMustChangePassword(true);
        target.setFailedLoginAttempts(0);
        target.setLockedUntil(null);
        target.incrementTokenVersion();

        User saved = userRepository.save(target);
        return new EmployeeCredentialResponse(EmployeeDto.fromEntity(saved), rawTempPassword);
    }

    private void validateAssignableRole(Role role) {
        if (role == null || !PERMITTED_GM_ASSIGNABLE_ROLES.contains(role)) {
            throw new AccessDeniedException(
                    "Permitted employee roles are SUPERVISOR, FRONT_DESK, and FULFILLER only. Cannot assign " + role + ".");
        }
    }

    private Department resolveAndValidateDepartment(Hotel hotel, Role role, Long departmentId) {
        boolean requiresDepartment = (role == Role.SUPERVISOR || role == Role.FULFILLER);
        if (departmentId == null) {
            if (requiresDepartment) {
                throw new IllegalArgumentException("A department is required for role " + role + ".");
            }
            return null;
        }

        Department dept = departmentRepository.findByIdAndHotelId(departmentId, hotel.getId())
                .orElseThrow(() -> new IllegalArgumentException("Selected department does not belong to this hotel."));
        if (!dept.isActive()) {
            throw new IllegalArgumentException("Cannot assign employee to an inactive department.");
        }
        return dept;
    }

    private String generateUniqueEmployeeCode(Long hotelId, Role role) {
        String prefix = switch (role) {
            case FRONT_DESK -> "FD";
            case SUPERVISOR -> "SUP";
            case FULFILLER -> "FUL";
            default -> "EMP";
        };
        for (int attempt = 0; attempt < 20; attempt++) {
            int num = 1000 + SECURE_RANDOM.nextInt(9000);
            String candidate = prefix + "-" + num;
            if (!userRepository.existsByHotelIdAndEmployeeCode(hotelId, candidate)) {
                return candidate;
            }
        }
        return prefix + "-" + (System.currentTimeMillis() % 100000);
    }

    private boolean sameDepartment(Department a, Department b) {
        Long idA = a != null ? a.getId() : null;
        Long idB = b != null ? b.getId() : null;
        if (idA == null && idB == null) return true;
        return idA != null && idA.equals(idB);
    }

    private Hotel resolveHotel(String slug) {
        return hotelRepository.findBySlug(slug.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with slug: " + slug));
    }

    private static String generateSecureTempPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TEMP_PASS_CHARS.charAt(SECURE_RANDOM.nextInt(TEMP_PASS_CHARS.length())));
        }
        return sb.toString();
    }
}
