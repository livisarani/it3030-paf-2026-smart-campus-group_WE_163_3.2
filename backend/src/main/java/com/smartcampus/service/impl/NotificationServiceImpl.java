package com.smartcampus.service.impl;

import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.entity.Notification;
import com.smartcampus.entity.User;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Async
    @Transactional
    public void sendNotification(Long userId, NotificationType type, String title,
                                 String message, Long referenceId, String referenceUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .referenceUrl(referenceUrl)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.debug("Notification [{}] sent to user id={}", type, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Boolean unreadOnly, Pageable pageable) {
        Page<Notification> page = (unreadOnly != null && unreadOnly)
                ? notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    @Override
    @Transactional
    public void markRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markReadById(notificationId, userId);
        if (updated == 0) {
            throw new ResourceNotFoundException("Notification not found or not owned by user");
        }
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        int count = notificationRepository.markAllReadByUserId(userId);
        log.debug("Marked {} notifications as read for user id={}", count, userId);
    }

    @Override
    @Transactional
    public void deleteReadNotifications(Long userId) {
        int count = notificationRepository.deleteReadByUserId(userId);
        log.debug("Deleted {} read notifications for user id={}", count, userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceUrl(n.getReferenceUrl())
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
