package com.banfico.hackathon.controller;

import com.banfico.hackathon.dto.LoginRequest;
import com.banfico.hackathon.dto.LoginResponse;
import com.banfico.hackathon.service.SessionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Fix vs the first version: a failed login returned HTTP 200 with
 * {"success": false}. axios only rejects on non-2xx, so the frontend would fall
 * into its success branch and navigate to an empty dashboard. Now it returns 401.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SessionService sessionService;

    public AuthController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (!sessionService.validateCredentials(request.getUsername(), request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(false, null, "Invalid username or password"));
        }
        String token = sessionService.createSession(request.getUsername());
        return ResponseEntity.ok(new LoginResponse(true, token, "Login successful"));
    }

    /** Lets the frontend restore a session on page refresh instead of bouncing to login. */
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth,
                                @RequestHeader(value = "X-Session-Token", required = false) String legacy) {
        String token = extract(auth, legacy);
        return sessionService.usernameFor(token)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of("username", u, "authenticated", true)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("authenticated", false)));
    }

    @PostMapping("/logout")
    public LoginResponse logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth,
                                @RequestHeader(value = "X-Session-Token", required = false) String legacy) {
        sessionService.invalidateSession(extract(auth, legacy));
        return new LoginResponse(true, null, "Logged out");
    }

    private String extract(String authorization, String legacyHeader) {
        if (authorization != null && authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return authorization.substring(7).trim();
        }
        return legacyHeader;
    }
}
