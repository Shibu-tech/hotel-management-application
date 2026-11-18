package com.hotel.backend.repository;

import com.hotel.backend.model.Hotel;
import com.hotel.backend.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHotelOrderByFloorAscRoomNumberAsc(Hotel hotel);

    Optional<Room> findByHotelAndRoomNumber(Hotel hotel, String roomNumber);

    boolean existsByHotelAndRoomNumber(Hotel hotel, String roomNumber);

    long countByHotel(Hotel hotel);

    void deleteByHotelAndRoomNumber(Hotel hotel, String roomNumber);

    void deleteByHotelAndFloor(Hotel hotel, Integer floor);

    void deleteByHotelId(Long hotelId);
}
