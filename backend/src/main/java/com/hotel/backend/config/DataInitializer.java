package com.hotel.backend.config;

import com.hotel.backend.model.Department;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.DepartmentRepository;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

/**
 * Development-only bootstrap initializer.
 * Strictly gated behind @Profile("dev") and never runs in default/production profiles.
 * Reads bootstrap admin credentials from environment variables so no fixed passwords exist in source code.
 */
@Configuration
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final String devAdminEmail;
    private final String devAdminPassword;

    public DataInitializer(
            HotelRepository hotelRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.dev.seed.admin-email:}") String devAdminEmail,
            @Value("${app.dev.seed.admin-password:}") String devAdminPassword) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.devAdminEmail = devAdminEmail;
        this.devAdminPassword = devAdminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Running development-only DataInitializer (@Profile('dev'))...");

        if (devAdminEmail != null && !devAdminEmail.isBlank()
                && devAdminPassword != null && devAdminPassword.length() >= 8) {
            String normalizedEmail = devAdminEmail.trim().toLowerCase();
            if (!userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                User admin = User.builder()
                        .fullName("Platform Administrator")
                        .email(normalizedEmail)
                        .password(passwordEncoder.encode(devAdminPassword))
                        .role(Role.ADMIN)
                        .hotel(null)
                        .active(true)
                        .mustChangePassword(false)
                        .build();
                userRepository.save(admin);
                log.info("Seeded development ADMIN account from environment configuration.");
            }
        } else {
            log.info("Skipping dev ADMIN seed: set DEV_SEED_ADMIN_EMAIL and DEV_SEED_ADMIN_PASSWORD (>=8 chars) to bootstrap in dev.");
        }

        // Ensure default hotel has baseline departments in dev if it already exists
        hotelRepository.findBySlug("grand-adp").ifPresent(hotel -> {
            seedDepartmentIfMissing(hotel, "Housekeeping");
            seedDepartmentIfMissing(hotel, "Maintenance");
            seedDepartmentIfMissing(hotel, "Food and Beverage");
        });
    }

    private void seedDepartmentIfMissing(Hotel hotel, String name) {
        if (!departmentRepository.existsByHotelIdAndNameIgnoreCase(hotel.getId(), name)) {
            departmentRepository.save(Department.builder()
                    .hotel(hotel)
                    .name(name)
                    .active(true)
                    .build());
        }
    }
}
