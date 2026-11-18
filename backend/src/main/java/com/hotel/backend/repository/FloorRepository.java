package com.hotel.backend.repository;

import com.hotel.backend.model.Floor;
import com.hotel.backend.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Long> {

    List<Floor> findByHotelOrderByFloorNumberAsc(Hotel hotel);

    Optional<Floor> findByHotelAndFloorNumber(Hotel hotel, Integer floorNumber);

    boolean existsByHotelAndFloorNumber(Hotel hotel, Integer floorNumber);

    long countByHotel(Hotel hotel);

    void deleteByHotelAndFloorNumber(Hotel hotel, Integer floorNumber);

    void deleteByHotelId(Long hotelId);
}
