package com.banfico.hackathon.service;

import com.banfico.hackathon.config.BankApiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

/**
 * Fetches and caches the OAuth2 access token from the Keycloak TOKEN API.
 *
 * TWO FIXES vs the first version, both of which matter:
 *
 * 1. Form encoding uses BodyInserters.fromFormData, not bodyValue(map).
 *    bodyValue() wraps the value in fromValue(), which resolves the writer from
 *    the runtime instance. Generics are erased on a LinkedMultiValueMap, so
 *    FormHttpMessageWriter.canWrite() can fail to match and you get a runtime
 *    "No HttpMessageWriter for LinkedMultiValueMap" on your login call.
 *
 * 2. Token caching is done with cacheInvalidateIf, not a synchronized method.
 *    `synchronized Mono<String> get()` only guards ASSEMBLY of the Mono, not its
 *    subscription — so N concurrent dashboard requests all saw a stale cache and
 *    each fired its own token request. cacheInvalidateIf shares one in-flight
 *    request across all subscribers, which is what you actually wanted.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final WebClient webClient;
    private final BankApiProperties props;

    private volatile Instant tokenExpiry = Instant.EPOCH;

    /** One shared, self-invalidating token. Safe for concurrent subscribers. */
    private final Mono<String> token;

    public AuthService(WebClient webClient, BankApiProperties props) {
        this.webClient = webClient;
        this.props = props;
        this.token = Mono.defer(this::fetchToken)
                .cacheInvalidateIf(t -> Instant.now().isAfter(tokenExpiry));
    }

    public Mono<String> getAccessToken() {
        return token;
    }

    private Mono<String> fetchToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", props.getClientId());
        form.add("client_secret", props.getClientSecret());
        form.add("username", props.getUsername());
        form.add("password", props.getPassword());
        form.add("grant_type", "password");

        log.debug("Requesting new bank access token from {}", props.getAuthUrl());

        return webClient.post()
                .uri(props.getAuthUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::extractToken)
                .doOnError(WebClientResponseException.class, e ->
                        log.error("Token request failed [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString()));
    }

    @SuppressWarnings("rawtypes")
    private String extractToken(Map resp) {
        String accessToken = (String) resp.get("access_token");
        if (accessToken == null) {
            throw new IllegalStateException("Token response contained no access_token: " + resp.keySet());
        }
        Object expiresIn = resp.get("expires_in");
        long ttl = expiresIn != null ? Long.parseLong(expiresIn.toString()) : 60;
        // refresh 30s early so a long request can never straddle expiry
        this.tokenExpiry = Instant.now().plusSeconds(Math.max(ttl - 30, 10));
        log.debug("Bank token acquired, valid for {}s", ttl);
        return accessToken;
    }
}
