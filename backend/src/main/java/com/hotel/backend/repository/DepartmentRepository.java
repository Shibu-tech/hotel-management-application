package com.hotel.backend.repository;

import com.hotel.backend.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByHotelIdOrderByNameAsc(Long hotelId);
    List<Department> findByHotelIdAndActiveTrueOrderByNameAsc(Long hotelId);
    Optional<Department> findByIdAndHotelId(Long id, Long hotelId);
    boolean existsByHotelIdAndNameIgnoreCase(Long hotelId, String name);
    boolean existsByHotelIdAndNameIgnoreCaseAndIdNot(Long hotelId, String name, Long id);

    @Modifying
    @Transactional
    void deleteByHotelId(Long hotelId);
}
