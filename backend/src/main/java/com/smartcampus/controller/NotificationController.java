package com.smartcampus.controller;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Module D – Notification Management
 * Member 4 endpoints (Individual assessment)
 *
 * GET    /api/v1/notifications             – list notifications (paginated, optional ?unread=true)
 * GET    /api/v1/notifications/unread-count – count unread badge
 * PATCH  /api/v1/notifications/{id}/read   – mark one as read
 * PATCH  /api/v1/notifications/read-all    – mark all as read
 * DELETE /api/v1/notifications/read        – clear all read notifications
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** GET /api/v1/notifications */
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Boolean unread,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponse> result =
                notificationService.getNotifications(principal.getId(), unread, pageable);
        return ResponseEntity.ok(result);
    }

    /** GET /api/v1/notifications/unread-count */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {

        long count = notificationService.countUnread(principal.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /** PATCH /api/v1/notifications/{id}/read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        notificationService.markRead(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/v1/notifications/read-all */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {

        notificationService.markAllRead(principal.getId());
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/v1/notifications/read */
    @DeleteMapping("/read")
    public ResponseEntity<Void> deleteReadNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {

        notificationService.deleteReadNotifications(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
