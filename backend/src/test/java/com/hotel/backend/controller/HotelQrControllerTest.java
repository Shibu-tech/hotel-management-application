package com.hotel.backend.controller;

import com.hotel.backend.dto.HotelQrDto;
import com.hotel.backend.dto.HotelQrUrlResponse;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.security.JwtAuthenticationFilter;
import com.hotel.backend.security.JwtUtil;
import com.hotel.backend.service.QRCodeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = HotelQrController.class)
class HotelQrControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private QRCodeService qrCodeService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private static final byte[] FAKE_PNG_BYTES = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr generates QR code PNG image")
    void testGetHotelQrCodeSuccess() throws Exception {
        when(qrCodeService.generateHotelQrCode(eq(101L), anyInt(), anyInt()))
                .thenReturn(FAKE_PNG_BYTES);

        mockMvc.perform(get("/api/hotels/101/qr"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(FAKE_PNG_BYTES));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr returns 404 for invalid hotel ID")
    void testGetHotelQrCodeNotFound() throws Exception {
        when(qrCodeService.generateHotelQrCode(eq(999L), anyInt(), anyInt()))
                .thenThrow(new ResourceNotFoundException("Hotel not found with id: 999"));

        mockMvc.perform(get("/api/hotels/999/qr"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Hotel not found with id: 999"));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr/url returns destination URL JSON")
    void testGetHotelQrUrlSuccess() throws Exception {
        HotelQrUrlResponse response = HotelQrUrlResponse.builder()
                .hotelId(101L)
                .url("http://localhost:3000/101")
                .build();

        when(qrCodeService.getHotelQrUrl(101L)).thenReturn(response);

        mockMvc.perform(get("/api/hotels/101/qr/url"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.hotelId").value(101))
                .andExpect(jsonPath("$.url").value("http://localhost:3000/101"));
    }

    @Test
    @WithMockUser(username = "admin@thegrandadp.com", roles = {"ADMIN"})
    @DisplayName("GET /api/hotels/{hotelId}/qr/download returns downloadable PNG attachment when authenticated")
    void testDownloadHotelQrCodeSuccess() throws Exception {
        when(qrCodeService.generateHotelQrCode(eq(101L), anyInt(), anyInt()))
                .thenReturn(FAKE_PNG_BYTES);

        mockMvc.perform(get("/api/hotels/101/qr/download"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hotel-101-qr.png\""))
                .andExpect(content().bytes(FAKE_PNG_BYTES));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/qr/download returns 401 Unauthorized for unauthenticated requests")
    void testDownloadHotelQrCodeUnauthorized() throws Exception {
        mockMvc.perform(get("/api/hotels/101/qr/download"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@thegrandadp.com", roles = {"ADMIN"})
    @DisplayName("GET /api/hotels/qr returns QR info for all hotels when authenticated")
    void testGetAllHotelsQrSuccess() throws Exception {
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

        mockMvc.perform(get("/api/hotels/qr"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].hotelId").value(101))
                .andExpect(jsonPath("$[0].destinationUrl").value("http://localhost:3000/101"))
                .andExpect(jsonPath("$[0].qrImageUrl").value("/api/hotels/101/qr"))
                .andExpect(jsonPath("$[0].qrDownloadUrl").value("/api/hotels/101/qr/download"));
    }

    @Test
    @DisplayName("GET /api/hotels/qr returns 401 Unauthorized for unauthenticated requests")
    void testGetAllHotelsQrUnauthorized() throws Exception {
        mockMvc.perform(get("/api/hotels/qr"))
                .andExpect(status().isUnauthorized());
    }
}
