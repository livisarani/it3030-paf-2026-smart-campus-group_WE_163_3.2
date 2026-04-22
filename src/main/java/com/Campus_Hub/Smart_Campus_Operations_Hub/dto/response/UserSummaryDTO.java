package com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight user summary used by the frontend to populate
 * dropdowns (e.g. assign-technician selector).
 * Field names match what the React components expect (id, username, fullName, role).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private Long   id;
    private String username;
    private String fullName;
    private String email;
    private String role;
    private String phone;
}

