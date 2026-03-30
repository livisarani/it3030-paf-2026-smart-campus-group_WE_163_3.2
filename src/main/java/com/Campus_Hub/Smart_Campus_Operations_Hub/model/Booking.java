package com.Campus_Hub.Smart_Campus_Operations_Hub.model;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "user_name")
    private String userName;
    
    @Column(name = "user_email")
    private String userEmail;
    
    @Column(name = "resource_id", nullable = false)
    private Long resourceId;
    
    @Column(name = "resource_name")
    private String resourceName;
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    @Column(nullable = false)
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private String purpose;
    
    private Integer expectedAttendees;
    
    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.PENDING;
    
    private String rejectionReason;
    
    private String approvalReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}