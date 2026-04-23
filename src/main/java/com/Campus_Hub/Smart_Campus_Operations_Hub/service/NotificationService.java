package com.Campus_Hub.Smart_Campus_Operations_Hub.service;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Notification;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(User recipient, String message, Long relatedTicketId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .relatedTicketId(relatedTicketId)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(User recipient) {
        return notificationRepository.findByRecipientAndReadFalseOrderByCreatedAtDesc(recipient);
    }

    @Transactional(readOnly = true)
    public List<Notification> getAllNotifications(User recipient) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.Campus_Hub.Smart_Campus_Operations_Hub.exception.ResourceNotFoundException("Notification", "id", notificationId));
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Cannot mark another user's notification");
        }
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User recipient) {
        List<Notification> unread = notificationRepository.findByRecipientAndReadFalseOrderByCreatedAtDesc(recipient);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}

