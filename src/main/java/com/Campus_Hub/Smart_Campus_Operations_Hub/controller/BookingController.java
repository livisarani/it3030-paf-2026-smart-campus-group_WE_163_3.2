package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingActionDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.BookingResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Create a new booking request
     * POST /api/bookings
     */
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO requestDTO,
            @RequestHeader(value = "X-User-Email", defaultValue = "user@campus.com") String userEmail,
            @RequestHeader(value = "X-User-Name", defaultValue = "User") String userName) {
        return new ResponseEntity<>(
            bookingService.createBooking(requestDTO, userEmail, userName), 
            HttpStatus.CREATED);
    }

    /**
     * Get current user's bookings
     * GET /api/bookings/my?userId=1
     */
    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
            @RequestParam(required = false) Long userId,
            @RequestHeader(value = "X-User-Email", defaultValue = "user@campus.com") String userEmail) {
        // Prefer email-based lookup to ensure the caller sees only their bookings.
        // Keep userId param for backward compatibility.
        if (userEmail != null && !userEmail.isBlank()) {
            return ResponseEntity.ok(bookingService.getUserBookingsByEmail(userEmail));
        }

        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    /**
     * Get all bookings with filters (Admin only)
     * GET /api/bookings?userId=1&resourceId=2&status=PENDING
     */
    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        return ResponseEntity.ok(bookingService.getAllBookings(adminEmail, userId, resourceId, 
                                status, startDate, endDate));
    }

    /**
     * Approve a booking (Admin only)
     * PUT /api/bookings/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<BookingResponseDTO> approveBooking(
            @PathVariable Long id,
            @RequestBody(required = false) BookingActionDTO actionDTO,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        if (actionDTO == null) {
            actionDTO = new BookingActionDTO();
        }
        return ResponseEntity.ok(bookingService.approveBooking(id, actionDTO, adminEmail));
    }

    /**
     * Reject a booking (Admin only)
     * PUT /api/bookings/{id}/reject
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingActionDTO actionDTO,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, actionDTO, adminEmail));
    }

    /**
     * Cancel a booking
     * PUT /api/bookings/{id}/cancel
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) BookingActionDTO actionDTO,
            @RequestHeader(value = "X-User-Email", defaultValue = "user@campus.com") String userEmail) {
        if (actionDTO == null) {
            actionDTO = new BookingActionDTO();
        }
        return ResponseEntity.ok(bookingService.cancelBooking(id, actionDTO, userEmail));
    }

    /**
     * Check if a time slot has conflicts
     * GET /api/bookings/check-conflict?resourceId=1&startTime=2024-01-01T10:00:00&endTime=2024-01-01T12:00:00
     */
    @GetMapping("/check-conflict")
    public ResponseEntity<Map<String, Boolean>> checkConflict(
            @RequestParam Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        boolean hasConflict = bookingService.checkConflict(resourceId, startTime, endTime);
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasConflict", hasConflict);
        return ResponseEntity.ok(response);
    }
}