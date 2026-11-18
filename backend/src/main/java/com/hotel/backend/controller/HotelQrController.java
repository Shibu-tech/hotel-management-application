package com.hotel.backend.controller;

import com.hotel.backend.dto.HotelQrDto;
import com.hotel.backend.dto.HotelQrUrlResponse;
import com.hotel.backend.service.QRCodeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelQrController {

    private final QRCodeService qrCodeService;

    public HotelQrController(QRCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    @GetMapping(value = "/{hotelId}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("@tenantAuth.canManageHotelQr(authentication, #hotelId)")
    public ResponseEntity<byte[]> getHotelQrCode(
            @PathVariable Long hotelId,
            @RequestParam(name = "width", required = false, defaultValue = "0") int width,
            @RequestParam(name = "height", required = false, defaultValue = "0") int height) {
        byte[] qrBytes = qrCodeService.generateHotelQrCode(hotelId, width, height);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrBytes);
    }

    @GetMapping("/{hotelId}/qr/url")
    @PreAuthorize("@tenantAuth.canManageHotelQr(authentication, #hotelId)")
    public ResponseEntity<HotelQrUrlResponse> getHotelQrUrl(@PathVariable Long hotelId) {
        HotelQrUrlResponse response = qrCodeService.getHotelQrUrl(hotelId);
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/{hotelId}/qr/download", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("@tenantAuth.canManageHotelQr(authentication, #hotelId)")
    public ResponseEntity<byte[]> downloadHotelQrCode(
            @PathVariable Long hotelId,
            @RequestParam(name = "width", required = false, defaultValue = "0") int width,
            @RequestParam(name = "height", required = false, defaultValue = "0") int height) {
        byte[] qrBytes = qrCodeService.generateHotelQrCode(hotelId, width, height);
        String filename = "hotel-" + hotelId + "-qr.png";
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(qrBytes);
    }

    @GetMapping("/qr")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<HotelQrDto>> getAllHotelsQr() {
        List<HotelQrDto> list = qrCodeService.getAllHotelsQrInfo();
        return ResponseEntity.ok(list);
    }
}
