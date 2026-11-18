package com.hotel.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.backend.dto.CreateEmployeeRequest;
import com.hotel.backend.dto.CreateRoomRequest;
import com.hotel.backend.dto.LoginRequest;
import com.hotel.backend.model.Department;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import com.hotel.backend.repository.*;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CrossTenantIsolationIntegrationTest {

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
    private Department deptB;

    private record AuthCookies(Cookie auth, Cookie xsrf) {}

    @BeforeEach
    void setUp() {
        loginRateLimiter.clearAll();
        roomRepository.deleteAll();
        floorRepository.deleteAll();
        userRepository.deleteAll();
        departmentRepository.deleteAll();
        hotelRepository.deleteAll();

        userRepository.save(User.builder()
                .fullName("Platform Admin")
                .email("admin@platform.test")
                .password(passwordEncoder.encode("AdminPass#2026"))
                .role(Role.ADMIN)
                .hotel(null)
                .active(true)
                .build());

        hotelA = hotelRepository.save(Hotel.builder().name("Hotel Alpha").slug("hotel-alpha").active(true).build());
        hotelB = hotelRepository.save(Hotel.builder().name("Hotel Beta").slug("hotel-beta").active(true).build());

        departmentRepository.save(Department.builder().hotel(hotelA).name("Housekeeping").active(true).build());
        deptB = departmentRepository.save(Department.builder().hotel(hotelB).name("Housekeeping").active(true).build());

        userRepository.save(User.builder()
                .fullName("GM Alpha")
                .email("gm@alpha.test")
                .password(passwordEncoder.encode("AlphaGm#2026"))
                .role(Role.GENERAL_MANAGER)
                .hotel(hotelA)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .fullName("Front Desk Alpha")
                .email("fd@alpha.test")
                .password(passwordEncoder.encode("AlphaFd#2026"))
                .role(Role.FRONT_DESK)
                .hotel(hotelA)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .fullName("GM Beta")
                .email("gm@beta.test")
                .password(passwordEncoder.encode("BetaGm#2026"))
                .role(Role.GENERAL_MANAGER)
                .hotel(hotelB)
                .active(true)
                .build());
    }

    private AuthCookies login(String email, String password) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email(email).password(password).build())))
                .andExpect(status().isOk())
                .andReturn();
        return new AuthCookies(res.getResponse().getCookie("hotel_auth_token"), res.getResponse().getCookie("XSRF-TOKEN"));
    }

    @Test
    @DisplayName("Hotel A GM cannot read or create employees in Hotel B, nor assign Hotel B departments")
    void crossTenantEmployeeAndDepartmentIsolation() throws Exception {
        AuthCookies gmA = login("gm@alpha.test", "AlphaGm#2026");

        // Cannot read Hotel B employees
        mockMvc.perform(get("/api/hotels/hotel-beta/employees").cookie(gmA.auth()))
                .andExpect(status().isForbidden());

        // Cannot create employee in Hotel B
        CreateEmployeeRequest req = new CreateEmployeeRequest();
        req.setFullName("Intruder");
        req.setEmail("intruder@beta.test");
        req.setRole(Role.FRONT_DESK);
        req.setInitialPassword("Intruder#123");

        mockMvc.perform(post("/api/hotels/hotel-beta/employees")
                        .cookie(gmA.auth(), gmA.xsrf())
                        .header("X-XSRF-TOKEN", gmA.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Cannot assign Hotel B's department to a Hotel A employee
        CreateEmployeeRequest crossDeptReq = new CreateEmployeeRequest();
        crossDeptReq.setFullName("Cross Dept Sup");
        crossDeptReq.setEmail("cross@alpha.test");
        crossDeptReq.setRole(Role.SUPERVISOR);
        crossDeptReq.setDepartmentId(deptB.getId());
        crossDeptReq.setInitialPassword("CrossDept#123");

        mockMvc.perform(post("/api/hotels/hotel-alpha/employees")
                        .cookie(gmA.auth(), gmA.xsrf())
                        .header("X-XSRF-TOKEN", gmA.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crossDeptReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Unauthenticated users and Hotel A staff cannot access Hotel B rooms/floors")
    void crossTenantRoomAndFloorIsolation() throws Exception {
        // Unauthenticated blocked
        mockMvc.perform(get("/api/hotels/hotel-beta/rooms"))
                .andExpect(status().isUnauthorized());

        AuthCookies fdA = login("fd@alpha.test", "AlphaFd#2026");

        // Hotel A Front Desk CAN read and add rooms in Hotel A
        mockMvc.perform(get("/api/hotels/hotel-alpha/rooms").cookie(fdA.auth()))
                .andExpect(status().isOk());

        CreateRoomRequest roomReq = new CreateRoomRequest();
        roomReq.setRoomNumber("101");
        roomReq.setFloor(1);
        mockMvc.perform(post("/api/hotels/hotel-alpha/rooms")
                        .cookie(fdA.auth(), fdA.xsrf())
                        .header("X-XSRF-TOKEN", fdA.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated());

        // Hotel A Front Desk CANNOT read or add rooms in Hotel B
        mockMvc.perform(get("/api/hotels/hotel-beta/rooms").cookie(fdA.auth()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hotels/hotel-beta/rooms")
                        .cookie(fdA.auth(), fdA.xsrf())
                        .header("X-XSRF-TOKEN", fdA.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Hotel A GM cannot retrieve Hotel B QR resources; Admin can access platform-wide QR list")
    void crossTenantQrIsolation() throws Exception {
        AuthCookies gmA = login("gm@alpha.test", "AlphaGm#2026");
        AuthCookies admin = login("admin@platform.test", "AdminPass#2026");

        // Hotel A GM CAN retrieve Hotel A QR
        mockMvc.perform(get("/api/hotels/" + hotelA.getId() + "/qr/url").cookie(gmA.auth()))
                .andExpect(status().isOk());

        // Hotel A GM CANNOT retrieve Hotel B QR or platform-wide QR list
        mockMvc.perform(get("/api/hotels/" + hotelB.getId() + "/qr").cookie(gmA.auth()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/hotels/" + hotelB.getId() + "/qr/url").cookie(gmA.auth()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/hotels/" + hotelB.getId() + "/qr/download").cookie(gmA.auth()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/hotels/qr").cookie(gmA.auth()))
                .andExpect(status().isForbidden());

        // Platform ADMIN CAN access platform-wide QR list and admin hotel list
        mockMvc.perform(get("/api/hotels/qr").cookie(admin.auth()))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/hotels").cookie(admin.auth()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Suspending a hotel immediately revokes active sessions of its employees")
    void suspendingHotelRevokesActiveSessions() throws Exception {
        AuthCookies admin = login("admin@platform.test", "AdminPass#2026");
        AuthCookies gmA = login("gm@alpha.test", "AlphaGm#2026");

        // GM Alpha currently has valid session
        mockMvc.perform(get("/api/auth/me").cookie(gmA.auth()))
                .andExpect(status().isOk());

        // Admin suspends Hotel Alpha
        mockMvc.perform(patch("/api/admin/hotels/" + hotelA.getId() + "/toggle-active")
                        .cookie(admin.auth(), admin.xsrf())
                        .header("X-XSRF-TOKEN", admin.xsrf().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        // GM Alpha's existing cookie is immediately rejected
        mockMvc.perform(get("/api/auth/me").cookie(gmA.auth()))
                .andExpect(status().isUnauthorized());
    }
}
