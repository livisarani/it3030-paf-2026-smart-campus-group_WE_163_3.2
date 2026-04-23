package com.Campus_Hub.Smart_Campus_Operations_Hub;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.CommentRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.TicketRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.TicketResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.BadRequestException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Comment;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Ticket;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketCategory;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketPriority;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.TicketStatus;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.UserRole;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.ResourceRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.TicketRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.UserRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.NotificationService;
import com.Campus_Hub.Smart_Campus_Operations_Hub.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TicketService Unit Tests")
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ResourceRepository resourceRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TicketService ticketService;

    private User student, admin, technician;
    private Ticket ticket;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(ticketService, "uploadDir", "./uploads/test-tickets");

        student = User.builder().id(1L).username("student1").fullName("Student One")
                .role(UserRole.STUDENT).email("s@test.com").password("pass").build();
        admin = User.builder().id(2L).username("admin1").fullName("Admin One")
                .role(UserRole.ADMIN).email("a@test.com").password("pass").build();
        technician = User.builder().id(3L).username("tech1").fullName("Tech One")
                .role(UserRole.TECHNICIAN).email("t@test.com").password("pass").build();

        ticket = Ticket.builder()
                .id(1L)
                .title("Broken Projector")
                .description("The projector in room 101 is not working")
                .category(TicketCategory.IT_EQUIPMENT)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .location("Room 101, Building A")
                .reporter(student)
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();
    }

    // =========================================================
    // CREATE TICKET
    // =========================================================

    @Test
    @DisplayName("Should create ticket successfully with valid input")
    void createTicket_ValidInput_ReturnsDTO() {
        TicketRequestDTO dto = new TicketRequestDTO();
        dto.setTitle("Broken Projector");
        dto.setDescription("Not working");
        dto.setCategory(TicketCategory.IT_EQUIPMENT);
        dto.setPriority(TicketPriority.HIGH);
        dto.setLocation("Room 101");

        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);

        TicketResponseDTO result = ticketService.createTicket(dto, null, student);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Broken Projector");
        assertThat(result.getStatus()).isEqualTo(TicketStatus.OPEN);
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when more than 3 images provided")
    void createTicket_MoreThan3Images_ThrowsBadRequest() {
        TicketRequestDTO dto = new TicketRequestDTO();
        dto.setTitle("Test"); dto.setDescription("Test");
        dto.setCategory(TicketCategory.ELECTRICAL);
        dto.setPriority(TicketPriority.LOW); dto.setLocation("Building B");

        org.springframework.web.multipart.MultipartFile[] images =
                new org.springframework.web.multipart.MultipartFile[4];

        assertThatThrownBy(() -> ticketService.createTicket(dto, images, student))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("maximum of 3");
    }

    // =========================================================
    // GET ALL TICKETS (role-based)
    // =========================================================

    @Test
    @DisplayName("Admin should see all tickets")
    void getAllTickets_Admin_ReturnsAll() {
        when(ticketRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(ticket));

        List<TicketResponseDTO> result = ticketService.getAllTickets(admin);

        assertThat(result).hasSize(1);
        verify(ticketRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    @DisplayName("Student should only see own tickets")
    void getAllTickets_Student_ReturnsOnlyOwn() {
        when(ticketRepository.findByReporterOrderByCreatedAtDesc(student)).thenReturn(List.of(ticket));

        List<TicketResponseDTO> result = ticketService.getAllTickets(student);

        assertThat(result).hasSize(1);
        verify(ticketRepository).findByReporterOrderByCreatedAtDesc(student);
    }

    @Test
    @DisplayName("Technician should only see assigned tickets")
    void getAllTickets_Technician_ReturnsAssigned() {
        Ticket assignedTicket = Ticket.builder().id(2L).title("Assigned").description("Desc")
                .category(TicketCategory.ELECTRICAL).priority(TicketPriority.MEDIUM)
                .status(TicketStatus.IN_PROGRESS).location("Lab 3")
                .reporter(student).assignedTechnician(technician)
                .imagePaths(new ArrayList<>()).comments(new ArrayList<>()).build();

        when(ticketRepository.findByAssignedTechnicianOrderByCreatedAtDesc(technician))
                .thenReturn(List.of(assignedTicket));

        List<TicketResponseDTO> result = ticketService.getAllTickets(technician);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTechnicianUsername()).isEqualTo("tech1");
    }

    // =========================================================
    // STATUS TRANSITIONS
    // =========================================================

    @Test
    @DisplayName("Admin can change ticket status freely")
    void changeStatus_Admin_CanTransitionAnyStatus() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        TicketResponseDTO result = ticketService.changeStatus(1L, TicketStatus.IN_PROGRESS, null, admin);

        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("Student can close a RESOLVED ticket")
    void changeStatus_StudentCanCloseResolvedTicket() {
        ticket.setStatus(TicketStatus.RESOLVED);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        ticketService.changeStatus(1L, TicketStatus.CLOSED, null, student);

        verify(ticketRepository).save(any());
    }

    @Test
    @DisplayName("Student cannot change status of OPEN ticket")
    void changeStatus_StudentCannotChangeOpenTicket() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.changeStatus(1L, TicketStatus.IN_PROGRESS, null, student))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Technician can mark assigned ticket as RESOLVED")
    void changeStatus_AssignedTechnicianCanResolve() {
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setAssignedTechnician(technician);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        ticketService.changeStatus(1L, TicketStatus.RESOLVED, "Fixed the projector lamp", technician);

        verify(ticketRepository).save(any());
    }

    @Test
    @DisplayName("Unassigned technician cannot change ticket status")
    void changeStatus_UnassignedTechnician_ThrowsAccessDenied() {
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        // No technician assigned
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.changeStatus(1L, TicketStatus.RESOLVED, null, technician))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================
    // ASSIGN TECHNICIAN
    // =========================================================

    @Test
    @DisplayName("Admin can assign a technician to a ticket")
    void assignTechnician_Admin_Succeeds() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(3L)).thenReturn(Optional.of(technician));
        when(ticketRepository.save(any())).thenReturn(ticket);

        ticketService.assignTechnician(1L, 3L, admin);

        verify(ticketRepository).save(any());
        verify(notificationService).createNotification(eq(technician), anyString(), eq(1L));
    }

    @Test
    @DisplayName("Non-admin cannot assign technician")
    void assignTechnician_NonAdmin_ThrowsAccessDenied() {
        assertThatThrownBy(() -> ticketService.assignTechnician(1L, 3L, student))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Admin cannot assign a non-technician user")
    void assignTechnician_NonTechnicianUser_ThrowsBadRequest() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student)); // student, not technician

        assertThatThrownBy(() -> ticketService.assignTechnician(1L, 1L, admin))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not a technician");
    }

    // =========================================================
    // REJECT TICKET
    // =========================================================

    @Test
    @DisplayName("Admin can reject ticket with reason")
    void rejectTicket_Admin_WithReason_Succeeds() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        ticketService.rejectTicket(1L, "Duplicate ticket", admin);

        verify(ticketRepository).save(any());
        verify(notificationService).createNotification(eq(student), anyString(), eq(1L));
    }

    @Test
    @DisplayName("Admin cannot reject ticket without reason")
    void rejectTicket_NoReason_ThrowsBadRequest() {
        // Service validates reason BEFORE calling findById, so no stub needed
        assertThatThrownBy(() -> ticketService.rejectTicket(1L, "", admin))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("reason");
    }

    @Test
    @DisplayName("Non-admin cannot reject ticket")
    void rejectTicket_NonAdmin_ThrowsAccessDenied() {
        assertThatThrownBy(() -> ticketService.rejectTicket(1L, "Reason", student))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================
    // COMMENTS
    // =========================================================

    @Test
    @DisplayName("Any user with access can add a comment")
    void addComment_ValidUser_AddsComment() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setContent("This is still not working after a week.");

        ticketService.addComment(1L, dto, student);

        verify(ticketRepository).save(any());
    }

    @Test
    @DisplayName("User can edit their own comment")
    void updateComment_Author_CanEdit() {
        Comment comment = Comment.builder().id(10L).content("Old content")
                .author(student).ticket(ticket).build();
        ticket.getComments().add(comment);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setContent("Updated content");

        ticketService.updateComment(1L, 10L, dto, student);

        assertThat(comment.getContent()).isEqualTo("Updated content");
        assertThat(comment.isEdited()).isTrue();
    }

    @Test
    @DisplayName("User cannot edit another user's comment")
    void updateComment_NotAuthor_ThrowsAccessDenied() {
        Comment comment = Comment.builder().id(10L).content("Content")
                .author(admin).ticket(ticket).build();
        ticket.getComments().add(comment);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        CommentRequestDTO dto = new CommentRequestDTO();
        dto.setContent("Trying to edit");

        assertThatThrownBy(() -> ticketService.updateComment(1L, 10L, dto, student))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Author can delete their own comment")
    void deleteComment_Author_CanDelete() {
        Comment comment = Comment.builder().id(10L).content("Content")
                .author(student).ticket(ticket).build();
        ticket.getComments().add(comment);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        ticketService.deleteComment(1L, 10L, student);

        assertThat(ticket.getComments()).isEmpty();
    }

    @Test
    @DisplayName("Admin can delete any comment")
    void deleteComment_Admin_CanDeleteAnyComment() {
        Comment comment = Comment.builder().id(10L).content("Content")
                .author(student).ticket(ticket).build();
        ticket.getComments().add(comment);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any())).thenReturn(ticket);

        ticketService.deleteComment(1L, 10L, admin);

        assertThat(ticket.getComments()).isEmpty();
    }

    @Test
    @DisplayName("User cannot delete another user's comment")
    void deleteComment_NotAuthorNorAdmin_ThrowsAccessDenied() {
        Comment comment = Comment.builder().id(10L).content("Content")
                .author(admin).ticket(ticket).build();
        ticket.getComments().add(comment);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.deleteComment(1L, 10L, technician))
                .isInstanceOf(AccessDeniedException.class);
    }

    // =========================================================
    // DELETE TICKET
    // =========================================================

    @Test
    @DisplayName("Reporter can delete their own OPEN ticket")
    void deleteTicket_Reporter_Succeeds() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        ticketService.deleteTicket(1L, student);

        verify(ticketRepository).delete(ticket);
    }

    @Test
    @DisplayName("Non-owner non-admin cannot delete ticket")
    void deleteTicket_UnrelatedUser_ThrowsAccessDenied() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.deleteTicket(1L, technician))
                .isInstanceOf(AccessDeniedException.class);
    }
}


