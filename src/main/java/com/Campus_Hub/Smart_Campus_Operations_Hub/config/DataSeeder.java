package com.Campus_Hub.Smart_Campus_Operations_Hub.config;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.*;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.*;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * DataSeeder – runs once at startup and populates the DB with demo data.
 * Idempotent: skips seeding if users already exist.
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  LOGIN CREDENTIALS (password = password123)          ║
 * ╠══════════════════════╦═══════════╦══════════════════╣
 * ║ Username             ║ Role      ║ Full Name        ║
 * ╠══════════════════════╬═══════════╬══════════════════╣
 * ║ admin                ║ ADMIN     ║ Admin User       ║
 * ║ tech_john            ║ TECHNICIAN║ John Perera      ║
 * ║ tech_sarah           ║ TECHNICIAN║ Sarah Fernando   ║
 * ║ staff_smith          ║ STAFF     ║ Prof. D. Smith   ║
 * ║ staff_johnson        ║ STAFF     ║ Dr. A. Johnson   ║
 * ║ student_alice        ║ STUDENT   ║ Alice Mendis     ║
 * ║ student_bob          ║ STUDENT   ║ Bob Silva        ║
 * ║ student_charlie      ║ STUDENT   ║ Charlie Dias     ║
 * ╚══════════════════════╩═══════════╩══════════════════╝
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository         userRepository;
    private final ResourceRepository     resourceRepository;
    private final TicketRepository       ticketRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder        passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            log.info("DataSeeder: data already exists – skipping.");
            return;
        }

        log.info("DataSeeder: seeding demo data…");

        // ── 1. USERS ─────────────────────────────────────────────────────────
        String pwd = passwordEncoder.encode("password123");

        User admin       = save(user("admin",          "admin@campus.edu",          pwd, "Admin User",       UserRole.ADMIN,      "+94 77 000 0001"));
        User techJohn    = save(user("tech_john",      "john@campus.edu",           pwd, "John Perera",      UserRole.TECHNICIAN, "+94 77 000 0002"));
        User techSarah   = save(user("tech_sarah",     "sarah@campus.edu",          pwd, "Sarah Fernando",   UserRole.TECHNICIAN, "+94 77 000 0003"));
        User staffSmith  = save(user("staff_smith",    "smith@campus.edu",          pwd, "Prof. D. Smith",   UserRole.STAFF,      "+94 77 000 0004"));
        User staffJohnson= save(user("staff_johnson",  "johnson@campus.edu",        pwd, "Dr. A. Johnson",   UserRole.STAFF,      "+94 77 000 0005"));
        User alice       = save(user("student_alice",  "alice@campus.edu",          pwd, "Alice Mendis",     UserRole.STUDENT,    "+94 77 000 0006"));
        User bob         = save(user("student_bob",    "bob@campus.edu",            pwd, "Bob Silva",        UserRole.STUDENT,    "+94 77 000 0007"));
        User charlie     = save(user("student_charlie","charlie@campus.edu",        pwd, "Charlie Dias",     UserRole.STUDENT,    "+94 77 000 0008"));

        log.info("DataSeeder: {} users created.", userRepository.count());

        // ── 2. RESOURCES (Member 1) ───────────────────────────────────────────
        Resource projector101  = saveRes("Projector – Room 101",      "Block A, Room 101",   "Epson EB-X41 projector with HDMI/VGA ports",         "IT_EQUIPMENT", true);
        Resource confRoomB     = saveRes("Conference Room B",          "Block B, Level 2",    "12-seat conference room with AV system",             "ROOM",         true);
        Resource computerLab3  = saveRes("Computer Lab 3",             "Block C, Level 1",    "30 workstations with licensed software",             "LAB",          true);
        Resource physicsLab    = saveRes("Physics Laboratory",         "Block D, Level 3",    "Advanced physics experiments lab",                   "LAB",          true);
        Resource libraryHall   = saveRes("Main Library Reading Hall",  "Library Block",       "Silent reading hall, 80 seats",                      "LIBRARY",      true);
        Resource seminarHall   = saveRes("Seminar Hall A",             "Block A, Ground",     "150-seat seminar hall with stage and sound system",  "HALL",         false);
        Resource avEquipment   = saveRes("AV Equipment Set",           "Media Center",        "Portable mic, speaker and camera kit for events",    "EQUIPMENT",    true);
        Resource sportsHall    = saveRes("Indoor Sports Hall",         "Sports Block",        "Badminton/Basketball court with changing rooms",     "SPORTS",       true);
        Resource chemLab       = saveRes("Chemistry Laboratory",       "Block E, Level 2",    "Organic and inorganic chemistry lab",                "LAB",          true);
        Resource lecRoom205    = saveRes("Lecture Room 205",           "Block B, Level 2",    "60-seat lecture room with smartboard",               "ROOM",         true);

        log.info("DataSeeder: {} resources created.", resourceRepository.count());

        // ── 3. TICKETS (Member 3) ─────────────────────────────────────────────
        // --- OPEN tickets ---
        Ticket t1 = ticketRepository.save(Ticket.builder()
                .title("Projector not displaying in Room 101")
                .description("The Epson projector in Room 101 shows a blue screen when connected via HDMI. It worked fine last week. Issue started Monday morning before the 8am lecture.")
                .category(TicketCategory.IT_EQUIPMENT)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .location("Block A, Room 101")
                .resource(projector101)
                .reporter(alice)
                .contactName("Alice Mendis")
                .contactEmail("alice@campus.edu")
                .contactPhone("+94 77 000 0006")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t2 = ticketRepository.save(Ticket.builder()
                .title("Water leak in Chemistry Lab ceiling")
                .description("There is a steady water drip from the ceiling near the fume hood in Chem Lab. Water is pooling on the workbench. Risk of electrical hazard if it reaches the power sockets.")
                .category(TicketCategory.PLUMBING)
                .priority(TicketPriority.CRITICAL)
                .status(TicketStatus.OPEN)
                .location("Block E, Level 2 – Chemistry Lab")
                .resource(chemLab)
                .reporter(staffSmith)
                .contactName("Prof. D. Smith")
                .contactEmail("smith@campus.edu")
                .contactPhone("+94 77 000 0004")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t3 = ticketRepository.save(Ticket.builder()
                .title("Air conditioning not working in Computer Lab 3")
                .description("The AC unit in Computer Lab 3 has been off since yesterday. Room temperature is reaching 34°C which is causing the workstations to overheat and shut down.")
                .category(TicketCategory.HVAC)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .location("Block C, Level 1 – Computer Lab 3")
                .resource(computerLab3)
                .reporter(bob)
                .contactName("Bob Silva")
                .contactEmail("bob@campus.edu")
                .contactPhone("+94 77 000 0007")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t4 = ticketRepository.save(Ticket.builder()
                .title("Broken chairs in Lecture Room 205")
                .description("Three chairs in the front row of Lecture Room 205 have broken legs. Students have been injured trying to sit on them. They need to be removed or replaced immediately.")
                .category(TicketCategory.FURNITURE)
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .location("Block B, Level 2 – Lecture Room 205")
                .resource(lecRoom205)
                .reporter(charlie)
                .contactName("Charlie Dias")
                .contactEmail("charlie@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        // --- IN_PROGRESS tickets (assigned to technicians) ---
        Ticket t5 = ticketRepository.save(Ticket.builder()
                .title("Network outage in Block B – all floors")
                .description("Complete network outage on all floors of Block B since 9am. Both wired and WiFi are affected. Around 200 students and 15 staff members cannot access online resources. Exams are being disrupted.")
                .category(TicketCategory.NETWORK)
                .priority(TicketPriority.CRITICAL)
                .status(TicketStatus.IN_PROGRESS)
                .location("Block B – All Floors")
                .reporter(staffJohnson)
                .assignedTechnician(techJohn)
                .contactName("Dr. A. Johnson")
                .contactEmail("johnson@campus.edu")
                .contactPhone("+94 77 000 0005")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t6 = ticketRepository.save(Ticket.builder()
                .title("Electrical fault – sparking socket in Seminar Hall A")
                .description("A wall socket near the podium in Seminar Hall A is sparking when plugged in. There is a faint burning smell. The hall has been locked for safety. An event is scheduled for tomorrow.")
                .category(TicketCategory.ELECTRICAL)
                .priority(TicketPriority.CRITICAL)
                .status(TicketStatus.IN_PROGRESS)
                .location("Block A, Ground – Seminar Hall A")
                .resource(seminarHall)
                .reporter(admin)
                .assignedTechnician(techSarah)
                .contactName("Admin User")
                .contactEmail("admin@campus.edu")
                .contactPhone("+94 77 000 0001")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t7 = ticketRepository.save(Ticket.builder()
                .title("Whiteboard markers and eraser missing – Room 101")
                .description("The whiteboard in Room 101 has had no markers or eraser for 3 days. Lecturers are unable to write on the board during classes.")
                .category(TicketCategory.OTHER)
                .priority(TicketPriority.LOW)
                .status(TicketStatus.IN_PROGRESS)
                .location("Block A, Room 101")
                .resource(projector101)
                .reporter(alice)
                .assignedTechnician(techJohn)
                .contactName("Alice Mendis")
                .contactEmail("alice@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        // --- RESOLVED tickets ---
        Ticket t8 = ticketRepository.save(Ticket.builder()
                .title("Library hall cleaning required – food waste found")
                .description("Students have been leaving food and drink waste in the library reading hall. The area around seats 40–60 is particularly dirty. This is a health concern.")
                .category(TicketCategory.CLEANING)
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.RESOLVED)
                .location("Library Block – Main Reading Hall")
                .resource(libraryHall)
                .reporter(bob)
                .assignedTechnician(techSarah)
                .resolutionNotes("Cleaning crew dispatched and completed a deep clean of the library hall on 24 March. Signage has been placed reminding students of the no-food policy. Security has been briefed to enforce the rule.")
                .contactName("Bob Silva")
                .contactEmail("bob@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t9 = ticketRepository.save(Ticket.builder()
                .title("Faulty light fittings in Physics Lab – flickering")
                .description("Three fluorescent light fittings in the Physics Lab are flickering badly. This is causing eye strain and the strobe effect is a safety hazard during lab sessions.")
                .category(TicketCategory.ELECTRICAL)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.RESOLVED)
                .location("Block D, Level 3 – Physics Lab")
                .resource(physicsLab)
                .reporter(staffSmith)
                .assignedTechnician(techJohn)
                .resolutionNotes("All three faulty fluorescent tube fittings replaced with new LED panels on 25 March. New fittings tested and confirmed operational. No further flickering observed.")
                .contactName("Prof. D. Smith")
                .contactEmail("smith@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        // --- CLOSED tickets ---
        Ticket t10 = ticketRepository.save(Ticket.builder()
                .title("Broken door lock on Conference Room B")
                .description("The lock on Conference Room B is jammed and the door cannot be locked from the outside. Valuable AV equipment inside is at risk.")
                .category(TicketCategory.SAFETY)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.CLOSED)
                .location("Block B, Level 2 – Conference Room B")
                .resource(confRoomB)
                .reporter(staffJohnson)
                .assignedTechnician(techSarah)
                .resolutionNotes("Lock mechanism replaced with a new digital lock. Two key-cards issued to departmental heads. Issue fully resolved on 22 March.")
                .contactName("Dr. A. Johnson")
                .contactEmail("johnson@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        Ticket t11 = ticketRepository.save(Ticket.builder()
                .title("Computer Lab 3 – 5 PCs not booting")
                .description("Workstations 12, 15, 18, 22, 27 in Computer Lab 3 fail to boot. They show a black screen with no BIOS. This reduces lab capacity significantly.")
                .category(TicketCategory.IT_EQUIPMENT)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.CLOSED)
                .location("Block C, Level 1 – Computer Lab 3")
                .resource(computerLab3)
                .reporter(charlie)
                .assignedTechnician(techJohn)
                .resolutionNotes("Power supply units on all 5 workstations were faulty. Replaced PSUs and RAM on machines 18 and 22. All 5 workstations now boot correctly. Tested by lab assistant.")
                .contactName("Charlie Dias")
                .contactEmail("charlie@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        // --- REJECTED ticket ---
        Ticket t12 = ticketRepository.save(Ticket.builder()
                .title("Request for extra chairs in Seminar Hall")
                .description("We need 20 extra chairs for a guest lecture event next Friday. Please arrange them in the seminar hall.")
                .category(TicketCategory.FURNITURE)
                .priority(TicketPriority.LOW)
                .status(TicketStatus.REJECTED)
                .location("Block A, Ground – Seminar Hall A")
                .resource(seminarHall)
                .reporter(alice)
                .rejectionReason("This is a resource request, not an incident. Please use the Resource Booking system to request additional equipment for events. Incident tickets are for maintenance and safety issues only.")
                .contactName("Alice Mendis")
                .contactEmail("alice@campus.edu")
                .imagePaths(new ArrayList<>())
                .comments(new ArrayList<>())
                .build());

        log.info("DataSeeder: {} tickets created.", ticketRepository.count());

        // ── 4. COMMENTS on tickets ────────────────────────────────────────────
        addComment(t1, admin,    "We have logged this issue. A technician will inspect the projector by end of day.");
        addComment(t1, alice,    "Thank you. Our 10am lecture is also affected – is there a replacement projector available?");
        addComment(t1, admin,    "A portable projector from the Media Center has been arranged as a temporary replacement.");

        addComment(t2, admin,    "URGENT: Maintenance team notified immediately. Do not use the lab until further notice.");
        addComment(t2, staffSmith, "Understood. I've locked the lab and redirected the class to Lab 2.");
        addComment(t2, techSarah, "Inspected the area – the pipe joint above the ceiling panel is cracked. Parts ordered, repair scheduled for tomorrow morning.");

        addComment(t5, techJohn,  "Traced the fault to the main switch in Block B basement. The VLAN configuration is corrupted. Working on restoring from backup.");
        addComment(t5, staffJohnson, "Any ETA? We have an online exam running in 30 minutes.");
        addComment(t5, techJohn,  "Estimated 45 minutes for full restoration. Core network is back – working on edge switches now.");
        addComment(t5, admin,     "Temporary WiFi hotspots have been set up in Block B corridors to allow the exam to proceed.");

        addComment(t6, techSarah, "Socket has been isolated and power cut to that circuit. Investigating the cause – likely a loose connection behind the wall.");
        addComment(t6, admin,     "Thank you. The event tomorrow has been moved to Conference Room B as a precaution.");

        addComment(t8, bob,       "Glad to hear! Please also remind students near the periodicals section.");
        addComment(t8, techSarah, "Will pass the feedback to the library supervisor. Additional bins have also been placed.");

        addComment(t9, staffSmith, "Excellent work, thank you John. The lab was unusable before. Students are relieved.");
        addComment(t9, techJohn,   "Happy to help! The new LED panels also improve the light quality significantly.");

        addComment(t10, staffJohnson, "Closed and confirmed. The new digital lock is working perfectly.");
        addComment(t12, alice,        "Understood, I will use the booking system next time. Thank you for clarifying.");

        log.info("DataSeeder: comments added.");

        // ── 5. NOTIFICATIONS ──────────────────────────────────────────────────
        // Notify technicians about assignments
        notify(techJohn,  "You have been assigned to ticket #" + t5.getId()  + ": \"" + t5.getTitle()  + "\"", t5.getId(),  false);
        notify(techSarah, "You have been assigned to ticket #" + t6.getId()  + ": \"" + t6.getTitle()  + "\"", t6.getId(),  false);
        notify(techJohn,  "You have been assigned to ticket #" + t7.getId()  + ": \"" + t7.getTitle()  + "\"", t7.getId(),  false);
        notify(techSarah, "You have been assigned to ticket #" + t8.getId()  + ": \"" + t8.getTitle()  + "\"", t8.getId(),  true);
        notify(techJohn,  "You have been assigned to ticket #" + t9.getId()  + ": \"" + t9.getTitle()  + "\"", t9.getId(),  true);
        notify(techSarah, "You have been assigned to ticket #" + t10.getId() + ": \"" + t10.getTitle() + "\"", t10.getId(), true);
        notify(techJohn,  "You have been assigned to ticket #" + t11.getId() + ": \"" + t11.getTitle() + "\"", t11.getId(), true);

        // Notify reporters about status changes
        notify(alice,       "Your ticket #" + t7.getId()  + " is now IN_PROGRESS.", t7.getId(),  false);
        notify(staffJohnson,"Your ticket #" + t5.getId()  + " is now IN_PROGRESS.", t5.getId(),  false);
        notify(admin,       "Your ticket #" + t6.getId()  + " is now IN_PROGRESS.", t6.getId(),  true);
        notify(bob,         "Your ticket #" + t8.getId()  + " has been RESOLVED.", t8.getId(),   false);
        notify(staffSmith,  "Your ticket #" + t9.getId()  + " has been RESOLVED.", t9.getId(),   true);
        notify(staffJohnson,"Your ticket #" + t10.getId() + " has been CLOSED.", t10.getId(),    true);
        notify(charlie,     "Your ticket #" + t11.getId() + " has been CLOSED.", t11.getId(),    true);
        notify(alice,       "Your ticket #" + t12.getId() + " has been REJECTED. Reason: " + t12.getRejectionReason(), t12.getId(), false);

        // Notify reporters about new comments
        notify(alice,      "admin commented on your ticket #" + t1.getId(), t1.getId(), false);
        notify(staffSmith, "admin commented on your ticket #" + t2.getId(), t2.getId(), true);

        log.info("DataSeeder: {} notifications created.", notificationRepository.count());
        log.info("DataSeeder: ✅ All seed data loaded successfully!");
        log.info("─────────────────────────────────────────────────");
        log.info("  LOGIN CREDENTIALS  (password = password123)");
        log.info("  admin          → ADMIN");
        log.info("  tech_john      → TECHNICIAN");
        log.info("  tech_sarah     → TECHNICIAN");
        log.info("  staff_smith    → STAFF");
        log.info("  staff_johnson  → STAFF");
        log.info("  student_alice  → STUDENT");
        log.info("  student_bob    → STUDENT");
        log.info("  student_charlie→ STUDENT");
        log.info("─────────────────────────────────────────────────");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private User user(String username, String email, String pwd, String fullName, UserRole role, String phone) {
        return User.builder()
                .username(username).email(email).password(pwd)
                .fullName(fullName).role(role).phone(phone)
                .build();
    }

    private User save(User u) {
        return userRepository.save(u);
    }

    private Resource saveRes(String name, String location, String description, String type, boolean available) {
        return resourceRepository.save(Resource.builder()
                .name(name).location(location).description(description)
                .type(type).available(available)
                .build());
    }

    private void addComment(Ticket ticket, User author, String content) {
        Comment comment = Comment.builder()
                .content(content)
                .author(author)
                .ticket(ticket)
                .edited(false)
                .build();
        ticket.getComments().add(comment);
        ticketRepository.save(ticket);
    }

    private void notify(User recipient, String message, Long ticketId, boolean read) {
        Notification n = Notification.builder()
                .recipient(recipient)
                .message(message)
                .relatedTicketId(ticketId)
                .read(read)
                .build();
        notificationRepository.save(n);
    }
}

