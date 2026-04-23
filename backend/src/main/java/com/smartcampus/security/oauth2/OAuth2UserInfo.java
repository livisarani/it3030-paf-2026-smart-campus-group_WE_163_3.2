package com.smartcampus.security.oauth2;

import java.util.Map;

/**
 * Normalises the different attribute maps returned by Google vs GitHub
 * into a consistent interface our service can use.
 */
public abstract class OAuth2UserInfo {

    protected final Map<String, Object> attributes;

    protected OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Map<String, Object> getAttributes() { return attributes; }

    public abstract String getId();
    public abstract String getName();
    public abstract String getEmail();
    public abstract String getImageUrl();
}
