package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketCategory;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketPriority;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TicketRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 5000, message = "Description must be between 10 and 5000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @NotBlank(message = "Location is required")
    @Size(min = 3, max = 300, message = "Location must be between 3 and 300 characters")
    private String location;

    // Optional resource reference
    @Positive(message = "Resource ID must be a positive number")
    private Long resourceId;

    // Contact details (all optional but validated when provided)
    @Size(min = 2, max = 100, message = "Contact name must be between 2 and 100 characters")
    private String contactName;

    @Email(message = "Contact email must be a valid email address")
    @Size(max = 100, message = "Contact email must not exceed 100 characters")
    private String contactEmail;

    @Pattern(
        regexp = "^[+\\d\\s\\-()\\ ]{7,20}$|^$",
        message = "Contact phone must be 7–20 characters and contain only digits, spaces, +, -, (, )"
    )
    private String contactPhone;
}

