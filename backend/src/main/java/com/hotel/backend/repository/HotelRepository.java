package com.hotel.backend.repository;

import com.hotel.backend.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {
    Optional<Hotel> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Hotel> findByActiveTrueOrderByNameAsc();
}
