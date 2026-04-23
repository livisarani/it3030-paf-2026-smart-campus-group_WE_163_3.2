package com.smartcampus.service;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /** Send a notification to a specific user (called internally by other services). */
    void sendNotification(Long userId, NotificationType type, String title, String message,
                          Long referenceId, String referenceUrl);

    /** Get paginated notifications for the current user. */
    Page<NotificationResponse> getNotifications(Long userId, Boolean unreadOnly, Pageable pageable);

    /** Count unread notifications for the current user. */
    long countUnread(Long userId);

    /** Mark a single notification as read. */
    void markRead(Long notificationId, Long userId);

    /** Mark ALL notifications for a user as read. */
    void markAllRead(Long userId);

    /** Delete all read notifications for a user. */
    void deleteReadNotifications(Long userId);
}
