package com.hotel.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.backend.dto.*;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EmployeeManagementIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private HotelRepository hotelRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private FloorRepository floorRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private LoginRateLimiter loginRateLimiter;

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
                .email("admin@saas.test")
                .password(passwordEncoder.encode("AdminPass#2026"))
                .role(Role.ADMIN)
                .hotel(null)
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
    @DisplayName("Full lifecycle: Admin creates hotel + GM -> GM creates departments -> GM creates Front Desk, Supervisors, Fulfillers -> Employees log in -> Disable revokes access")
    void fullAdminAndGmEmployeeLifecycle() throws Exception {
        AuthCookies adminCookies = login("admin@saas.test", "AdminPass#2026");

        // 1. Admin dynamically creates new hotel & initial GM
        CreateHotelRequest createHotel = CreateHotelRequest.builder()
                .name("Grand Meridian")
                .slug("grand-meridian")
                .contactEmail("hello@grandmeridian.test")
                .contactPhone("+1-555-0100")
                .gmName("Clara Vance")
                .gmEmail("clara.gm@grandmeridian.test")
                .password("ClaraInit#2026")
                .build();

        mockMvc.perform(post("/api/admin/hotels")
                        .cookie(adminCookies.auth(), adminCookies.xsrf())
                        .header("X-XSRF-TOKEN", adminCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createHotel)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("grand-meridian"))
                .andExpect(jsonPath("$.gmEmail").value("clara.gm@grandmeridian.test"));

        // 2. Newly created GM logs in immediately
        AuthCookies gmCookies = login("clara.gm@grandmeridian.test", "ClaraInit#2026");

        // 3. GM creates dynamic departments
        MvcResult hkRes = mockMvc.perform(post("/api/hotels/grand-meridian/departments")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateDepartmentRequest("Housekeeping"))))
                .andExpect(status().isCreated())
                .andReturn();
        Long hkDeptId = objectMapper.readTree(hkRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult maintRes = mockMvc.perform(post("/api/hotels/grand-meridian/departments")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateDepartmentRequest("Maintenance"))))
                .andExpect(status().isCreated())
                .andReturn();
        Long maintDeptId = objectMapper.readTree(maintRes.getResponse().getContentAsString()).get("id").asLong();

        // Duplicate department name rejected
        mockMvc.perform(post("/api/hotels/grand-meridian/departments")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateDepartmentRequest("housekeeping"))))
                .andExpect(status().isBadRequest());

        // 4. GM creates Front Desk employee (no department needed)
        CreateEmployeeRequest fdReq = new CreateEmployeeRequest();
        fdReq.setFullName("Nina Desk");
        fdReq.setEmail("nina.fd@grandmeridian.test");
        fdReq.setRole(Role.FRONT_DESK);
        fdReq.setInitialPassword("FrontDesk#11");

        MvcResult fdRes = mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fdReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employee.role").value("FRONT_DESK"))
                .andExpect(jsonPath("$.employee.mustChangePassword").value(true))
                .andExpect(jsonPath("$.temporaryPassword").value("FrontDesk#11"))
                .andReturn();
        Long fdId = objectMapper.readTree(fdRes.getResponse().getContentAsString()).get("employee").get("id").asLong();

        // 5. GM creates multiple Supervisors and multiple Fulfillers with departments
        CreateEmployeeRequest sup1 = new CreateEmployeeRequest();
        sup1.setFullName("Sam HK Sup");
        sup1.setEmail("sam.sup@grandmeridian.test");
        sup1.setRole(Role.SUPERVISOR);
        sup1.setDepartmentId(hkDeptId);
        // Leave initialPassword null to verify secure auto-generation!

        MvcResult sup1Res = mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sup1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employee.departmentName").value("Housekeeping"))
                .andReturn();
        JsonNode sup1Json = objectMapper.readTree(sup1Res.getResponse().getContentAsString());
        String generatedSupPass = sup1Json.get("temporaryPassword").asText();
        assertNotNull(generatedSupPass);
        assertTrue(generatedSupPass.length() >= 12);

        CreateEmployeeRequest ful1 = new CreateEmployeeRequest();
        ful1.setFullName("Raj Maint Tech 1");
        ful1.setEmail("raj.ful@grandmeridian.test");
        ful1.setRole(Role.FULFILLER);
        ful1.setDepartmentId(maintDeptId);
        ful1.setInitialPassword("Fulfiller#01");

        CreateEmployeeRequest ful2 = new CreateEmployeeRequest();
        ful2.setFullName("Priya Maint Tech 2");
        ful2.setEmail("priya.ful@grandmeridian.test");
        ful2.setRole(Role.FULFILLER);
        ful2.setDepartmentId(maintDeptId);
        ful2.setInitialPassword("Fulfiller#02");

        mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ful1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ful2)))
                .andExpect(status().isCreated());

        // 6. Newly created employees can immediately log in
        AuthCookies fdCookies = login("nina.fd@grandmeridian.test", "FrontDesk#11");
        mockMvc.perform(get("/api/auth/me").cookie(fdCookies.auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/grand-meridian/front-desk"));

        AuthCookies supCookies = login("sam.sup@grandmeridian.test", generatedSupPass);
        mockMvc.perform(get("/api/auth/me").cookie(supCookies.auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirectUrl").value("/hotel/grand-meridian/supervisor"));

        // 7. Validation checks: duplicate email, missing dept for supervisor, forbidden roles (ADMIN / GM)
        mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fdReq)))
                .andExpect(status().isBadRequest());

        CreateEmployeeRequest supNoDept = new CreateEmployeeRequest();
        supNoDept.setFullName("Bad Sup");
        supNoDept.setEmail("badsup@grandmeridian.test");
        supNoDept.setRole(Role.SUPERVISOR);
        mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supNoDept)))
                .andExpect(status().isBadRequest());

        CreateEmployeeRequest tryAdmin = new CreateEmployeeRequest();
        tryAdmin.setFullName("Rogue Admin");
        tryAdmin.setEmail("rogue@grandmeridian.test");
        tryAdmin.setRole(Role.ADMIN);
        mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tryAdmin)))
                .andExpect(status().isForbidden());

        CreateEmployeeRequest tryGm = new CreateEmployeeRequest();
        tryGm.setFullName("Second GM");
        tryGm.setEmail("gm2@grandmeridian.test");
        tryGm.setRole(Role.GENERAL_MANAGER);
        mockMvc.perform(post("/api/hotels/grand-meridian/employees")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tryGm)))
                .andExpect(status().isForbidden());

        // 8. Disabling employee blocks login AND invalidates existing session cookie immediately
        mockMvc.perform(patch("/api/hotels/grand-meridian/employees/" + fdId + "/status")
                        .cookie(gmCookies.auth(), gmCookies.xsrf())
                        .header("X-XSRF-TOKEN", gmCookies.xsrf().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        // Existing cookie rejected
        mockMvc.perform(get("/api/auth/me").cookie(fdCookies.auth()))
                .andExpect(status().isUnauthorized());

        // New login blocked
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().email("nina.fd@grandmeridian.test").password("FrontDesk#11").build())))
                .andExpect(status().isForbidden());
    }
}
