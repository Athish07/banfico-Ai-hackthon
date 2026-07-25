package com.banfico.hackathon.controller;

import com.banfico.hackathon.service.BankApiClient;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Raw upstream passthrough. Use these to confirm the exact OBIE envelope the
 * sandbox returns, then trim ObieMapper.collection() to match instead of relying
 * on its fallbacks.
 */
@RestController
@RequestMapping("/api/debug/raw")
public class DebugController {

    private final BankApiClient bank;

    public DebugController(BankApiClient bank) {
        this.bank = bank;
    }

    @GetMapping("/accounts")
    public Mono<JsonNode> accounts() {
        return bank.getAccounts();
    }

    @GetMapping("/accounts/{id}")
    public Mono<JsonNode> account(@PathVariable String id) {
        return bank.getAccountById(id);
    }

    @GetMapping("/accounts/{id}/balances")
    public Mono<JsonNode> balances(@PathVariable String id) {
        return bank.getBalances(id);
    }

    @GetMapping("/accounts/{id}/transactions")
    public Mono<JsonNode> transactions(@PathVariable String id) {
        return bank.getTransactions(id);
    }
}
