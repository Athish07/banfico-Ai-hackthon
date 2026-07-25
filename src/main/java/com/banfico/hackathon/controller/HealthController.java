package com.banfico.hackathon.controller;

import com.banfico.hackathon.config.AnthropicProperties;
import com.banfico.hackathon.config.BankApiProperties;
import com.banfico.hackathon.service.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public. Hit this first when something breaks — it tells you whether the token
 * exchange works without you having to guess.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final BankApiProperties bankProps;
    private final AnthropicProperties aiProps;
    private final AuthService authService;

    public HealthController(BankApiProperties bankProps, AnthropicProperties aiProps, AuthService authService) {
        this.bankProps = bankProps;
        this.aiProps = aiProps;
        this.authService = authService;
    }

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "UP");
        out.put("tokenUrl", bankProps.getAuthUrl());
        out.put("bankApi", bankProps.getCoreApiBaseUrl());
        out.put("aiConfigured", aiProps.isConfigured());
        out.put("aiModel", aiProps.getModel());

        try {
            String token = authService.getAccessToken().block(Duration.ofSeconds(15));
            out.put("bankAuth", token != null ? "OK" : "NO_TOKEN");
        } catch (Exception e) {
            out.put("bankAuth", "FAILED");
            out.put("bankAuthError", e.getMessage());
        }
        return out;
    }
}
