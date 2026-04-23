package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequestDTO {

    @NotBlank(message = "Comment content cannot be empty")
    @Size(min = 1, max = 2000, message = "Comment must be between 1 and 2000 characters")
    private String content;
}
