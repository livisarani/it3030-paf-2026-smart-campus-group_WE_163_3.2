package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.AssignTechnicianRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.CommentRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.RejectTicketRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.StatusUpdateRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.TicketRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.TicketHistoryResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.TicketResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.UserSummaryDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.UserRole;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.UserRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    // ===================== GET /api/tickets/technicians =====================
    // Returns all users with TECHNICIAN role (admin only – used for assign-technician dropdown)
    @GetMapping("/technicians")
    public ResponseEntity<List<UserSummaryDTO>> getTechnicians(
            @AuthenticationPrincipal UserDetails principal) {
        resolveUser(principal); // ensure authenticated
        List<UserSummaryDTO> techs = userRepository.findByRole(UserRole.TECHNICIAN).stream()
                .map(u -> UserSummaryDTO.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .phone(u.getPhone())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(techs);
    }

    // ===================== GET /api/tickets/my =====================
    // Returns only tickets reported by the currently authenticated user (all roles)
    // Useful for "My Tickets" view where even admins/technicians want to see their own submissions
    @GetMapping("/my")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets(
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.getMyTickets(currentUser));
    }

    // ===================== Helper =====================
    private User resolveUser(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new com.Campus_Hub.Smart_Campus_Operations_Hub.exception.ResourceNotFoundException("User", "username", principal.getUsername()));
    }

    // ===================== POST /api/tickets =====================
    // Create a new incident ticket with up to 3 image attachments (multipart/form-data)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponseDTO> createTicket(
            @RequestPart("ticket") @Valid TicketRequestDTO dto,
            @RequestPart(value = "images", required = false) MultipartFile[] images,
            @AuthenticationPrincipal UserDetails principal) {
        User reporter = resolveUser(principal);
        TicketResponseDTO response = ticketService.createTicket(dto, images, reporter);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===================== GET /api/tickets =====================
    // List tickets (role-filtered: Admin=all, Technician=assigned, others=own)
    @GetMapping
    public ResponseEntity<List<TicketResponseDTO>> getAllTickets(
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.getAllTickets(currentUser));
    }

    // ===================== GET /api/tickets/{id} =====================
    // Get a specific ticket by ID
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.getTicketById(id, currentUser));
    }

    // ===================== PUT /api/tickets/{id} =====================
    // Update ticket details (reporter or admin, OPEN status only)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketResponseDTO> updateTicket(
            @PathVariable Long id,
            @RequestPart("ticket") @Valid TicketRequestDTO dto,
            @RequestPart(value = "images", required = false) MultipartFile[] images,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.updateTicket(id, dto, images, currentUser));
    }

    // ===================== DELETE /api/tickets/{id} =====================
    // Delete a ticket (reporter or admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        ticketService.deleteTicket(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "Ticket #" + id + " deleted successfully"));
    }

    // ===================== PATCH /api/tickets/{id}/status =====================
    // Update ticket status (workflow rules enforced per role)
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponseDTO> changeStatus(
            @PathVariable Long id,
            @RequestBody @Valid StatusUpdateRequestDTO dto,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(
                ticketService.changeStatus(id, dto.getStatus(), dto.getResolutionNotes(), currentUser));
    }

    // ===================== PATCH /api/tickets/{id}/assign =====================
    // Assign technician to ticket (admin only)
    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketResponseDTO> assignTechnician(
            @PathVariable Long id,
            @RequestBody @Valid AssignTechnicianRequestDTO dto,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        return ResponseEntity.ok(ticketService.assignTechnician(id, dto.getTechnicianId(), admin));
    }

    // ===================== PATCH /api/tickets/{id}/reject =====================
    // Reject a ticket with a validated reason (admin only)
    @PatchMapping("/{id}/reject")
    public ResponseEntity<TicketResponseDTO> rejectTicket(
            @PathVariable Long id,
            @RequestBody @Valid RejectTicketRequestDTO dto,
            @AuthenticationPrincipal UserDetails principal) {
        User admin = resolveUser(principal);
        return ResponseEntity.ok(ticketService.rejectTicket(id, dto.getReason(), admin));
    }

    // ===================== DELETE /api/tickets/{ticketId}/attachments/{filename} =====================
    // Remove a specific attachment from a ticket
    @DeleteMapping("/{ticketId}/attachments/{filename}")
    public ResponseEntity<TicketResponseDTO> removeAttachment(
            @PathVariable Long ticketId,
            @PathVariable String filename,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.removeAttachment(ticketId, filename, currentUser));
    }

    // ===================== POST /api/tickets/{id}/comments =====================
    // Add a comment to a ticket
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponseDTO> addComment(
            @PathVariable Long id,
            @RequestBody @Valid CommentRequestDTO dto,
            @AuthenticationPrincipal UserDetails principal) {
        User author = resolveUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(id, dto, author));
    }

    // ===================== PUT /api/tickets/{id}/comments/{commentId} =====================
    // Edit own comment
    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketResponseDTO> updateComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @RequestBody @Valid CommentRequestDTO dto,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.updateComment(id, commentId, dto, currentUser));
    }

    // ===================== DELETE /api/tickets/{id}/comments/{commentId} =====================
    // Delete own comment (or admin)
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketResponseDTO> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.deleteComment(id, commentId, currentUser));
    }

    // ===================== GET /api/tickets/{id}/history =====================
    // Get full activity history for a ticket
    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketHistoryResponseDTO>> getTicketHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        return ResponseEntity.ok(ticketService.getTicketHistory(id, currentUser));
    }

    // ===================== GET /api/tickets/{id}/report =====================
    // Open the HTML resolution report (browser prints it as PDF)
    @GetMapping("/{id}/report")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        User currentUser = resolveUser(principal);
        byte[] html = ticketService.generateHtmlReport(id, currentUser);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.setContentLength(html.length);
        return new ResponseEntity<>(html, headers, HttpStatus.OK);
    }
}

