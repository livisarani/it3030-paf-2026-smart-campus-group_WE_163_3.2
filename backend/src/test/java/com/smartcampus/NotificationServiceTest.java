package com.smartcampus;

import com.smartcampus.entity.Notification;
import com.smartcampus.entity.User;
import com.smartcampus.enums.AuthProvider;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.Role;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private NotificationServiceImpl notificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L).email("user@test.com").name("Test User")
                .provider(AuthProvider.GOOGLE).roles(Set.of(Role.USER))
                .enabled(true).emailVerified(true).build();
    }

    @Test
    void sendNotification_validUser_savesNotification() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        notificationService.sendNotification(1L, NotificationType.BOOKING_APPROVED,
                "Booking Approved", "Your booking has been approved.", 5L, "/bookings/5");

        verify(notificationRepository).save(argThat(n ->
                n.getUser().equals(testUser)
                && n.getType() == NotificationType.BOOKING_APPROVED
                && !n.getIsRead()));
    }

    @Test
    void sendNotification_userNotFound_throwsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                notificationService.sendNotification(99L, NotificationType.BOOKING_REJECTED,
                        "Title", "Msg", null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void countUnread_returnsCorrectCount() {
        when(notificationRepository.countByUserIdAndIsRead(1L, false)).thenReturn(3L);

        long count = notificationService.countUnread(1L);

        assertThat(count).isEqualTo(3L);
    }

    @Test
    void markAllRead_callsRepository() {
        when(notificationRepository.markAllReadByUserId(1L)).thenReturn(5);

        notificationService.markAllRead(1L);

        verify(notificationRepository).markAllReadByUserId(1L);
    }

    @Test
    void markRead_notFound_throwsException() {
        when(notificationRepository.markReadById(99L, 1L)).thenReturn(0);

        assertThatThrownBy(() -> notificationService.markRead(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getNotifications_unreadOnly_filtersCorrectly() {
        var notification = Notification.builder()
                .id(1L).user(testUser)
                .type(NotificationType.TICKET_STATUS_CHANGED)
                .title("Ticket Updated").message("Status changed to IN_PROGRESS")
                .isRead(false).createdAt(LocalDateTime.now()).build();

        var page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(eq(1L), eq(false), any()))
                .thenReturn(page);

        var result = notificationService.getNotifications(1L, true, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getIsRead()).isFalse();
        assertThat(result.getContent().get(0).getType()).isEqualTo(NotificationType.TICKET_STATUS_CHANGED);
    }

    @Test
    void deleteReadNotifications_callsRepository() {
        when(notificationRepository.deleteReadByUserId(1L)).thenReturn(2);

        notificationService.deleteReadNotifications(1L);

        verify(notificationRepository).deleteReadByUserId(1L);
    }
}
