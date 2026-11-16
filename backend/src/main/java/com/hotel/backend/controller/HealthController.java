package com.hotel.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api")
public class HealthController {

    public static class HealthResponse {
        private String status;
        private String service;
        private String timestamp;
        private String message;

        public HealthResponse() {}

        public HealthResponse(String status, String service, String timestamp, String message) {
            this.status = status;
            this.service = service;
            this.timestamp = timestamp;
            this.message = message;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String status;
            private String service;
            private String timestamp;
            private String message;

            public Builder status(String status) { this.status = status; return this; }
            public Builder service(String service) { this.service = service; return this; }
            public Builder timestamp(String timestamp) { this.timestamp = timestamp; return this; }
            public Builder message(String message) { this.message = message; return this; }

            public HealthResponse build() {
                return new HealthResponse(status, service, timestamp, message);
            }
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = HealthResponse.builder()
                .status("UP")
                .service("hotel-backend")
                .timestamp(Instant.now().toString())
                .message("Spring Boot backend is connected and healthy!")
                .build();
        return ResponseEntity.ok(response);
    }
}
