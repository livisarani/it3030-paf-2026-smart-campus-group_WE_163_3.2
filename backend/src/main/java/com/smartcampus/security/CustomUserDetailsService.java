package com.smartcampus.security;

import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Spring Security calls this with the username, but we store userId in the JWT subject.
     * So "username" here is actually the userId string.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userIdOrEmail) throws UsernameNotFoundException {
        // Try by ID first (JWT flow), then by email (form login fallback)
        try {
            Long id = Long.parseLong(userIdOrEmail);
            return userRepository.findById(id)
                    .map(UserPrincipal::create)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
        } catch (NumberFormatException e) {
            return userRepository.findByEmail(userIdOrEmail)
                    .map(UserPrincipal::create)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + userIdOrEmail));
        }
    }
}
