package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDTO {
    private Long id;
    private String message;
    private Long recipientId;
    private String recipientUsername;
    private boolean read;
    private Long relatedTicketId;
    private LocalDateTime createdAt;
}

