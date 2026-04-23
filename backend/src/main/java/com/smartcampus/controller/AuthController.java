package com.smartcampus.controller;

import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.entity.User;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtTokenProvider;
import com.smartcampus.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Module E – Authentication & Authorization
 * Member 4 endpoints
 *
 * GET  /api/v1/auth/me           – get current authenticated user
 * POST /api/v1/auth/refresh      – refresh access token using refresh token
 * POST /api/v1/auth/logout       – client-side logout hint (stateless JWT)
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    /** GET /api/v1/auth/me */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        AuthResponse.UserResponse response = AuthResponse.UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .imageUrl(user.getImageUrl())
                .roles(user.getRoles())
                .provider(user.getProvider().name())
                .build();

        return ResponseEntity.ok(response);
    }

    /** POST /api/v1/auth/refresh  Body: { "refreshToken": "..." } */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        Long userId = tokenProvider.getUserIdFromToken(refreshToken);
        String newAccessToken = tokenProvider.generateAccessTokenFromUserId(userId);
        String newRefreshToken = tokenProvider.generateRefreshToken(userId);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .build();

        return ResponseEntity.ok(authResponse);
    }

    /** POST /api/v1/auth/logout  (stateless – instructs client to discard tokens) */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully. Please discard your tokens."));
    }
}
