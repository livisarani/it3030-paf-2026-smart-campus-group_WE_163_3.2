package com.smartcampus.security.oauth2;

import com.smartcampus.entity.User;
import com.smartcampus.enums.AuthProvider;
import com.smartcampus.enums.Role;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
                registrationId, oAuth2User.getAttributes());

        if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        User user = userRepository.findByEmail(userInfo.getEmail())
                .map(existing -> updateExistingUser(existing, userInfo))
                .orElseGet(() -> registerNewUser(userInfo, provider));

        return UserPrincipal.create(user, oAuth2User.getAttributes());
    }

    private User registerNewUser(OAuth2UserInfo info, AuthProvider provider) {
        log.info("Registering new OAuth2 user: {}", info.getEmail());
        User user = User.builder()
                .email(info.getEmail())
                .name(info.getName())
                .imageUrl(info.getImageUrl())
                .provider(provider)
                .providerId(info.getId())
                .emailVerified(true)
                .roles(Set.of(Role.USER))
                .enabled(true)
                .build();
        return userRepository.save(user);
    }

    private User updateExistingUser(User user, OAuth2UserInfo info) {
        user.setName(info.getName());
        user.setImageUrl(info.getImageUrl());
        return userRepository.save(user);
    }
}
