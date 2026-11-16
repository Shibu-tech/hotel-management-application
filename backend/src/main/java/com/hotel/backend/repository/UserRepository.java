package com.hotel.backend.repository;

import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findFirstByHotelIdAndRole(Long hotelId, Role role);
    List<User> findByHotelId(Long hotelId);
    List<User> findByRole(Role role);

    @Modifying
    @Transactional
    void deleteByHotelId(Long hotelId);
}
