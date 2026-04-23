package com.smartcampus.dto.request;

import com.smartcampus.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class RoleUpdateRequest {
    @NotNull(message = "Roles must not be null")
    private Set<Role> roles;
}
