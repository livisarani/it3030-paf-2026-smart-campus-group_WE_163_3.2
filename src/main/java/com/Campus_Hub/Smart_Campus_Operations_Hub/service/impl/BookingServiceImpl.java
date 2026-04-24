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
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final DateTimeFormatter REPORT_DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private static final float REPORT_MARGIN = 48f;
    private static final float REPORT_HEADER_HEIGHT = 96f;
    private static final float REPORT_CARD_HEIGHT = 104f;

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
    public BookingResponseDTO cancelBooking(Long bookingId, BookingActionDTO actionDTO, String userEmail) {
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
        booking.setCancelReason(actionDTO != null ? actionDTO.getReason() : null);
        
        return convertToDTO(bookingRepository.save(booking));
    }

    @Override
    public void deleteBooking(Long bookingId, String adminEmail) {
        validateAdmin(adminEmail);
        Booking booking = getBooking(bookingId);

        if (booking.getStatus() != BookingStatus.APPROVED
                && booking.getStatus() != BookingStatus.REJECTED
                && booking.getStatus() != BookingStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Only approved, rejected, or cancelled bookings can be deleted. Current status: " + booking.getStatus());
        }

        if (booking.getStatus() == BookingStatus.APPROVED) {
            LocalDateTime endTime = booking.getEndTime() != null ? booking.getEndTime() : booking.getStartTime();
            if (endTime != null && !endTime.isBefore(LocalDateTime.now())) {
                throw new IllegalStateException(
                        "Approved bookings with future dates cannot be deleted. Only past approved bookings can be deleted.");
            }
        }

        bookingRepository.delete(booking);
    }

    @Override
    public List<BookingResponseDTO> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingResponseDTO> getUserBookingsByEmail(String userEmail) {
        return bookingRepository.findByUserEmail(userEmail).stream()
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
    public byte[] generateBookingsReport(String adminEmail, LocalDateTime startDate, LocalDateTime endDate,
                                         BookingStatus status) {
        validateAdmin(adminEmail);

        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date and time must be after the start date and time");
        }

        List<BookingResponseDTO> bookings = bookingRepository.findAllWithFilters(null, null, status, startDate, endDate)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfPageState state = addReportPage(document, "Booking Requests Report", startDate, endDate, status, bookings.size());

            if (bookings.isEmpty()) {
                drawText(state.contentStream, "No bookings matched the selected filters.", REPORT_MARGIN, state.y,
                        PDType1Font.HELVETICA_BOLD, 12);
            } else {
                for (BookingResponseDTO booking : bookings) {
                    state = ensureSpace(document, state, REPORT_CARD_HEIGHT + 12);
                    drawBookingCard(state, booking);
                }
            }

            state.contentStream.close();
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate booking report", e);
        }
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
        dto.setCancelReason(booking.getCancelReason());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }

    private PdfPageState addReportPage(PDDocument document, String title, LocalDateTime startDate,
                                       LocalDateTime endDate, BookingStatus status, int totalBookings) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        PdfPageState state = new PdfPageState(page, contentStream, page.getMediaBox().getHeight() - 56, title, startDate, endDate, status, totalBookings);

        float width = page.getMediaBox().getWidth() - (REPORT_MARGIN * 2);
        drawText(contentStream, title, REPORT_MARGIN, state.y, PDType1Font.HELVETICA_BOLD, 20);
        state.y -= 22;
        drawText(contentStream, "Generated on " + LocalDateTime.now().format(REPORT_DATE_TIME_FORMAT), REPORT_MARGIN, state.y,
                PDType1Font.HELVETICA, 9);
        state.y -= 14;
        drawText(contentStream, "Filters: " + formatFilterRange(startDate, endDate) + " | Status: " + (status != null ? status : "All"),
                REPORT_MARGIN, state.y, PDType1Font.HELVETICA, 10);
        state.y -= 16;
        drawText(contentStream, "Total bookings: " + totalBookings, REPORT_MARGIN, state.y, PDType1Font.HELVETICA_BOLD, 11);
        state.y -= 18;

        contentStream.setStrokingColor(35, 99, 49);
        contentStream.setLineWidth(1.1f);
        contentStream.moveTo(REPORT_MARGIN, state.y);
        contentStream.lineTo(REPORT_MARGIN + width, state.y);
        contentStream.stroke();
        state.y -= REPORT_HEADER_HEIGHT - 66;
        return state;
    }

    private PdfPageState ensureSpace(PDDocument document, PdfPageState state, float requiredHeight) throws IOException {
        if (state.y - requiredHeight >= REPORT_MARGIN) {
            return state;
        }

        state.contentStream.close();
        return addReportPage(document, state.title + " (continued)", state.startDate, state.endDate, state.status, state.totalBookings);
    }

    private void drawBookingCard(PdfPageState state, BookingResponseDTO booking) throws IOException {
        float width = state.page.getMediaBox().getWidth() - (REPORT_MARGIN * 2);
        float cardTop = state.y;
        float cardBottom = cardTop - REPORT_CARD_HEIGHT;

        state.contentStream.setNonStrokingColor(246, 250, 247);
        state.contentStream.addRect(REPORT_MARGIN, cardBottom, width, REPORT_CARD_HEIGHT);
        state.contentStream.fill();

        state.contentStream.setStrokingColor(223, 232, 227);
        state.contentStream.addRect(REPORT_MARGIN, cardBottom, width, REPORT_CARD_HEIGHT);
        state.contentStream.stroke();

        float textX = REPORT_MARGIN + 12;
        float textY = cardTop - 18;
        drawText(state.contentStream, "Request #REQ-" + (2000 + booking.getId()), textX, textY, PDType1Font.HELVETICA_BOLD, 11);
        drawText(state.contentStream, booking.getStatus() != null ? booking.getStatus().name() : "-", REPORT_MARGIN + width - 120, textY,
                PDType1Font.HELVETICA_BOLD, 10);

        textY -= 18;
        drawText(state.contentStream, "User: " + shortText(safeText(booking.getUserName()), 34), textX, textY, PDType1Font.HELVETICA, 10);
        textY -= 14;
        drawText(state.contentStream, "Resource: " + shortText(safeText(booking.getResourceName()), 38), textX, textY, PDType1Font.HELVETICA, 10);
        textY -= 14;
        drawText(state.contentStream,
                "Time: " + formatReportDateTime(booking.getStartTime()) + " - " + formatReportDateTime(booking.getEndTime()),
                textX, textY, PDType1Font.HELVETICA, 10);
        textY -= 14;
        drawText(state.contentStream, "Purpose: " + shortText(safeText(booking.getPurpose()), 72), textX, textY,
                PDType1Font.HELVETICA, 10);

        state.y = cardBottom - 14;
    }

    private void drawText(PDPageContentStream contentStream, String text, float x, float y, PDType1Font font, float size)
            throws IOException {
        contentStream.setNonStrokingColor(0, 0, 0);
        contentStream.beginText();
        contentStream.setFont(font, size);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(safeText(text));
        contentStream.endText();
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String shortText(String value, int maxLength) {
        if (value == null) return "-";
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) return trimmed;
        return trimmed.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String formatReportDateTime(LocalDateTime value) {
        return value == null ? "-" : value.format(REPORT_DATE_TIME_FORMAT);
    }

    private String formatFilterRange(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null && endDate == null) {
            return "All dates";
        }
        if (startDate != null && endDate != null) {
            return formatReportDateTime(startDate) + " to " + formatReportDateTime(endDate);
        }
        if (startDate != null) {
            return "From " + formatReportDateTime(startDate);
        }
        return "Until " + formatReportDateTime(endDate);
    }

    private static class PdfPageState {
        private final PDPage page;
        private final PDPageContentStream contentStream;
        private final String title;
        private final LocalDateTime startDate;
        private final LocalDateTime endDate;
        private final BookingStatus status;
        private final int totalBookings;
        private float y;

        private PdfPageState(PDPage page, PDPageContentStream contentStream, float y, String title,
                             LocalDateTime startDate, LocalDateTime endDate, BookingStatus status, int totalBookings) {
            this.page = page;
            this.contentStream = contentStream;
            this.y = y;
            this.title = title;
            this.startDate = startDate;
            this.endDate = endDate;
            this.status = status;
            this.totalBookings = totalBookings;
        }
    }
}