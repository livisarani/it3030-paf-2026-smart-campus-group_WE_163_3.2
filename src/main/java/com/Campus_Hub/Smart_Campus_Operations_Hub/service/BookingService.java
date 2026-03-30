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
    
    BookingResponseDTO cancelBooking(Long bookingId, String userEmail);
    
    List<BookingResponseDTO> getUserBookings(Long userId);
    
    List<BookingResponseDTO> getAllBookings(String adminEmail, Long userId, Long resourceId, 
                                           BookingStatus status, LocalDateTime startDate, 
                                           LocalDateTime endDate);
    
    boolean checkConflict(Long resourceId, LocalDateTime startTime, LocalDateTime endTime);
}