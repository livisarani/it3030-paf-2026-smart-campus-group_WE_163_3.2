package com.smartcampus.security.oauth2;

import java.util.Map;

// ── Google ───────────────────────────────────────────────────────────────────
class GoogleOAuth2UserInfo extends OAuth2UserInfo {
    GoogleOAuth2UserInfo(Map<String, Object> attributes) { super(attributes); }

    @Override public String getId()       { return (String) attributes.get("sub"); }
    @Override public String getName()     { return (String) attributes.get("name"); }
    @Override public String getEmail()    { return (String) attributes.get("email"); }
    @Override public String getImageUrl() { return (String) attributes.get("picture"); }
}

// ── GitHub ───────────────────────────────────────────────────────────────────
class GitHubOAuth2UserInfo extends OAuth2UserInfo {
    GitHubOAuth2UserInfo(Map<String, Object> attributes) { super(attributes); }

    @Override public String getId()       { return String.valueOf(attributes.get("id")); }
    @Override public String getName()     {
        String name = (String) attributes.get("name");
        return (name != null && !name.isBlank()) ? name : (String) attributes.get("login");
    }
    @Override public String getEmail()    { return (String) attributes.get("email"); }
    @Override public String getImageUrl() { return (String) attributes.get("avatar_url"); }
}

// ── Factory ──────────────────────────────────────────────────────────────────
public class OAuth2UserInfoFactory {
    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            case "github" -> new GitHubOAuth2UserInfo(attributes);
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + registrationId);
        };
    }
}
