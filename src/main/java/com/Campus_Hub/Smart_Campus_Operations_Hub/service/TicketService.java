package com.Campus_Hub.Smart_Campus_Operations_Hub.service;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.CommentRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.TicketRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.TicketHistoryResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.TicketResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.BadRequestException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.ResourceNotFoundException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Comment;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Resource;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Ticket;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.TicketHistory;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketStatus;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.UserRole;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.ResourceRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.TicketHistoryRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.TicketRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;
    private final TicketHistoryRepository ticketHistoryRepository;

    @Value("${app.upload.dir:./uploads/tickets}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    // ===================== CREATE =====================

    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO dto, MultipartFile[] images, User reporter) {
        // Validate image count
        if (images != null && images.length > 3) {
            throw new BadRequestException("A maximum of 3 image attachments are allowed per ticket");
        }

        Ticket.TicketBuilder builder = Ticket.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .priority(dto.getPriority())
                .location(dto.getLocation())
                .reporter(reporter)
                .contactName(dto.getContactName())
                .contactEmail(dto.getContactEmail())
                .contactPhone(dto.getContactPhone());

        // Link to resource if provided
        if (dto.getResourceId() != null) {
            Resource resource = resourceRepository.findById(dto.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", dto.getResourceId()));
            builder.resource(resource);
        }

        Ticket ticket = builder.build();

        // Save images
        List<String> imagePaths = saveImages(images, ticket);
        ticket.setImagePaths(imagePaths);

        Ticket saved = ticketRepository.save(ticket);

        // Record history: ticket created
        recordHistory(saved, "TICKET_CREATED",
                "Ticket created: \"" + saved.getTitle() + "\" [" + saved.getCategory() + " / " + saved.getPriority() + "]",
                reporter);

        return toResponseDTO(saved);
    }

    // ===================== READ =====================

    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getAllTickets(User currentUser) {
        List<Ticket> tickets;
        if (currentUser.getRole() == UserRole.ADMIN) {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else if (currentUser.getRole() == UserRole.TECHNICIAN) {
            tickets = ticketRepository.findByAssignedTechnicianOrderByCreatedAtDesc(currentUser);
        } else {
            tickets = ticketRepository.findByReporterOrderByCreatedAtDesc(currentUser);
        }
        return tickets.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    /**
     * Returns tickets REPORTED BY the current user regardless of their role.
     * Used by the "My Tickets" page so admins/technicians can also see their own submissions.
     */
    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getMyTickets(User currentUser) {
        return ticketRepository.findByReporterOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponseDTO getTicketById(Long id, User currentUser) {
        Ticket ticket = findTicket(id);
        checkReadAccess(ticket, currentUser);
        return toResponseDTO(ticket);
    }

    // ===================== UPDATE =====================

    @Transactional
    public TicketResponseDTO updateTicket(Long id, TicketRequestDTO dto, MultipartFile[] newImages, User currentUser) {
        Ticket ticket = findTicket(id);
        checkOwnerOrAdmin(ticket, currentUser);

        // Only OPEN tickets can be edited
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("Only OPEN tickets can be edited");
        }

        ticket.setTitle(dto.getTitle());
        ticket.setDescription(dto.getDescription());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority());
        ticket.setLocation(dto.getLocation());
        ticket.setContactName(dto.getContactName());
        ticket.setContactEmail(dto.getContactEmail());
        ticket.setContactPhone(dto.getContactPhone());

        if (dto.getResourceId() != null) {
            Resource resource = resourceRepository.findById(dto.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", dto.getResourceId()));
            ticket.setResource(resource);
        }

        // Handle new images
        if (newImages != null && newImages.length > 0) {
            int total = ticket.getImagePaths().size() + newImages.length;
            if (total > 3) {
                throw new BadRequestException("Total attachments cannot exceed 3. Currently has " + ticket.getImagePaths().size());
            }
            List<String> additional = saveImages(newImages, ticket);
            ticket.getImagePaths().addAll(additional);
        }

        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, "TICKET_UPDATED", "Ticket details updated by " + currentUser.getUsername(), currentUser);
        return toResponseDTO(saved);
    }

    // ===================== STATUS WORKFLOW =====================

    @Transactional
    public TicketResponseDTO changeStatus(Long id, TicketStatus newStatus, String resolutionNotes, User currentUser) {
        Ticket ticket = findTicket(id);
        // newStatus is already validated as a valid enum by the DTO layer
        validateTransition(ticket, newStatus, currentUser);

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(newStatus);

        if (newStatus == TicketStatus.RESOLVED && resolutionNotes != null) {
            ticket.setResolutionNotes(resolutionNotes);
        }

        Ticket saved = ticketRepository.save(ticket);

        // Record history: status changed
        String histDesc = "Status changed: " + oldStatus + " → " + newStatus;
        if (newStatus == TicketStatus.RESOLVED && resolutionNotes != null && !resolutionNotes.isBlank()) {
            histDesc += " | Resolution: " + resolutionNotes;
        }
        recordHistory(saved, "STATUS_CHANGED", histDesc, currentUser);

        // Notify reporter of status change
        if (!ticket.getReporter().getId().equals(currentUser.getId())) {
            notificationService.createNotification(
                    ticket.getReporter(),
                    "Your ticket #" + id + " \"" + ticket.getTitle() + "\" status changed from " + oldStatus + " to " + newStatus,
                    id);
        }

        return toResponseDTO(saved);
    }

    private void validateTransition(Ticket ticket, TicketStatus newStatus, User user) {
        TicketStatus current = ticket.getStatus();
        UserRole role = user.getRole();

        // Reporters can close resolved tickets
        if (role == UserRole.STUDENT || role == UserRole.STAFF) {
            if (isReporter(ticket, user) && current == TicketStatus.RESOLVED && newStatus == TicketStatus.CLOSED) {
                return;
            }
            throw new AccessDeniedException("You are not authorized to change this ticket's status");
        }

        // Technician: IN_PROGRESS → RESOLVED only
        if (role == UserRole.TECHNICIAN) {
            boolean isAssigned = ticket.getAssignedTechnician() != null &&
                    ticket.getAssignedTechnician().getId().equals(user.getId());
            if (!isAssigned) {
                throw new AccessDeniedException("You are not assigned to this ticket");
            }
            if (current == TicketStatus.IN_PROGRESS && newStatus == TicketStatus.RESOLVED) return;
            throw new BadRequestException("Technicians can only transition from IN_PROGRESS to RESOLVED");
        }

        // Admin: any valid transition except already CLOSED/REJECTED
        if (role == UserRole.ADMIN) {
            if (current == TicketStatus.CLOSED || current == TicketStatus.REJECTED) {
                throw new BadRequestException("Cannot change status of a " + current + " ticket");
            }
            return;
        }

        throw new BadRequestException("Invalid status transition from " + current + " to " + newStatus);
    }

    // ===================== ASSIGN TECHNICIAN =====================

    @Transactional
    public TicketResponseDTO assignTechnician(Long ticketId, Long technicianId, User admin) {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admins can assign technicians");
        }
        Ticket ticket = findTicket(ticketId);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", technicianId));
        if (technician.getRole() != UserRole.TECHNICIAN) {
            throw new BadRequestException("User is not a technician");
        }
        String prevTech = ticket.getAssignedTechnician() != null
                ? ticket.getAssignedTechnician().getUsername() : null;
        ticket.setAssignedTechnician(technician);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        Ticket saved = ticketRepository.save(ticket);

        // Record history
        String histDesc = prevTech == null
                ? "Technician assigned: " + technician.getFullName() + " (@" + technician.getUsername() + ")"
                : "Technician reassigned from @" + prevTech + " to " + technician.getFullName() + " (@" + technician.getUsername() + ")";
        recordHistory(saved, "TECHNICIAN_ASSIGNED", histDesc, admin);

        // Notify technician
        notificationService.createNotification(
                technician,
                "You have been assigned to ticket #" + ticketId + ": \"" + ticket.getTitle() + "\"",
                ticketId);

        return toResponseDTO(saved);
    }

    // ===================== REJECT =====================

    @Transactional
    public TicketResponseDTO rejectTicket(Long id, String reason, User admin) {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admins can reject tickets");
        }
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("Rejection reason is required");
        }
        Ticket ticket = findTicket(id);
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new BadRequestException("Cannot reject a " + ticket.getStatus() + " ticket");
        }
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(reason);
        Ticket saved = ticketRepository.save(ticket);

        // Record history
        recordHistory(saved, "TICKET_REJECTED", "Ticket rejected. Reason: " + reason, admin);

        // Notify reporter
        notificationService.createNotification(
                ticket.getReporter(),
                "Your ticket #" + id + " \"" + ticket.getTitle() + "\" has been rejected. Reason: " + reason,
                id);

        return toResponseDTO(saved);
    }

    // ===================== DELETE =====================

    @Transactional
    public void deleteTicket(Long id, User currentUser) {
        Ticket ticket = findTicket(id);
        checkOwnerOrAdmin(ticket, currentUser);
        // Delete attachment files
        ticket.getImagePaths().forEach(path -> deleteFile(path));
        ticketRepository.delete(ticket);
    }

    // ===================== REMOVE ATTACHMENT =====================

    @Transactional
    public TicketResponseDTO removeAttachment(Long ticketId, String filename, User currentUser) {
        Ticket ticket = findTicket(ticketId);
        checkOwnerOrAdmin(ticket, currentUser);
        boolean removed = ticket.getImagePaths().remove(filename);
        if (!removed) {
            throw new ResourceNotFoundException("Attachment not found: " + filename);
        }
        deleteFile(filename);
        return toResponseDTO(ticketRepository.save(ticket));
    }

    // ===================== COMMENTS =====================

    @Transactional
    public TicketResponseDTO addComment(Long ticketId, CommentRequestDTO dto, User author) {
        Ticket ticket = findTicket(ticketId);
        checkReadAccess(ticket, author);

        Comment comment = Comment.builder()
                .content(dto.getContent())
                .author(author)
                .ticket(ticket)
                .build();
        ticket.getComments().add(comment);

        Ticket saved2 = ticketRepository.save(ticket);
        recordHistory(saved2, "COMMENT_ADDED",
                "Comment added by @" + author.getUsername() + ": \"" + truncate(dto.getContent(), 80) + "\"",
                author);

        // Notify ticket reporter if commenter is different
        if (!author.getId().equals(ticket.getReporter().getId())) {
            notificationService.createNotification(
                    ticket.getReporter(),
                    author.getUsername() + " commented on your ticket #" + ticketId,
                    ticketId);
        }
        // Notify assigned technician if they didn't comment
        if (ticket.getAssignedTechnician() != null &&
                !author.getId().equals(ticket.getAssignedTechnician().getId())) {
            notificationService.createNotification(
                    ticket.getAssignedTechnician(),
                    author.getUsername() + " commented on ticket #" + ticketId + " assigned to you",
                    ticketId);
        }

        return toResponseDTO(saved2);
    }

    @Transactional
    public TicketResponseDTO updateComment(Long ticketId, Long commentId, CommentRequestDTO dto, User currentUser) {
        Ticket ticket = findTicket(ticketId);
        Comment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        // Only the author can edit their comment
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only edit your own comments");
        }

        comment.setContent(dto.getContent());
        comment.setEdited(true);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, "COMMENT_UPDATED", "Comment updated by @" + currentUser.getUsername(), currentUser);
        return toResponseDTO(saved);
    }

    @Transactional
    public TicketResponseDTO deleteComment(Long ticketId, Long commentId, User currentUser) {
        Ticket ticket = findTicket(ticketId);
        Comment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        // Author or Admin can delete
        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("You can only delete your own comments");
        }

        ticket.getComments().remove(comment);
        Ticket saved = ticketRepository.save(ticket);
        recordHistory(saved, "COMMENT_DELETED", "Comment deleted by @" + currentUser.getUsername(), currentUser);
        return toResponseDTO(saved);
    }

    // ===================== TICKET HISTORY =====================

    @Transactional(readOnly = true)
    public List<TicketHistoryResponseDTO> getTicketHistory(Long ticketId, User currentUser) {
        Ticket ticket = findTicket(ticketId);
        checkReadAccess(ticket, currentUser);
        return ticketHistoryRepository.findByTicketOrderByTimestampAsc(ticket)
                .stream()
                .map(h -> TicketHistoryResponseDTO.builder()
                        .id(h.getId())
                        .event(h.getEvent())
                        .description(h.getDescription())
                        .actorUsername(h.getActor() != null ? h.getActor().getUsername() : null)
                        .actorFullName(h.getActor() != null ? h.getActor().getFullName() : null)
                        .timestamp(h.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    /** Internal helper – saves a history record (suppressed from outer @Transactional) */
    private void recordHistory(Ticket ticket, String event, String description, User actor) {
        try {
            TicketHistory history = TicketHistory.builder()
                    .ticket(ticket)
                    .event(event)
                    .description(description)
                    .actor(actor)
                    .build();
            ticketHistoryRepository.save(history);
        } catch (Exception e) {
            // Never break the main flow because of a history write failure
        }
    }

    // ===================== PDF RESOLUTION REPORT (HTML → print-as-PDF) =====================

    /**
     * Generates a richly styled HTML report string.
     * The frontend opens this in a new browser tab; the user can Ctrl+P → Save as PDF.
     */
    @Transactional(readOnly = true)
    public byte[] generateHtmlReport(Long ticketId, User currentUser) {
        Ticket ticket = findTicket(ticketId);
        checkReadAccess(ticket, currentUser);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

        // Compute time-to-resolve
        String timeTaken = "—";
        if (ticket.getCreatedAt() != null && ticket.getUpdatedAt() != null
                && (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)) {
            Duration dur = Duration.between(ticket.getCreatedAt(), ticket.getUpdatedAt());
            long hours = dur.toHours();
            timeTaken = hours > 0 ? hours + "h " + dur.toMinutesPart() + "m" : dur.toMinutes() + " min";
        }

        // Build history rows
        List<TicketHistory> historyList = ticketHistoryRepository.findByTicketOrderByTimestampAsc(ticket);
        StringBuilder historyRows = new StringBuilder();
        for (TicketHistory h : historyList) {
            String time = h.getTimestamp() != null ? h.getTimestamp().format(fmt) : "—";
            String actor = h.getActor() != null ? "@" + h.getActor().getUsername() : "system";
            historyRows.append("<tr>")
                    .append("<td>").append(esc(time)).append("</td>")
                    .append("<td class='event'>").append(esc(h.getEvent().replace("_", " "))).append("</td>")
                    .append("<td>").append(esc(h.getDescription() != null ? h.getDescription() : "")).append("</td>")
                    .append("<td class='actor'>").append(esc(actor)).append("</td>")
                    .append("</tr>\n");
        }

        String techInfo = ticket.getAssignedTechnician() != null
                ? ticket.getAssignedTechnician().getFullName() + " (@" + ticket.getAssignedTechnician().getUsername() + ")"
                : "<em style='color:#9ca3af'>Unassigned</em>";

        String html = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>"
                + "<title>Ticket #" + ticket.getId() + " – Resolution Report</title>"
                + "<style>"
                + "body{font-family:Arial,sans-serif;color:#1e2b20;margin:0;padding:0;background:#f4f6f4}"
                + ".page{max-width:900px;margin:0 auto;background:#fff;padding:0 0 40px}"
                + ".header{background:linear-gradient(135deg,#236331,#515953);color:#fff;padding:28px 36px}"
                + ".header h1{margin:4px 0;font-size:22px}.header .sub{opacity:.75;font-size:13px;margin:4px 0 0}"
                + ".header .meta{font-size:11px;opacity:.65;margin:6px 0 0}"
                + ".section{padding:22px 36px 6px}.section h2{font-size:14px;color:#236331;border-bottom:2px solid #e8f5eb;padding-bottom:6px;margin-bottom:14px}"
                + "table.info{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px}"
                + "table.info td{padding:8px 10px;border-bottom:1px solid #e4e9e5}"
                + "table.info .lbl{background:#e8f5eb;font-weight:bold;color:#515953;width:22%;white-space:nowrap}"
                + ".desc-box{background:#f0f9f2;border-left:4px solid #236331;padding:13px 16px;border-radius:6px;font-size:13px;line-height:1.7;white-space:pre-wrap}"
                + ".res-box{background:#d1fae5;border-left:4px solid #059669;padding:13px 16px;border-radius:6px;font-size:13px;line-height:1.7;white-space:pre-wrap;color:#065f46}"
                + ".rej-box{background:#fee2e2;border-left:4px solid #dc2626;padding:13px 16px;border-radius:6px;font-size:13px;line-height:1.7;white-space:pre-wrap;color:#991b1b}"
                + "table.hist{width:100%;border-collapse:collapse;font-size:12px}"
                + "table.hist th{background:#515953;color:#fff;padding:8px 10px;text-align:left}"
                + "table.hist tr:nth-child(even){background:#f8faf8}"
                + "table.hist td{padding:7px 10px;border-bottom:1px solid #e4e9e5}"
                + "table.hist .event{font-weight:bold;color:#236331}"
                + "table.hist .actor{color:#7a8578;font-style:italic}"
                + ".badge{display:inline-block;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:.04em}"
                + ".footer{padding:18px 36px 0;border-top:1px solid #e4e9e5;color:#9ca3af;font-size:11px;text-align:center}"
                + "@media print{body{background:#fff}.page{box-shadow:none}}"
                + "</style></head><body>"
                + "<div class='page'>"
                + "<div class='header'>"
                + "<div style='font-size:11px;opacity:.7;letter-spacing:.06em;text-transform:uppercase'>Smart Campus Operations Hub</div>"
                + "<h1>Ticket Resolution Report</h1>"
                + "<div class='sub'>Ticket #" + ticket.getId() + " &nbsp;|&nbsp; " + esc(ticket.getTitle()) + "</div>"
                + "<div class='meta'>Generated: " + LocalDateTime.now().format(fmt) + "</div>"
                + "</div>"

                // Summary
                + "<div class='section'><h2>📋 Summary</h2>"
                + "<table class='info'>"
                + "<tr><td class='lbl'>Ticket #</td><td>" + ticket.getId() + "</td><td class='lbl'>Status</td><td>" + ticket.getStatus().name().replace("_", " ") + "</td></tr>"
                + "<tr><td class='lbl'>Priority</td><td>" + ticket.getPriority().name() + "</td><td class='lbl'>Category</td><td>" + esc(ticket.getCategory().name().replace("_", " ")) + "</td></tr>"
                + "<tr><td class='lbl'>Location</td><td>" + esc(ticket.getLocation()) + "</td><td class='lbl'>Resource</td><td>" + (ticket.getResource() != null ? esc(ticket.getResource().getName()) : "—") + "</td></tr>"
                + "<tr><td class='lbl'>Created</td><td>" + (ticket.getCreatedAt() != null ? ticket.getCreatedAt().format(fmt) : "—") + "</td><td class='lbl'>Last Updated</td><td>" + (ticket.getUpdatedAt() != null ? ticket.getUpdatedAt().format(fmt) : "—") + "</td></tr>"
                + "<tr><td class='lbl'>Time to Resolve</td><td colspan='3'>" + timeTaken + "</td></tr>"
                + "</table></div>"

                // People
                + "<div class='section'><h2>👥 People</h2>"
                + "<table class='info'>"
                + "<tr><td class='lbl'>Reporter</td><td>" + esc(ticket.getReporter().getFullName()) + " (@" + esc(ticket.getReporter().getUsername()) + ")" + "</td><td class='lbl'>Technician</td><td>" + techInfo + "</td></tr>"
                + (ticket.getContactName() != null || ticket.getContactEmail() != null || ticket.getContactPhone() != null
                    ? "<tr><td class='lbl'>Contact</td><td colspan='3'>"
                        + (ticket.getContactName() != null ? esc(ticket.getContactName()) + " " : "")
                        + (ticket.getContactEmail() != null ? "| " + esc(ticket.getContactEmail()) + " " : "")
                        + (ticket.getContactPhone() != null ? "| " + esc(ticket.getContactPhone()) : "")
                        + "</td></tr>" : "")
                + "</table></div>"

                // Description
                + "<div class='section'><h2>📝 Issue Description</h2>"
                + "<div class='desc-box'>" + esc(ticket.getDescription()) + "</div></div>"

                // Resolution Notes
                + (ticket.getResolutionNotes() != null && !ticket.getResolutionNotes().isBlank()
                    ? "<div class='section'><h2>✅ Resolution Notes</h2><div class='res-box'>" + esc(ticket.getResolutionNotes()) + "</div></div>" : "")

                // Rejection Reason
                + (ticket.getRejectionReason() != null && !ticket.getRejectionReason().isBlank()
                    ? "<div class='section'><h2>🚫 Rejection Reason</h2><div class='rej-box'>" + esc(ticket.getRejectionReason()) + "</div></div>" : "")

                // Activity Timeline
                + (historyRows.length() > 0
                    ? "<div class='section'><h2>🕐 Activity Timeline</h2>"
                        + "<table class='hist'><thead><tr><th>Time</th><th>Event</th><th>Details</th><th>By</th></tr></thead><tbody>"
                        + historyRows + "</tbody></table></div>" : "")

                // Footer
                + "<div class='footer'>This report was automatically generated by Smart Campus Operations Hub &nbsp;·&nbsp; For queries, contact the campus IT helpdesk</div>"
                + "</div>"
                + "<script>window.onload=function(){window.print();}</script>"
                + "</body></html>";

        return html.getBytes(StandardCharsets.UTF_8);
    }

    /** HTML-escape helper */
    private String esc(String s) {
        if (s == null) return "—";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    // ===================== HELPER METHODS =====================
    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "…";
    }

    private boolean isReporter(Ticket ticket, User user) {
        return ticket.getReporter().getId().equals(user.getId());
    }

    private void checkReadAccess(Ticket ticket, User user) {
        if (user.getRole() == UserRole.ADMIN) return;
        if (user.getRole() == UserRole.TECHNICIAN) {
            if (ticket.getAssignedTechnician() != null &&
                    ticket.getAssignedTechnician().getId().equals(user.getId())) return;
        }
        if (isReporter(ticket, user)) return;
        throw new AccessDeniedException("You do not have access to this ticket");
    }

    private void checkOwnerOrAdmin(Ticket ticket, User user) {
        if (user.getRole() == UserRole.ADMIN) return;
        if (!isReporter(ticket, user)) {
            throw new AccessDeniedException("You are not the owner of this ticket");
        }
    }

    private List<String> saveImages(MultipartFile[] images, Ticket ticket) {
        List<String> paths = new ArrayList<>();
        if (images == null) return paths;
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            for (MultipartFile image : images) {
                if (image == null || image.isEmpty()) continue;

                // Validate file size (max 5 MB)
                if (image.getSize() > 5 * 1024 * 1024) {
                    throw new BadRequestException(
                        "File '" + image.getOriginalFilename() + "' exceeds the 5 MB size limit");
                }

                String originalName = StringUtils.cleanPath(image.getOriginalFilename() != null
                        ? image.getOriginalFilename() : "file");
                String extension = "";
                int dotIdx = originalName.lastIndexOf('.');
                if (dotIdx >= 0) extension = originalName.substring(dotIdx);

                // Validate image extension
                if (!extension.toLowerCase().matches("\\.(jpg|jpeg|png|gif|webp)")) {
                    throw new BadRequestException(
                        "File '" + originalName + "' is not allowed. Only jpg, jpeg, png, gif, webp images are accepted");
                }

                // Validate MIME type reported by the client
                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new BadRequestException(
                        "File '" + originalName + "' does not appear to be an image (content-type: " + contentType + ")");
                }

                String storedName = UUID.randomUUID() + extension;
                Path filePath = uploadPath.resolve(storedName);
                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                paths.add(storedName);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage(), e);
        }
        return paths;
    }

    private void deleteFile(String filename) {
        try {
            Path path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // Log but don't fail
        }
    }

    // ===================== MAPPING =====================

    public TicketResponseDTO toResponseDTO(Ticket ticket) {
        List<TicketResponseDTO.CommentDTO> commentDTOs = ticket.getComments().stream()
                .map(c -> TicketResponseDTO.CommentDTO.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .authorId(c.getAuthor().getId())
                        .authorUsername(c.getAuthor().getUsername())
                        .authorFullName(c.getAuthor().getFullName())
                        .edited(c.isEdited())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return TicketResponseDTO.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .location(ticket.getLocation())
                .resourceId(ticket.getResource() != null ? ticket.getResource().getId() : null)
                .resourceName(ticket.getResource() != null ? ticket.getResource().getName() : null)
                .reporterId(ticket.getReporter().getId())
                .reporterUsername(ticket.getReporter().getUsername())
                .reporterFullName(ticket.getReporter().getFullName())
                .technicianId(ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getId() : null)
                .technicianUsername(ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getUsername() : null)
                .technicianFullName(ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getFullName() : null)
                .contactName(ticket.getContactName())
                .contactEmail(ticket.getContactEmail())
                .contactPhone(ticket.getContactPhone())
                .imagePaths(ticket.getImagePaths())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .comments(commentDTOs)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}

