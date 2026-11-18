package com.hotel.backend.repository;

import com.hotel.backend.model.Role;
import com.hotel.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.hotel LEFT JOIN FETCH u.department WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailIgnoreCaseWithTenant(@Param("email") String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.hotel LEFT JOIN FETCH u.department WHERE u.id = :id")
    Optional<User> findByIdWithTenant(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.hotel LEFT JOIN FETCH u.department WHERE u.hotel.id = :hotelId ORDER BY u.createdAt DESC")
    List<User> findByHotelIdWithDepartment(@Param("hotelId") Long hotelId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.hotel LEFT JOIN FETCH u.department WHERE u.id = :id AND u.hotel.id = :hotelId")
    Optional<User> findByIdAndHotelIdWithDepartment(@Param("id") Long id, @Param("hotelId") Long hotelId);

    boolean existsByEmailIgnoreCase(String email);
    boolean existsByHotelIdAndEmployeeCode(Long hotelId, String employeeCode);
    Optional<User> findFirstByHotelIdAndRole(Long hotelId, Role role);
    List<User> findByHotelId(Long hotelId);
    List<User> findByRole(Role role);

    @Modifying
    @Transactional
    void deleteByHotelId(Long hotelId);
}
