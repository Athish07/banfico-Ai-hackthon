package com.banfico.hackathon.config;

import com.banfico.hackathon.service.AggregationService;
import com.banfico.hackathon.service.AiCoachService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Without this, an upstream 401/404 surfaced as a 500 with a Reactor stack trace
 * and no usable message, which is miserable to debug from the browser console at
 * 4pm.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AggregationService.NotFoundException.class)
    public ResponseEntity<?> notFound(AggregationService.NotFoundException e) {
        return body(HttpStatus.NOT_FOUND, "not_found", e.getMessage());
    }

    @ExceptionHandler(AiCoachService.AiUnavailableException.class)
    public ResponseEntity<?> aiDown(AiCoachService.AiUnavailableException e) {
        return body(HttpStatus.SERVICE_UNAVAILABLE, "ai_unavailable", e.getMessage());
    }

    @ExceptionHandler(WebClientResponseException.class)
    public ResponseEntity<?> upstream(WebClientResponseException e) {
        log.error("Upstream error [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("error", "upstream_error");
        out.put("upstreamStatus", e.getStatusCode().value());
        out.put("message", e.getResponseBodyAsString());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(out);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> generic(Exception e) {
        log.error("Unhandled error", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", String.valueOf(e.getMessage()));
    }

    private ResponseEntity<?> body(HttpStatus status, String code, String message) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("error", code);
        out.put("message", message);
        return ResponseEntity.status(status).body(out);
    }
}
