package com.smartcampus.controller;

import com.smartcampus.dto.request.RoleUpdateRequest;
import com.smartcampus.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Module E – Role Management (ADMIN only)
 * Member 4 endpoints
 *
 * GET   /api/v1/admin/users                 – list all users with roles (paginated)
 * GET   /api/v1/admin/users/{id}/roles      – get roles of a specific user
 * PUT   /api/v1/admin/users/{id}/roles      – replace roles for a user
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /** GET /api/v1/admin/users */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(roleService.getAllUsersWithRoles(page, size));
    }

    /** GET /api/v1/admin/users/{id}/roles */
    @GetMapping("/{id}/roles")
    public ResponseEntity<Map<String, Object>> getUserRoles(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.getUserWithRoles(id));
    }

    /** PUT /api/v1/admin/users/{id}/roles */
    @PutMapping("/{id}/roles")
    public ResponseEntity<Map<String, Object>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request) {

        return ResponseEntity.ok(roleService.updateUserRoles(id, request.getRoles()));
    }
}
