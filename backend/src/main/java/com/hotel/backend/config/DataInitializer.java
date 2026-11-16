package com.hotel.backend.config;

import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            HotelRepository hotelRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing multi-tenant hotel system bootstrap data...");

        // 1. Seed Global ADMIN (hotel = null)
        if (!userRepository.existsByEmailIgnoreCase("admin@thegrandadp.com")) {
            User admin = User.builder()
                    .fullName("Platform Administrator")
                    .email("admin@thegrandadp.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .hotel(null) // Global ADMIN has hotel_id = null
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Provisioned global ADMIN account: admin@thegrandadp.com");
        }

        // 2. Seed Primary Hotel Tenant: The Grand ADP (grand-adp)
        Hotel grandAdp = hotelRepository.findBySlug("grand-adp")
                .orElseGet(() -> hotelRepository.save(Hotel.builder()
                        .name("The Grand ADP Resort & Residences")
                        .slug("grand-adp")
                        .active(true)
                        .build()));

        // Seed 5 Tenant Roles for The Grand ADP
        seedTenantUser("gm@thegrandadp.com", "gm123", "Amitabh Bose", Role.GENERAL_MANAGER, grandAdp);
        seedTenantUser("dispatcher@thegrandadp.com", "dispatch123", "Meera Nambiar", Role.SUPERVISOR, grandAdp);
        seedTenantUser("frontdesk@thegrandadp.com", "desk123", "Sunita Patel", Role.FRONT_DESK, grandAdp);
        seedTenantUser("fulfiller@thegrandadp.com", "task123", "Vikram Rathod", Role.FULFILLER, grandAdp);
        seedTenantUser("guest@thegrandadp.com", "guest123", "Arjun Kapoor", Role.GUEST, grandAdp);

        // 3. Seed Secondary Hotel Tenant: The Grand Palace Mumbai (palace-mumbai)
        Hotel mumbaiPalace = hotelRepository.findBySlug("palace-mumbai")
                .orElseGet(() -> hotelRepository.save(Hotel.builder()
                        .name("The Grand Palace Mumbai")
                        .slug("palace-mumbai")
                        .active(true)
                        .build()));

        seedTenantUser("gm.mumbai@thegrandadp.com", "gm123", "Rohit Singhania", Role.GENERAL_MANAGER, mumbaiPalace);

        log.info("Multi-tenant bootstrap data initialized successfully.");
    }

    private void seedTenantUser(String email, String rawPassword, String fullName, Role role, Hotel hotel) {
        if (!userRepository.existsByEmailIgnoreCase(email)) {
            User user = User.builder()
                    .email(email.toLowerCase())
                    .password(passwordEncoder.encode(rawPassword))
                    .fullName(fullName)
                    .role(role)
                    .hotel(hotel) // Bound to specific hotel tenant via FK
                    .active(true)
                    .build();
            userRepository.save(user);
            log.info("Provisioned {} account for hotel '{}': {}", role, hotel.getName(), email);
        }
    }
}
