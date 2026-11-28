package com.hotel.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.backend.dto.GuestLoginRequest;
import com.hotel.backend.dto.LoginRequest;
import com.hotel.backend.dto.MoveStayRequest;
import com.hotel.backend.dto.UpsertStayRequest;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.Room;
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
class GuestStayAndQrAuthIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private HotelRepository hotelRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private FloorRepository floorRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private LoginRateLimiter loginRateLimiter;

    private Hotel hotelA;
    private Hotel hotelB;

    private record AuthPair(Cookie authCookie, Cookie xsrfCookie) {}

    @BeforeEach
    void setUp() {
        loginRateLimiter.clearAll();
        roomRepository.deleteAll();
        floorRepository.deleteAll();
        userRepository.deleteAll();
        departmentRepository.deleteAll();
        hotelRepository.deleteAll();

        hotelA = hotelRepository.save(Hotel.builder()
                .name("Grand Horizon")
                .slug("grand-horizon")
                .active(true)
                .build());

        hotelB = hotelRepository.save(Hotel.builder()
                .name("Coastal Suites")
                .slug("coastal-suites")
                .active(true)
                .build());

        userRepository.save(User.builder()
                .fullName("Front Desk A")
                .email("fd.a@horizon.test")
                .password(passwordEncoder.encode("DeskPass#2026"))
                .role(Role.FRONT_DESK)
                .employeeCode("FD-A1")
                .hotel(hotelA)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .fullName("Front Desk B")
                .email("fd.b@coastal.test")
                .password(passwordEncoder.encode("DeskPass#2026"))
                .role(Role.FRONT_DESK)
                .employeeCode("FD-B1")
                .hotel(hotelB)
                .active(true)
                .build());
    }

    private AuthPair signInStaff(String email) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email(email).password("DeskPass#2026").build())))
                .andExpect(status().isOk())
                .andReturn();
        return new AuthPair(res.getResponse().getCookie("hotel_auth_token"), res.getResponse().getCookie("XSRF-TOKEN"));
    }

    @Test
    @DisplayName("Add Stay requires at least one contact (email or phone) and supports phone-only, email-only, or both")
    void contactRequirementAndFormatValidation() throws Exception {
        AuthPair fd = signInStaff("fd.a@horizon.test");

        // 1. Neither email nor phone -> 400 Bad Request
        UpsertStayRequest missingBoth = new UpsertStayRequest();
        missingBoth.setRoomNumber("101");
        missingBoth.setGuestName("Ravi Kumar");
        missingBoth.setCategory("in_house");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingBoth)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("phone number or an email address")));

        // 2. Phone ONLY -> 200 OK & guest can login passwordlessly via phone (even formatted vs plain digits)
        UpsertStayRequest phoneOnly = new UpsertStayRequest();
        phoneOnly.setRoomNumber("101");
        phoneOnly.setGuestName("Ravi Kumar");
        phoneOnly.setGuestPhone("+91 98765 43210");
        phoneOnly.setCategory("in_house");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(phoneOnly)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.no").value("101"))
                .andExpect(jsonPath("$.occupied").value(true));

        MvcResult phoneLogin = mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "9876543210"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("101"))
                .andExpect(jsonPath("$.guestName").value("Ravi Kumar"))
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/grand-horizon/guest?room=101"))
                .andExpect(cookie().exists("hotel_guest_token"))
                .andExpect(cookie().httpOnly("hotel_guest_token", true))
                .andReturn();

        Cookie phoneGuestCookie = phoneLogin.getResponse().getCookie("hotel_guest_token");
        assertNotNull(phoneGuestCookie);

        // 3. Email ONLY -> 200 OK & guest logs in passwordlessly via case-insensitive email
        UpsertStayRequest emailOnly = new UpsertStayRequest();
        emailOnly.setRoomNumber("102");
        emailOnly.setGuestName("Anya Sharma");
        emailOnly.setGuestEmail("Anya.Sharma@Example.com");
        emailOnly.setCategory("in_house");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailOnly)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "anya.sharma@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("102"))
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/grand-horizon/guest?room=102"));

        // 4. Both Email + Phone in Room 103 -> guest can log in with either, and duplicate contact on Room 104 is rejected (409)
        UpsertStayRequest bothReq = new UpsertStayRequest();
        bothReq.setRoomNumber("103");
        bothReq.setGuestName("Meera Nair");
        bothReq.setGuestEmail("meera@nair.test");
        bothReq.setGuestPhone("9123456789");
        bothReq.setCategory("in_house");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bothReq)))
                .andExpect(status().isOk());

        UpsertStayRequest duplicateContact = new UpsertStayRequest();
        duplicateContact.setRoomNumber("104");
        duplicateContact.setGuestName("Clone Guest");
        duplicateContact.setGuestPhone("+91 91234-56789");
        duplicateContact.setCategory("in_house");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateContact)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Guest access activates on check-in and is immediately revoked after Front Desk check-out or room move")
    void checkInMoveAndCheckoutRevocation() throws Exception {
        AuthPair fd = signInStaff("fd.a@horizon.test");

        // Register arriving guest
        UpsertStayRequest arriving = new UpsertStayRequest();
        arriving.setRoomNumber("205");
        arriving.setGuestName("Kabir Singh");
        arriving.setGuestEmail("kabir@stay.test");
        arriving.setGuestPhone("9988776655");
        arriving.setCategory("arriving");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(arriving)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.occupied").value(false));

        // Before check-in: 403 Forbidden explaining check-in pending
        mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "kabir@stay.test"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Room 205")));

        // Front Desk checks in Kabir
        mockMvc.perform(post("/api/hotels/grand-horizon/stays/205/check-in")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.occupied").value(true));

        // Guest logs in via QR phone number (passwordless)
        MvcResult loginRes = mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "9988776655"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("205"))
                .andReturn();

        Cookie room205Cookie = loginRes.getResponse().getCookie("hotel_guest_token");
        assertNotNull(room205Cookie);

        mockMvc.perform(get("/api/guest-auth/session").cookie(room205Cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("205"));

        // Front Desk moves Kabir to Room 306 -> Room 205 session immediately dies
        MoveStayRequest moveReq = new MoveStayRequest();
        moveReq.setFromRoomNumber("205");
        moveReq.setToRoomNumber("306");
        mockMvc.perform(post("/api/hotels/grand-horizon/stays/move")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(moveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.no").value("306"))
                .andExpect(jsonPath("$.occupied").value(true));

        mockMvc.perform(get("/api/guest-auth/session").cookie(room205Cookie))
                .andExpect(status().isUnauthorized());

        // Logging in again redirects directly to Room 306
        MvcResult movedLogin = mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "kabir@stay.test"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("306"))
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/grand-horizon/guest?room=306"))
                .andReturn();

        Cookie room306Cookie = movedLogin.getResponse().getCookie("hotel_guest_token");
        assertNotNull(room306Cookie);

        // Front Desk checks Kabir out -> all email/phone access & active cookies cut immediately!
        mockMvc.perform(post("/api/hotels/grand-horizon/stays/306/check-out")
                        .cookie(fd.authCookie(), fd.xsrfCookie())
                        .header("X-XSRF-TOKEN", fd.xsrfCookie().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.occupied").value(false));

        // Active cookie immediately revoked
        mockMvc.perform(get("/api/guest-auth/session").cookie(room306Cookie))
                .andExpect(status().isUnauthorized());

        // Both email AND phone login rejected after checkout
        mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "kabir@stay.test"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "9988776655"))))
                .andExpect(status().isUnauthorized());

        Room checkedOutRoom = roomRepository.findByHotelAndRoomNumber(hotelA, "306").orElseThrow();
        assertNull(checkedOutRoom.getGuestEmail());
        assertNull(checkedOutRoom.getGuestPhone());
        assertNull(checkedOutRoom.getGuestName());
    }

    @Test
    @DisplayName("Multi-tenant isolation and guest express checkout cut access immediately")
    void crossTenantIsolationAndExpressCheckout() throws Exception {
        AuthPair fdA = signInStaff("fd.a@horizon.test");
        AuthPair fdB = signInStaff("fd.b@coastal.test");

        UpsertStayRequest req = new UpsertStayRequest();
        req.setRoomNumber("402");
        req.setGuestName("Maya Lin");
        req.setGuestEmail("maya@hotelA.test");
        req.setCategory("in_house");

        mockMvc.perform(post("/api/hotels/grand-horizon/stays")
                        .cookie(fdA.authCookie(), fdA.xsrfCookie())
                        .header("X-XSRF-TOKEN", fdA.xsrfCookie().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Cross-tenant Front Desk B cannot modify stays in Hotel A
        mockMvc.perform(post("/api/hotels/grand-horizon/stays/402/check-out")
                        .cookie(fdB.authCookie(), fdB.xsrfCookie())
                        .header("X-XSRF-TOKEN", fdB.xsrfCookie().getValue()))
                .andExpect(status().isForbidden());

        // Guest registered in Hotel A cannot log into Hotel B QR code
        mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelB.getId(), "maya@hotelA.test"))))
                .andExpect(status().isUnauthorized());

        // Guest logs into Hotel A QR
        MvcResult guestLogin = mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "maya@hotelA.test"))))
                .andExpect(status().isOk())
                .andReturn();

        Cookie guestCookie = guestLogin.getResponse().getCookie("hotel_guest_token");
        Cookie xsrfCookie = guestLogin.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(guestCookie);
        assertNotNull(xsrfCookie);

        // Guest triggers Express Checkout -> cuts own email/phone access immediately
        mockMvc.perform(post("/api/guest-auth/checkout")
                        .cookie(guestCookie, xsrfCookie)
                        .header("X-XSRF-TOKEN", xsrfCookie.getValue()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/guest-auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GuestLoginRequest(hotelA.getId(), "maya@hotelA.test"))))
                .andExpect(status().isUnauthorized());
    }
}
