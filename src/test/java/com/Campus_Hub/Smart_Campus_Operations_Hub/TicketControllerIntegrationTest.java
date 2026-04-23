package com.Campus_Hub.Smart_Campus_Operations_Hub;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.UserRole;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.UserRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Ticket REST API (Member 3).
 * Uses H2 in-memory DB — see src/test/resources/application.properties.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Ticket REST API Integration Tests")
class TicketControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private ObjectMapper objectMapper;

    private String studentToken;
    private String adminToken;
    private String technicianToken;
    private User student;
    private User admin;
    private User technician;

    @BeforeEach
    void setUp() {
        student = userRepository.save(User.builder()
                .username("int_student").email("int_student@test.com")
                .password(passwordEncoder.encode("pass")).fullName("Int Student")
                .role(UserRole.STUDENT).build());

        admin = userRepository.save(User.builder()
                .username("int_admin").email("int_admin@test.com")
                .password(passwordEncoder.encode("pass")).fullName("Int Admin")
                .role(UserRole.ADMIN).build());

        technician = userRepository.save(User.builder()
                .username("int_tech").email("int_tech@test.com")
                .password(passwordEncoder.encode("pass")).fullName("Int Tech")
                .role(UserRole.TECHNICIAN).build());

        studentToken   = "Bearer " + jwtTokenProvider.generateTokenFromUsername(student.getUsername());
        adminToken     = "Bearer " + jwtTokenProvider.generateTokenFromUsername(admin.getUsername());
        technicianToken = "Bearer " + jwtTokenProvider.generateTokenFromUsername(technician.getUsername());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/tickets  — create ticket
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/tickets — student can create a ticket")
    void createTicket_Student_Returns201() throws Exception {
        String ticketJson = objectMapper.writeValueAsString(Map.of(
                "title", "Broken Projector in Room 101",
                "description", "The projector is completely dead",
                "category", "IT_EQUIPMENT",
                "priority", "HIGH",
                "location", "Room 101, Block A",
                "contactName", "Int Student",
                "contactEmail", "int_student@test.com"
        ));

        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket", "", MediaType.APPLICATION_JSON_VALUE, ticketJson.getBytes());

        mockMvc.perform(multipart("/api/tickets")
                        .file(ticketPart)
                        .header("Authorization", studentToken)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Broken Projector in Room 101"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.reporterUsername").value("int_student"));
    }

    @Test
    @DisplayName("POST /api/tickets — unauthenticated request returns 401")
    void createTicket_Unauthenticated_Returns401() throws Exception {
        String ticketJson = objectMapper.writeValueAsString(Map.of(
                "title", "Test", "description", "Desc",
                "category", "ELECTRICAL", "priority", "LOW", "location", "Building B"
        ));
        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket", "", MediaType.APPLICATION_JSON_VALUE, ticketJson.getBytes());

        mockMvc.perform(multipart("/api/tickets")
                        .file(ticketPart)
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/tickets  — list tickets
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/tickets — authenticated user gets their own tickets")
    void getTickets_AuthenticatedStudent_ReturnsOwnTickets() throws Exception {
        // First create a ticket
        String ticketJson = objectMapper.writeValueAsString(Map.of(
                "title", "Leak in Lab 3", "description", "Water leaking from ceiling",
                "category", "PLUMBING", "priority", "CRITICAL", "location", "Lab 3"
        ));
        MockMultipartFile ticketPart = new MockMultipartFile(
                "ticket", "", MediaType.APPLICATION_JSON_VALUE, ticketJson.getBytes());
        mockMvc.perform(multipart("/api/tickets")
                .file(ticketPart).header("Authorization", studentToken)
                .contentType(MediaType.MULTIPART_FORM_DATA));

        mockMvc.perform(get("/api/tickets")
                        .header("Authorization", studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    @DisplayName("GET /api/tickets — admin sees all tickets")
    void getTickets_Admin_ReturnsAll() throws Exception {
        mockMvc.perform(get("/api/tickets")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/tickets/{id}  — get by ID
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/tickets/{id} — returns 404 for non-existent ticket")
    void getTicketById_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/tickets/99999")
                        .header("Authorization", adminToken))
                .andExpect(status().isNotFound());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/tickets/{id}/assign  — assign technician
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("PATCH /api/tickets/{id}/assign — non-admin returns 403")
    void assignTechnician_NonAdmin_Returns403() throws Exception {
        mockMvc.perform(patch("/api/tickets/1/assign")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"technicianId\":1}"))
                .andExpect(status().is4xxClientError());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/tickets/{id}  — delete ticket
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/tickets/{id} — returns 404 for non-existent ticket")
    void deleteTicket_NotFound_Returns404() throws Exception {
        mockMvc.perform(delete("/api/tickets/99999")
                        .header("Authorization", adminToken))
                .andExpect(status().isNotFound());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/tickets/{id}/comments  — add comment
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/tickets/{id}/comments — returns 404 for non-existent ticket")
    void addComment_TicketNotFound_Returns404() throws Exception {
        mockMvc.perform(post("/api/tickets/99999/comments")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Test comment\"}"))
                .andExpect(status().isNotFound());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login  — authentication
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — valid credentials return JWT token")
    void login_ValidCredentials_ReturnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"int_student\",\"password\":\"pass\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    @DisplayName("POST /api/auth/login — invalid credentials return 401")
    void login_InvalidCredentials_Returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"int_student\",\"password\":\"wrongpass\"}"))
                .andExpect(status().isUnauthorized());
    }
}

