package com.Campus_Hub.Smart_Campus_Operations_Hub.repository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Ticket;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketOrderByTimestampAsc(Ticket ticket);
}
