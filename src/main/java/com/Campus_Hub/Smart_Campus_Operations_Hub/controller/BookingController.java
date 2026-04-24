package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingActionDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.BookingRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.BookingResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
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

    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO requestDTO,
            @RequestHeader(value = "X-User-Email", defaultValue = "user@campus.com") String userEmail,
            @RequestHeader(value = "X-User-Name", defaultValue = "User") String userName) {
        return new ResponseEntity<>(
                bookingService.createBooking(requestDTO, userEmail, userName),
                HttpStatus.CREATED);
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
            @RequestParam(required = false) Long userId,
            @RequestHeader(value = "X-User-Email", defaultValue = "user@campus.com") String userEmail) {
        if (userEmail != null && !userEmail.isBlank()) {
            return ResponseEntity.ok(bookingService.getUserBookingsByEmail(userEmail));
        }
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        return ResponseEntity.ok(
                bookingService.getAllBookings(adminEmail, userId, resourceId, status, startDate, endDate));
    }

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

    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingActionDTO actionDTO,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, actionDTO, adminEmail));
    }

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        bookingService.deleteBooking(id, adminEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check-conflict")
    public ResponseEntity<Map<String, Object>> checkConflict(
            @RequestParam Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        boolean hasConflict = bookingService.checkConflict(resourceId, startTime, endTime);
        Map<String, Object> response = new HashMap<>();
        response.put("hasConflict", hasConflict);
        response.put("message", hasConflict
                ? "Selected resource is already booked for the chosen time slot."
                : "Resource is available for the selected time slot.");
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/report", produces = "application/pdf")
    public ResponseEntity<byte[]> generateReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String status,
            @RequestHeader(value = "X-User-Email", defaultValue = "admin@campus.com") String adminEmail) {
        BookingStatus reportStatus = null;
        if (status != null && !status.isBlank()) {
            reportStatus = BookingStatus.valueOf(status.trim().toUpperCase());
        }

        byte[] reportBytes = bookingService.generateBookingsReport(adminEmail, startDate, endDate, reportStatus);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=booking-requests-report.pdf");
        headers.add(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(reportBytes);
    }
}
