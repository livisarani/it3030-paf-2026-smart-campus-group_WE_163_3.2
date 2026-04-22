package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Builder
public class TicketHistoryResponseDTO {
    private Long id;
    private String event;
    private String description;
    private String actorUsername;
    private String actorFullName;
    private LocalDateTime timestamp;
}
