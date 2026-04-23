package com.Campus_Hub.Smart_Campus_Operations_Hub.repository;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Notification;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientAndReadFalseOrderByCreatedAtDesc(User recipient);
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
}

