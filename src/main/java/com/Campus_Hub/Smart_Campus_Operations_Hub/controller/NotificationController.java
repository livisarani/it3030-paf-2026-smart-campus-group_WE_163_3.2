package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Notification;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.UserRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private User resolveUser(UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new com.Campus_Hub.Smart_Campus_Operations_Hub.exception.ResourceNotFoundException("User", "username", principal.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(resolveUser(principal)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getAllNotifications(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getAllNotifications(resolveUser(principal)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.markAsRead(id, resolveUser(principal)));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal UserDetails principal) {
        notificationService.markAllAsRead(resolveUser(principal));
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}

