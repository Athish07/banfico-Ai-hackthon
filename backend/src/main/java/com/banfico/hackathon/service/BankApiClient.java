package com.banfico.hackathon.service;

import com.banfico.hackathon.config.BankApiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Thin wrapper around the OBIE AISP v4.0 mock bank endpoints.
 * Every call resolves a fresh/cached token via AuthService first.
 */
@Service
public class BankApiClient {

    private final WebClient webClient;
    private final AuthService authService;
    private final BankApiProperties props;

    public BankApiClient(WebClient webClient, AuthService authService, BankApiProperties props) {
        this.webClient = webClient;
        this.authService = authService;
        this.props = props;
    }

    public Mono<JsonNode> getAccounts() {
        return authService.getAccessToken().flatMap(token ->
                webClient.get()
                        .uri(props.getCoreApiBaseUrl() + "/accounts?type=domestic")
                        .headers(h -> h.setBearerAuth(token))
                        .retrieve()
                        .bodyToMono(JsonNode.class));
    }

    public Mono<JsonNode> getAccountById(String accountId) {
        return authService.getAccessToken().flatMap(token ->
                webClient.get()
                        .uri(props.getCoreApiBaseUrl() + "/accounts/" + accountId)
                        .headers(h -> h.setBearerAuth(token))
                        .retrieve()
                        .bodyToMono(JsonNode.class));
    }

    public Mono<JsonNode> getBalances(String accountId) {
        return authService.getAccessToken().flatMap(token ->
                webClient.get()
                        .uri(props.getCoreApiBaseUrl() + "/accounts/" + accountId + "/balances")
                        .headers(h -> h.setBearerAuth(token))
                        .retrieve()
                        .bodyToMono(JsonNode.class));
    }

    public Mono<JsonNode> getTransactions(String accountId) {
        return authService.getAccessToken().flatMap(token ->
                webClient.get()
                        .uri(props.getCoreApiBaseUrl() + "/accounts/" + accountId + "/transactions")
                        .headers(h -> h.setBearerAuth(token))
                        .retrieve()
                        .bodyToMono(JsonNode.class));
    }

    /** Seeds a new mock account — useful since this is a fresh sandbox bank. */
    public Mono<JsonNode> createAccount(String requestBodyJson) {
        return authService.getAccessToken().flatMap(token ->
                webClient.post()
                        .uri(props.getCoreApiBaseUrl() + "/accounts")
                        .headers(h -> h.setBearerAuth(token))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .bodyValue(requestBodyJson)
                        .retrieve()
                        .bodyToMono(JsonNode.class));
    }

    /** Seeds a transaction on an account. */
    public Mono<JsonNode> createTransaction(String accountId, String requestBodyJson) {
        return authService.getAccessToken().flatMap(token ->
                webClient.post()
                        .uri(props.getCoreApiBaseUrl() + "/accounts/" + accountId + "/transactions")
                        .headers(h -> h.setBearerAuth(token))
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .bodyValue(requestBodyJson)
                        .retrieve()
                        .bodyToMono(JsonNode.class));
    }
}
