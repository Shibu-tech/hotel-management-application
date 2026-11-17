package com.hotel.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.hotel.backend.dto.HotelQrDto;
import com.hotel.backend.dto.HotelQrUrlResponse;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.repository.HotelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QRCodeService {

    private static final Logger log = LoggerFactory.getLogger(QRCodeService.class);

    private final HotelRepository hotelRepository;
    private final String frontendBaseUrl;
    private final int defaultWidth;
    private final int defaultHeight;

    public QRCodeService(
            HotelRepository hotelRepository,
            @Value("${app.frontend.base-url:http://localhost:3000}") String frontendBaseUrl,
            @Value("${app.qr.width:300}") int defaultWidth,
            @Value("${app.qr.height:300}") int defaultHeight) {
        this.hotelRepository = hotelRepository;
        this.frontendBaseUrl = cleanBaseUrl(frontendBaseUrl);
        this.defaultWidth = defaultWidth > 0 ? defaultWidth : 300;
        this.defaultHeight = defaultHeight > 0 ? defaultHeight : 300;
    }

    private static String cleanBaseUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "http://localhost:3000";
        }
        String trimmed = url.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    /**
     * Constructs the dynamic destination URL for a given hotel ID: {FRONTEND_BASE_URL}/{hotelId}
     */
    public String getDestinationUrlForHotel(Long hotelId) {
        Hotel hotel = findHotelOrThrow(hotelId);
        return frontendBaseUrl + "/" + hotel.getId();
    }

    /**
     * Returns destination URL response DTO for a specific hotel ID.
     */
    @Transactional(readOnly = true)
    public HotelQrUrlResponse getHotelQrUrl(Long hotelId) {
        String url = getDestinationUrlForHotel(hotelId);
        return HotelQrUrlResponse.builder()
                .hotelId(hotelId)
                .url(url)
                .build();
    }

    /**
     * Generates a PNG QR code for a given hotel using default configured dimensions.
     */
    @Transactional(readOnly = true)
    public byte[] generateHotelQrCode(Long hotelId) {
        return generateHotelQrCode(hotelId, defaultWidth, defaultHeight);
    }

    /**
     * Generates a PNG QR code for a given hotel with specific width and height.
     */
    @Transactional(readOnly = true)
    public byte[] generateHotelQrCode(Long hotelId, int width, int height) {
        String destinationUrl = getDestinationUrlForHotel(hotelId);
        int finalWidth = width > 0 ? width : defaultWidth;
        int finalHeight = height > 0 ? height : defaultHeight;

        log.debug("Generating QR Code for hotel ID {} -> Target URL: {} ({}x{})",
                hotelId, destinationUrl, finalWidth, finalHeight);

        return generateQrImageBytes(destinationUrl, finalWidth, finalHeight);
    }

    /**
     * Generates or retrieves QR information for all hotels in the database.
     */
    @Transactional(readOnly = true)
    public List<HotelQrDto> getAllHotelsQrInfo() {
        return hotelRepository.findAll().stream()
                .map(hotel -> {
                    String destinationUrl = frontendBaseUrl + "/" + hotel.getId();
                    String qrImageUrl = "/api/hotels/" + hotel.getId() + "/qr";
                    String qrDownloadUrl = "/api/hotels/" + hotel.getId() + "/qr/download";

                    return HotelQrDto.builder()
                            .hotelId(hotel.getId())
                            .name(hotel.getName())
                            .slug(hotel.getSlug())
                            .destinationUrl(destinationUrl)
                            .qrImageUrl(qrImageUrl)
                            .qrDownloadUrl(qrDownloadUrl)
                            .active(hotel.isActive())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Low-level ZXing QR code generator returning PNG byte array.
     */
    public byte[] generateQrImageBytes(String text, int width, int height) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("QR Code content cannot be empty.");
        }

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR Code image for text: {}", text, e);
            throw new IllegalStateException("Failed to generate QR code image: " + e.getMessage(), e);
        }
    }

    /**
     * Helper to find hotel by ID or throw ResourceNotFoundException.
     */
    public Hotel findHotelOrThrow(Long hotelId) {
        if (hotelId == null || hotelId <= 0) {
            throw new ResourceNotFoundException("Invalid hotel ID: " + hotelId);
        }
        return hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));
    }

    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }

    public int getDefaultWidth() {
        return defaultWidth;
    }

    public int getDefaultHeight() {
        return defaultHeight;
    }
}
