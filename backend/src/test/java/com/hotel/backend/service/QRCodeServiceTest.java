package com.hotel.backend.service;

import com.hotel.backend.dto.HotelQrDto;
import com.hotel.backend.dto.HotelQrUrlResponse;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.repository.HotelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QRCodeServiceTest {

    @Mock
    private HotelRepository hotelRepository;

    private QRCodeService qrCodeService;

    private Hotel hotel101;
    private Hotel hotel102;

    @BeforeEach
    void setUp() {
        qrCodeService = new QRCodeService(hotelRepository, "http://localhost:3000", 300, 300);

        hotel101 = Hotel.builder()
                .id(101L)
                .name("Grand Palace Hotel")
                .slug("grand-palace")
                .active(true)
                .build();

        hotel102 = Hotel.builder()
                .id(102L)
                .name("Ocean View Resort")
                .slug("ocean-view")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Generate QR code for a valid hotel produces valid PNG bytes")
    void testGenerateQrCodeValidHotel() {
        when(hotelRepository.findById(101L)).thenReturn(Optional.of(hotel101));

        byte[] qrBytes = qrCodeService.generateHotelQrCode(101L);

        assertNotNull(qrBytes);
        assertTrue(qrBytes.length > 0);

        // Verify PNG standard magic header: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A (\x89PNG\r\n\x1a\n)
        byte[] expectedPngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        for (int i = 0; i < expectedPngHeader.length; i++) {
            assertEquals(expectedPngHeader[i], qrBytes[i], "Byte at index " + i + " must match PNG header");
        }
    }

    @Test
    @DisplayName("Verify that different hotel IDs produce different QR contents")
    void testDifferentHotelIdsProduceDifferentQr() {
        when(hotelRepository.findById(101L)).thenReturn(Optional.of(hotel101));
        when(hotelRepository.findById(102L)).thenReturn(Optional.of(hotel102));

        byte[] qr101 = qrCodeService.generateHotelQrCode(101L);
        byte[] qr102 = qrCodeService.generateHotelQrCode(102L);

        assertNotNull(qr101);
        assertNotNull(qr102);
        assertFalse(Arrays.equals(qr101, qr102), "QR code contents for different hotel IDs must differ");
    }

    @Test
    @DisplayName("Verify that an invalid hotel ID returns 404 ResourceNotFoundException")
    void testInvalidHotelIdThrowsNotFound() {
        when(hotelRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> qrCodeService.generateHotelQrCode(999L)
        );

        assertTrue(ex.getMessage().contains("Hotel not found with id: 999"));
    }

    @Test
    @DisplayName("Verify null or negative hotel ID throws ResourceNotFoundException")
    void testNullOrNegativeHotelIdThrows() {
        assertThrows(ResourceNotFoundException.class, () -> qrCodeService.generateHotelQrCode(null));
        assertThrows(ResourceNotFoundException.class, () -> qrCodeService.generateHotelQrCode(-5L));
    }

    @Test
    @DisplayName("Verify dynamic destination URL generation matches pattern {FRONTEND_BASE_URL}/{hotelId}")
    void testGeneratedDestinationUrl() {
        when(hotelRepository.findById(101L)).thenReturn(Optional.of(hotel101));

        HotelQrUrlResponse response = qrCodeService.getHotelQrUrl(101L);

        assertNotNull(response);
        assertEquals(101L, response.getHotelId());
        assertEquals("http://localhost:3000/101", response.getUrl());
    }

    @Test
    @DisplayName("Verify custom dimensions support for QR generation")
    void testCustomDimensions() {
        when(hotelRepository.findById(101L)).thenReturn(Optional.of(hotel101));

        byte[] customQr = qrCodeService.generateHotelQrCode(101L, 150, 150);

        assertNotNull(customQr);
        assertTrue(customQr.length > 0);
    }

    @Test
    @DisplayName("Verify retrieval of QR information for all hotels")
    void testGetAllHotelsQrInfo() {
        when(hotelRepository.findAll()).thenReturn(List.of(hotel101, hotel102));

        List<HotelQrDto> all = qrCodeService.getAllHotelsQrInfo();

        assertEquals(2, all.size());
        assertEquals("http://localhost:3000/101", all.get(0).getDestinationUrl());
        assertEquals("/api/hotels/101/qr", all.get(0).getQrImageUrl());
        assertEquals("/api/hotels/101/qr/download", all.get(0).getQrDownloadUrl());
        assertEquals("http://localhost:3000/102", all.get(1).getDestinationUrl());
    }
}
