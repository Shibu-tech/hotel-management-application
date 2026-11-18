package com.hotel.backend.controller;

import com.hotel.backend.dto.HotelQrDto;
import com.hotel.backend.dto.HotelQrUrlResponse;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Role;
import com.hotel.backend.security.AuthenticatedUserPrincipal;
import com.hotel.backend.security.TenantAuthorizationService;
import com.hotel.backend.service.QRCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class HotelQrControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private QRCodeService qrCodeService;

    private static final byte[] FAKE_PNG_BYTES = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    private UsernamePasswordAuthenticationToken adminAuth() {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                1L, "admin@test.local", "Admin", Role.ADMIN, null,
                null, null, null, null, null, true, false, 0L);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private UsernamePasswordAuthenticationToken gmAuth(Long hotelId, String slug) {
        AuthenticatedUserPrincipal principal = new AuthenticatedUserPrincipal(
                2L, "gm@" + slug + ".local", "GM", Role.GENERAL_MANAGER, "GM-0001",
                hotelId, slug, "Hotel " + slug, null, null, true, false, 0L);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr returns PNG for hotel's own GM")
    void testGetHotelQrCodeSuccessForOwnerGm() throws Exception {
        when(qrCodeService.generateHotelQrCode(eq(101L), anyInt(), anyInt()))
                .thenReturn(FAKE_PNG_BYTES);

        mockMvc.perform(get("/api/hotels/101/qr").with(authentication(gmAuth(101L, "hotel-a"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(FAKE_PNG_BYTES));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr returns 403 for another hotel's GM")
    void testGetHotelQrCodeForbiddenCrossTenant() throws Exception {
        mockMvc.perform(get("/api/hotels/102/qr").with(authentication(gmAuth(101L, "hotel-a"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr returns 404 for unknown hotel ID when requested by ADMIN")
    void testGetHotelQrCodeNotFound() throws Exception {
        when(qrCodeService.generateHotelQrCode(eq(999L), anyInt(), anyInt()))
                .thenThrow(new ResourceNotFoundException("Hotel not found with id: 999"));

        mockMvc.perform(get("/api/hotels/999/qr").with(authentication(adminAuth())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr/url returns destination URL for authorized GM")
    void testGetHotelQrUrlSuccess() throws Exception {
        HotelQrUrlResponse response = HotelQrUrlResponse.builder()
                .hotelId(101L)
                .url("http://localhost:3000/101")
                .build();

        when(qrCodeService.getHotelQrUrl(101L)).thenReturn(response);

        mockMvc.perform(get("/api/hotels/101/qr/url").with(authentication(gmAuth(101L, "hotel-a"))))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.hotelId").value(101))
                .andExpect(jsonPath("$.url").value("http://localhost:3000/101"));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr/download returns downloadable PNG attachment for ADMIN")
    void testDownloadHotelQrCodeSuccess() throws Exception {
        when(qrCodeService.generateHotelQrCode(eq(101L), anyInt(), anyInt()))
                .thenReturn(FAKE_PNG_BYTES);

        mockMvc.perform(get("/api/hotels/101/qr/download").with(authentication(adminAuth())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hotel-101-qr.png\""))
                .andExpect(content().bytes(FAKE_PNG_BYTES));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr/download returns 401 for unauthenticated requests")
    void testDownloadHotelQrCodeUnauthorized() throws Exception {
        mockMvc.perform(get("/api/hotels/101/qr/download"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/hotels/qr returns QR info for all hotels only for ADMIN")
    void testGetAllHotelsQrAdminOnly() throws Exception {
        HotelQrDto dto1 = HotelQrDto.builder()
                .hotelId(101L)
                .name("Grand Palace")
                .slug("grand-palace")
                .destinationUrl("http://localhost:3000/101")
                .qrImageUrl("/api/hotels/101/qr")
                .qrDownloadUrl("/api/hotels/101/qr/download")
                .active(true)
                .build();

        when(qrCodeService.getAllHotelsQrInfo()).thenReturn(List.of(dto1));

        mockMvc.perform(get("/api/hotels/qr").with(authentication(adminAuth())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].hotelId").value(101));

        mockMvc.perform(get("/api/hotels/qr").with(authentication(gmAuth(101L, "grand-palace"))))
                .andExpect(status().isForbidden());
    }
}
