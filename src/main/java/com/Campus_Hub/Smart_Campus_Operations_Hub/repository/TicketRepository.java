package com.Campus_Hub.Smart_Campus_Operations_Hub.repository;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Ticket;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByReporter(User reporter);

    List<Ticket> findByAssignedTechnician(User technician);

    List<Ticket> findByStatus(TicketStatus status);

    List<Ticket> findByReporterOrderByCreatedAtDesc(User reporter);

    List<Ticket> findByAssignedTechnicianOrderByCreatedAtDesc(User technician);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Ticket t WHERE t.reporter = :user OR t.assignedTechnician = :user ORDER BY t.createdAt DESC")
    List<Ticket> findByReporterOrAssignedTechnician(@Param("user") User user);

    List<Ticket> findByCategoryAndStatus(
            com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketCategory category,
            TicketStatus status);
}

