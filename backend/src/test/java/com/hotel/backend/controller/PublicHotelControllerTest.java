package com.hotel.backend.controller;

import com.hotel.backend.dto.HotelPublicDto;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.security.JwtAuthenticationFilter;
import com.hotel.backend.security.JwtUtil;
import com.hotel.backend.service.HotelPublicService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PublicHotelController.class)
class PublicHotelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HotelPublicService hotelPublicService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("GET /api/hotels/public-list returns active hotel list publicly")
    void testGetPublicHotelList() throws Exception {
        HotelPublicDto dto = HotelPublicDto.builder()
                .id(1L)
                .name("Grand ADP")
                .slug("grand-adp")
                .active(true)
                .build();

        when(hotelPublicService.getPublicHotels()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/hotels/public-list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Grand ADP"));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/public returns hotel verification details publicly")
    void testGetPublicHotelByIdSuccess() throws Exception {
        HotelPublicDto dto = HotelPublicDto.builder()
                .id(101L)
                .name("Grand Palace")
                .slug("grand-palace")
                .active(true)
                .build();

        when(hotelPublicService.getPublicHotelById(101L)).thenReturn(dto);

        mockMvc.perform(get("/api/hotels/101/public"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.name").value("Grand Palace"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("GET /api/hotels/{hotelId}/public returns 404 for unknown hotel ID")
    void testGetPublicHotelByIdNotFound() throws Exception {
        when(hotelPublicService.getPublicHotelById(999L))
                .thenThrow(new ResourceNotFoundException("Hotel not found with id: 999"));

        mockMvc.perform(get("/api/hotels/999/public"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }
}
