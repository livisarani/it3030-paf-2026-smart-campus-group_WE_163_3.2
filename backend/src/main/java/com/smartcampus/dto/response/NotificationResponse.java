package com.smartcampus.dto.response;

import com.smartcampus.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private String referenceUrl;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
