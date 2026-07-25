package com.banfico.hackathon.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Portal-level settings: the login your OWN users see, and CORS origins.
 * Deliberately separate from BankApiProperties (which is the service account
 * this app uses to talk to the sandbox).
 */
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String portalUsername = "nivas.ganesan+aihackathonteamf@banfico.com";
    private String portalPassword = "KWRB@(7h2Gk2L1(8daiw";
    private long sessionTtlMinutes = 480;
    private List<String> corsOrigins = List.of("http://localhost:5173", "http://localhost:3000");

    public String getPortalUsername() {
        return portalUsername;
    }

    public void setPortalUsername(String v) {
        this.portalUsername = v;
    }

    public String getPortalPassword() {
        return portalPassword;
    }

    public void setPortalPassword(String v) {
        this.portalPassword = v;
    }

    public long getSessionTtlMinutes() {
        return sessionTtlMinutes;
    }

    public void setSessionTtlMinutes(long v) {
        this.sessionTtlMinutes = v;
    }

    public List<String> getCorsOrigins() {
        return corsOrigins;
    }

    public void setCorsOrigins(List<String> v) {
        this.corsOrigins = v;
    }
}
