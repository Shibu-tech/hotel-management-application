package com.hotel.backend.service;

import com.hotel.backend.dto.CreateDepartmentRequest;
import com.hotel.backend.dto.DepartmentDto;
import com.hotel.backend.dto.UpdateDepartmentRequest;
import com.hotel.backend.exception.ResourceNotFoundException;
import com.hotel.backend.model.Department;
import com.hotel.backend.model.Hotel;
import com.hotel.backend.repository.DepartmentRepository;
import com.hotel.backend.repository.HotelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HotelDepartmentService {

    private final HotelRepository hotelRepository;
    private final DepartmentRepository departmentRepository;

    public HotelDepartmentService(HotelRepository hotelRepository, DepartmentRepository departmentRepository) {
        this.hotelRepository = hotelRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> listDepartments(String slug) {
        Hotel hotel = resolveHotel(slug);
        return departmentRepository.findByHotelIdOrderByNameAsc(hotel.getId()).stream()
                .map(DepartmentDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto createDepartment(String slug, CreateDepartmentRequest request) {
        Hotel hotel = resolveHotel(slug);
        String cleanName = request.getName().trim();

        if (departmentRepository.existsByHotelIdAndNameIgnoreCase(hotel.getId(), cleanName)) {
            throw new IllegalArgumentException("Department '" + cleanName + "' already exists in this hotel.");
        }

        Department department = Department.builder()
                .hotel(hotel)
                .name(cleanName)
                .active(true)
                .build();

        return DepartmentDto.fromEntity(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentDto updateDepartment(String slug, Long departmentId, UpdateDepartmentRequest request) {
        Hotel hotel = resolveHotel(slug);
        Department department = departmentRepository.findByIdAndHotelId(departmentId, hotel.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found in this hotel."));

        String cleanName = request.getName().trim();
        if (departmentRepository.existsByHotelIdAndNameIgnoreCaseAndIdNot(hotel.getId(), cleanName, departmentId)) {
            throw new IllegalArgumentException("Another department named '" + cleanName + "' already exists in this hotel.");
        }

        department.setName(cleanName);
        return DepartmentDto.fromEntity(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentDto toggleDepartmentStatus(String slug, Long departmentId) {
        Hotel hotel = resolveHotel(slug);
        Department department = departmentRepository.findByIdAndHotelId(departmentId, hotel.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found in this hotel."));

        department.setActive(!department.isActive());
        return DepartmentDto.fromEntity(departmentRepository.save(department));
    }

    private Hotel resolveHotel(String slug) {
        return hotelRepository.findBySlug(slug.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with slug: " + slug));
    }
}
