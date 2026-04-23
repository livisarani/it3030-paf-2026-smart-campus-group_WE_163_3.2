package com.smartcampus.service.impl;

import com.smartcampus.entity.User;
import com.smartcampus.enums.Role;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserWithRoles(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return toMap(user);
    }

    @Override
    @Transactional
    public Map<String, Object> updateUserRoles(Long userId, Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new BadRequestException("At least one role must be assigned");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.getRoles().clear();
        user.getRoles().addAll(roles);
        userRepository.save(user);
        return toMap(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUsersWithRoles(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size))
                .stream()
                .map(this::toMap)
                .toList();
    }

    private Map<String, Object> toMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("name", u.getName());
        m.put("email", u.getEmail());
        m.put("roles", u.getRoles());
        m.put("provider", u.getProvider());
        m.put("enabled", u.getEnabled());
        m.put("createdAt", u.getCreatedAt());
        return m;
    }
}
