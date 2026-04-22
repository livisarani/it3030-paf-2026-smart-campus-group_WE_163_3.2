package com.Campus_Hub.Smart_Campus_Operations_Hub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    /**
     * Short event type, e.g. "TICKET_CREATED", "STATUS_CHANGED", "TECHNICIAN_ASSIGNED",
     * "TICKET_REJECTED", "COMMENT_ADDED", "COMMENT_UPDATED", "COMMENT_DELETED",
     * "ATTACHMENT_REMOVED", "TICKET_UPDATED"
     */
    @Column(nullable = false, length = 60)
    private String event;

    /** Human-readable description of what changed */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Who triggered this event (nullable for system events) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}

