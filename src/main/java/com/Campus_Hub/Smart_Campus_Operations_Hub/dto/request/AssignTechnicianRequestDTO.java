package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignTechnicianRequestDTO {

    @NotNull(message = "Technician ID is required")
    private Long technicianId;
}

