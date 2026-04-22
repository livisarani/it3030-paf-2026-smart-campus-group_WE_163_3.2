package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketCategory;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketPriority;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TicketResponseDTO {
    private Long id;
    private String title;
    private String description;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private String location;
    private Long resourceId;
    private String resourceName;

    // Reporter info
    private Long reporterId;
    private String reporterUsername;
    private String reporterFullName;

    // Assigned technician info
    private Long technicianId;
    private String technicianUsername;
    private String technicianFullName;

    // Contact details
    private String contactName;
    private String contactEmail;
    private String contactPhone;

    // Image attachment URLs (served by /api/tickets/attachments/{filename})
    private List<String> imagePaths;

    private String rejectionReason;
    private String resolutionNotes;

    private List<CommentDTO> comments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class CommentDTO {
        private Long id;
        private String content;
        private Long authorId;
        private String authorUsername;
        private String authorFullName;
        private boolean edited;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}

