package com.Campus_Hub.Smart_Campus_Operations_Hub.model;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketCategory;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketPriority;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @NotBlank
    @Size(max = 300)
    @Column(nullable = false)
    private String location;

    // Optional link to a resource entity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    // Reporter / submitter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // Assigned technician (nullable until assigned)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User assignedTechnician;

    // Image attachment paths (max 3, enforced in service)
    @ElementCollection
    @CollectionTable(name = "ticket_attachments", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "image_path")
    @Builder.Default
    private List<String> imagePaths = new ArrayList<>();

    // Contact details of the submitter
    @Size(max = 100)
    private String contactName;

    @Email
    @Size(max = 100)
    private String contactEmail;

    @Size(max = 20)
    private String contactPhone;

    // Admin sets rejection reason when REJECTED
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    // Technician adds resolution notes
    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

