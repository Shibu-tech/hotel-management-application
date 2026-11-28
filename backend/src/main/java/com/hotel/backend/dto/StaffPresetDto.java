package com.hotel.backend.dto;

public class StaffPresetDto {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String hotelSlug;
    private String departmentName;

    public StaffPresetDto() {}

    public StaffPresetDto(Long id, String name, String email, String role, String hotelSlug, String departmentName) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.hotelSlug = hotelSlug;
        this.departmentName = departmentName;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String hotelSlug;
        private String departmentName;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder hotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; return this; }
        public Builder departmentName(String departmentName) { this.departmentName = departmentName; return this; }

        public StaffPresetDto build() {
            return new StaffPresetDto(id, name, email, role, hotelSlug, departmentName);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getHotelSlug() { return hotelSlug; }
    public void setHotelSlug(String hotelSlug) { this.hotelSlug = hotelSlug; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
}
