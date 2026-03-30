package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingResponseDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long resourceId;
    private String resourceName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer expectedAttendees;
    private BookingStatus status;
    private String rejectionReason;
    private String approvalReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}