package com.Campus_Hub.Smart_Campus_Operations_Hub.service;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingActionDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.BookingResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingService {
    
    BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String userEmail, String userName);
    
    BookingResponseDTO approveBooking(Long bookingId, BookingActionDTO actionDTO, String adminEmail);
    
    BookingResponseDTO rejectBooking(Long bookingId, BookingActionDTO actionDTO, String adminEmail);
    
    BookingResponseDTO cancelBooking(Long bookingId, BookingActionDTO actionDTO, String userEmail);

    void deleteBooking(Long bookingId, String adminEmail);
    
    List<BookingResponseDTO> getUserBookings(Long userId);

    List<BookingResponseDTO> getUserBookingsByEmail(String userEmail);
    
    List<BookingResponseDTO> getAllBookings(String adminEmail, Long userId, Long resourceId, 
                                           BookingStatus status, LocalDateTime startDate, 
                                           LocalDateTime endDate);

    byte[] generateBookingsReport(String adminEmail, LocalDateTime startDate, LocalDateTime endDate,
                                  BookingStatus status);
    
    boolean checkConflict(Long resourceId, LocalDateTime startTime, LocalDateTime endTime);
}