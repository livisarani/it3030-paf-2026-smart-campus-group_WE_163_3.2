package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StatusUpdateRequestDTO {

    @NotNull(message = "Status is required. Valid values: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED")
    private TicketStatus status;

    // Optional resolution notes (used when setting RESOLVED)
    @Size(max = 2000, message = "Resolution notes must not exceed 2000 characters")
    private String resolutionNotes;
}
