package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.LoginRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.request.RegisterRequestDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.AuthResponseDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.dto.response.UserSummaryDTO;
import com.Campus_Hub.Smart_Campus_Operations_Hub.exception.BadRequestException;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.User;
import com.Campus_Hub.Smart_Campus_Operations_Hub.model.enums.UserRole;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.UserRepository;
import com.Campus_Hub.Smart_Campus_Operations_Hub.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody @Valid RegisterRequestDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new BadRequestException("Username is already taken: " + dto.getUsername());
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email is already in use: " + dto.getEmail());
        }

        UserRole role = UserRole.STUDENT;
        if (dto.getRole() != null && !dto.getRole().isBlank()) {
            try {
                role = UserRole.valueOf(dto.getRole().toUpperCase());
                if (role == UserRole.ADMIN) {
                    throw new BadRequestException("Cannot self-register as ADMIN");
                }
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + dto.getRole());
            }
        }

        User user = User.builder()
                .username(dto.getUsername())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .role(role)
                .build();
        User saved = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUsername(saved.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(saved.getId())
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .role(saved.getRole().name())
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build());
    }

    // ===================== GET /api/auth/users =====================
    // Returns all registered users as lightweight summaries.
    // Used by the admin UI to populate the assign-technician dropdown.
    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        List<UserSummaryDTO> users = userRepository.findAll().stream()
                .map(u -> UserSummaryDTO.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .phone(u.getPhone())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}

