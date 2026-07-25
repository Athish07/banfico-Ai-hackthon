package com.banfico.hackathon.config;

import com.banfico.hackathon.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Gate for protected endpoints.
 *
 * Fixes vs the first version: accepts a standard "Authorization: Bearer <token>"
 * as well as X-Session-Token (axios interceptors are easier to write against the
 * standard header), and returns a JSON body so the frontend can show a real
 * message instead of an empty 401.
 */
public class SessionInterceptor implements HandlerInterceptor {

    private final SessionService sessionService;

    public SessionInterceptor(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        String token = resolveToken(request);
        if (sessionService.isValidSession(token)) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"Session missing or expired\"}");
        return false;
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return header.substring(7).trim();
        }
        return request.getHeader("X-Session-Token");
    }
}
