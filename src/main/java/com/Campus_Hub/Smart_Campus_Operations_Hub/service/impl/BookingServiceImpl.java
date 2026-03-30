package com.Campus_Hub.Smart_Campus_Operations_Hub.service.impl;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingActionDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.BookingResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.ConflictException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.ResourceNotFoundException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.UnauthorizedException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Booking;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.BookingRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    
    // Simple admin validation (you can replace with proper auth later)
    private static final String ADMIN_EMAIL = "admin@campus.com";

    @Override
    public BookingResponseDTO createBooking(BookingRequestDTO requestDTO, String userEmail, String userName) {
        // Validate time
        if (requestDTO.getStartTime().isAfter(requestDTO.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        if (requestDTO.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time cannot be in the past");
        }

        // Check conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            requestDTO.getResourceId(), requestDTO.getStartTime(), requestDTO.getEndTime());
        
        if (!conflicts.isEmpty()) {
            throw new ConflictException("Time slot conflicts with existing booking(s)");
        }

        // Get next ID (for demo, you'd get from UserService in real app)
        Long userId = 1L; // Placeholder

        // Create booking
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setUserName(userName);
        booking.setUserEmail(userEmail);
        booking.setResourceId(requestDTO.getResourceId());
        booking.setResourceName(requestDTO.getResourceName());
        booking.setStartTime(requestDTO.getStartTime());
        booking.setEndTime(requestDTO.getEndTime());
        booking.setPurpose(requestDTO.getPurpose());
        booking.setExpectedAttendees(requestDTO.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        return convertToDTO(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO approveBooking(Long bookingId, BookingActionDTO actionDTO, String adminEmail) {
        validateAdmin(adminEmail);
        Booking booking = getBooking(bookingId);
        
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Booking cannot be approved. Current status: " + booking.getStatus());
        }

        // Re-check conflicts before approval
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            booking.getResourceId(), booking.getStartTime(), booking.getEndTime());
        conflicts.removeIf(b -> b.getId().equals(bookingId));
        
        if (!conflicts.isEmpty()) {
            throw new ConflictException("Cannot approve: Time slot now conflicts with another booking");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setApprovalReason(actionDTO.getReason());
        
        return convertToDTO(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO rejectBooking(Long bookingId, BookingActionDTO actionDTO, String adminEmail) {
        validateAdmin(adminEmail);
        Booking booking = getBooking(bookingId);
        
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Booking cannot be rejected. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(actionDTO.getReason());
        
        return convertToDTO(bookingRepository.save(booking));
    }

    @Override
    public BookingResponseDTO cancelBooking(Long bookingId, String userEmail) {
        Booking booking = getBooking(bookingId);
        
        // Check if user owns the booking or is admin
        boolean isOwner = booking.getUserEmail().equals(userEmail);
        boolean isAdmin = ADMIN_EMAIL.equals(userEmail);
        
        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("Not authorized to cancel this booking");
        }
        
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Booking cannot be cancelled. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        
        return convertToDTO(bookingRepository.save(booking));
    }

    @Override
    public List<BookingResponseDTO> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponseDTO> getAllBookings(String adminEmail, Long userId, Long resourceId,
                                                   BookingStatus status, LocalDateTime startDate,
                                                   LocalDateTime endDate) {
        validateAdmin(adminEmail);
        
        return bookingRepository.findAllWithFilters(userId, resourceId, status, startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public boolean checkConflict(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        return !bookingRepository.findConflictingBookings(resourceId, startTime, endTime).isEmpty();
    }

    private void validateAdmin(String email) {
        if (!ADMIN_EMAIL.equals(email)) {
            throw new UnauthorizedException("Admin access required");
        }
    }

    private Booking getBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private BookingResponseDTO convertToDTO(Booking booking) {
        BookingResponseDTO dto = new BookingResponseDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUserId());
        dto.setUserName(booking.getUserName());
        dto.setUserEmail(booking.getUserEmail());
        dto.setResourceId(booking.getResourceId());
        dto.setResourceName(booking.getResourceName());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setPurpose(booking.getPurpose());
        dto.setExpectedAttendees(booking.getExpectedAttendees());
        dto.setStatus(booking.getStatus());
        dto.setRejectionReason(booking.getRejectionReason());
        dto.setApprovalReason(booking.getApprovalReason());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }
}