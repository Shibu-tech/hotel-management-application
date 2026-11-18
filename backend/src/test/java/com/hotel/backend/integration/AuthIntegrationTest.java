package com.hotel.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.backend.dto.ChangePasswordRequest;
import com.hotel.backend.dto.LoginRequest;
import com.hotel.backend.model.Department;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.DepartmentRepository;
import com.hotel.backend.repository.FloorRepository;
import com.hotel.backend.repository.HotelRepository;
import com.hotel.backend.repository.RoomRepository;
import com.hotel.backend.repository.UserRepository;
import com.hotel.backend.security.LoginRateLimiter;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private HotelRepository hotelRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private FloorRepository floorRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private LoginRateLimiter loginRateLimiter;

    private Hotel activeHotel;
    private Hotel suspendedHotel;
    private Department housekeepingDept;

    @BeforeEach
    void setUp() {
        loginRateLimiter.clearAll();
        roomRepository.deleteAll();
        floorRepository.deleteAll();
        userRepository.deleteAll();
        departmentRepository.deleteAll();
        hotelRepository.deleteAll();

        // Global ADMIN (hotel = null)
        userRepository.save(User.builder()
                .fullName("Platform Owner")
                .email("owner@platform.test")
                .password(passwordEncoder.encode("OwnerPass#2026"))
                .role(Role.ADMIN)
                .hotel(null)
                .active(true)
                .mustChangePassword(false)
                .build());

        activeHotel = hotelRepository.save(Hotel.builder()
                .name("Azure Bay Hotel")
                .slug("azure-bay")
                .active(true)
                .build());

        suspendedHotel = hotelRepository.save(Hotel.builder()
                .name("Suspended Resort")
                .slug("suspended-resort")
                .active(false)
                .build());

        housekeepingDept = departmentRepository.save(Department.builder()
                .hotel(activeHotel)
                .name("Housekeeping")
                .active(true)
                .build());

        userRepository.save(User.builder()
                .fullName("Alice GM")
                .email("gm@azurebay.test")
                .password(passwordEncoder.encode("GmInitial#2026"))
                .role(Role.GENERAL_MANAGER)
                .employeeCode("GM-0001")
                .hotel(activeHotel)
                .active(true)
                .mustChangePassword(true)
                .build());

        userRepository.save(User.builder()
                .fullName("Bob Supervisor")
                .email("sup@azurebay.test")
                .password(passwordEncoder.encode("SupPass#2026"))
                .role(Role.SUPERVISOR)
                .employeeCode("SUP-1001")
                .hotel(activeHotel)
                .department(housekeepingDept)
                .active(true)
                .mustChangePassword(false)
                .build());

        userRepository.save(User.builder()
                .fullName("Disabled Staff")
                .email("disabled@azurebay.test")
                .password(passwordEncoder.encode("Disabled#2026"))
                .role(Role.FRONT_DESK)
                .employeeCode("FD-1002")
                .hotel(activeHotel)
                .active(false)
                .build());

        userRepository.save(User.builder()
                .fullName("Suspended Hotel GM")
                .email("gm@suspended.test")
                .password(passwordEncoder.encode("SuspGm#2026"))
                .role(Role.GENERAL_MANAGER)
                .hotel(suspendedHotel)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .fullName("Guest User")
                .email("guest@azurebay.test")
                .password(passwordEncoder.encode("GuestPass#2026"))
                .role(Role.GUEST)
                .hotel(activeHotel)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Valid Admin login sets HttpOnly cookie, resolves ADMIN role, and redirects to /admin/dashboard")
    void validAdminLogin() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .email("owner@platform.test")
                .password("OwnerPass#2026")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.hotelId").doesNotExist())
                .andExpect(jsonPath("$.redirectUrl").value("/admin/dashboard"))
                .andExpect(cookie().exists("hotel_auth_token"))
                .andExpect(cookie().httpOnly("hotel_auth_token", true))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();

        Cookie authCookie = result.getResponse().getCookie("hotel_auth_token");
        assertNotNull(authCookie);
        assertTrue(authCookie.isHttpOnly());

        // /api/auth/me succeeds with cookie
        mockMvc.perform(get("/api/auth/me").cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("owner@platform.test"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Valid GM and Employee logins resolve exact DB roles, hotel slugs, and redirects")
    void validGmAndEmployeeLogin() throws Exception {
        // GM login
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("gm@azurebay.test").password("GmInitial#2026").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("GENERAL_MANAGER"))
                .andExpect(jsonPath("$.hotelSlug").value("azure-bay"))
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/azure-bay/gm"));

        // Supervisor login
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("sup@azurebay.test").password("SupPass#2026").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SUPERVISOR"))
                .andExpect(jsonPath("$.hotelSlug").value("azure-bay"))
                .andExpect(jsonPath("$.departmentName").value("Housekeeping"))
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/azure-bay/supervisor"));
    }

    @Test
    @DisplayName("Invalid password, unknown email, and lockout after repeated failures")
    void invalidCredentialsAndLockout() throws Exception {
        // Unknown email -> 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("nobody@azurebay.test").password("WrongPass#1").build())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));

        // 5 invalid passwords -> locks account
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    LoginRequest.builder().email("sup@azurebay.test").password("WrongPass#" + i).build())))
                    .andExpect(status().isUnauthorized());
        }

        // 6th attempt even with correct password -> 423 Locked
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("sup@azurebay.test").password("SupPass#2026").build())))
                .andExpect(status().isLocked());
    }

    @Test
    @DisplayName("Inactive employee, suspended hotel, and GUEST account are blocked from employee login")
    void inactiveSuspendedAndGuestBlocked() throws Exception {
        // Disabled employee
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("disabled@azurebay.test").password("Disabled#2026").build())))
                .andExpect(status().isForbidden());

        // Suspended hotel staff
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("gm@suspended.test").password("SuspGm#2026").build())))
                .andExpect(status().isForbidden());

        // Guest role must not use employee login
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("guest@azurebay.test").password("GuestPass#2026").build())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Forced password change clears flag, rotates tokenVersion, and invalidates previous cookie")
    void forcedPasswordChangeAndSessionRotation() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("gm@azurebay.test").password("GmInitial#2026").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andReturn();

        Cookie oldAuthCookie = loginResult.getResponse().getCookie("hotel_auth_token");
        Cookie xsrfCookie = loginResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(oldAuthCookie);
        assertNotNull(xsrfCookie);

        ChangePasswordRequest changeReq = new ChangePasswordRequest("GmInitial#2026", "NewStrongPass#99");
        MvcResult changeResult = mockMvc.perform(post("/api/auth/change-password")
                        .cookie(oldAuthCookie, xsrfCookie)
                        .header("X-XSRF-TOKEN", xsrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andReturn();

        Cookie newAuthCookie = changeResult.getResponse().getCookie("hotel_auth_token");
        assertNotNull(newAuthCookie);

        // Old cookie is immediately rejected because tokenVersion incremented
        mockMvc.perform(get("/api/auth/me").cookie(oldAuthCookie))
                .andExpect(status().isUnauthorized());

        // New cookie works
        mockMvc.perform(get("/api/auth/me").cookie(newAuthCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false));
    }

    @Test
    @DisplayName("Logout immediately revokes JWT session so replaying cookie returns 401")
    void logoutRevokesSession() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("owner@platform.test").password("OwnerPass#2026").build())))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("hotel_auth_token");
        Cookie xsrfCookie = loginResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(authCookie);
        assertNotNull(xsrfCookie);

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie, xsrfCookie)
                        .header("X-XSRF-TOKEN", xsrfCookie.getValue()))
                .andExpect(status().isOk());

        // Replaying previous cookie fails with 401
        mockMvc.perform(get("/api/auth/me").cookie(authCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Non-ADMIN user receives 403 Forbidden on /api/admin/hotels")
    void unauthorizedRoleAccessToAdminEndpoints() throws Exception {
        MvcResult gmLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("gm@azurebay.test").password("GmInitial#2026").build())))
                .andExpect(status().isOk())
                .andReturn();

        Cookie gmCookie = gmLogin.getResponse().getCookie("hotel_auth_token");
        mockMvc.perform(get("/api/admin/hotels").cookie(gmCookie))
                .andExpect(status().isForbidden());
    }
}
