package com.Campus_Hub.Smart_Campus_Operations_Hub.repository;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Booking;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUserId(Long userId);

       List<Booking> findByUserEmail(String userEmail);
    
    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId " +
           "AND b.status = com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus.APPROVED " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(@Param("resourceId") Long resourceId,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);

    @Query("SELECT b FROM Booking b WHERE b.resourceId = :resourceId " +
           "AND b.status = com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus.APPROVED " +
           "AND b.startTime < :endTime AND b.endTime > :startTime " +
           "AND (b.userEmail IS NULL OR b.userEmail <> :userEmail)")
    List<Booking> findConflictingBookingsByOtherUsers(@Param("resourceId") Long resourceId,
                                                      @Param("startTime") LocalDateTime startTime,
                                                      @Param("endTime") LocalDateTime endTime,
                                                      @Param("userEmail") String userEmail);
    
    @Query("SELECT b FROM Booking b WHERE " +
           "(:userId IS NULL OR b.userId = :userId) AND " +
           "(:resourceId IS NULL OR b.resourceId = :resourceId) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:startDate IS NULL OR b.endTime >= :startDate) AND " +
           "(:endDate IS NULL OR b.startTime <= :endDate) " +
           "ORDER BY b.startTime DESC")
    List<Booking> findAllWithFilters(@Param("userId") Long userId,
                                     @Param("resourceId") Long resourceId,
                                     @Param("status") BookingStatus status,
                                     @Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);
}