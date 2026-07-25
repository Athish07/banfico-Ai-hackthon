package com.banfico.hackathon.controller;

import com.banfico.hackathon.domain.AccountDto;
import com.banfico.hackathon.service.AggregationService;
import com.banfico.hackathon.service.BankApiClient;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * POST /api/seed?accounts=2&months=6
 *
 * The original seeder had four flaws that would each have broken a demo:
 *
 *  1. Every transaction used Instant.now(), so all six landed in today. "Monthly
 *     spending analysis" and "income vs expense trends" had exactly one data
 *     point — your line charts would have been a dot.
 *  2. Every transaction was a Debit. No income at all, so savings rate, income vs
 *     expense and financial health were all meaningless.
 *  3. Every transaction carried MerchantCategoryCode "1711". Your category pie
 *     chart would have been one solid circle.
 *  4. Only six transactions total — not enough for anomaly detection (needs
 *     variance) or subscription detection (needs repetition across months).
 *
 * Also fixed: .get(0) on a MissingNode returns null and then NPEs, so the
 * AccountId lookup now uses .path(0); and seeding runs via concatMap so you are
 * not firing ~200 concurrent POSTs at a shared sandbox.
 */
@RestController
@RequestMapping("/api/seed")
public class SeedController {

    private static final Logger log = LoggerFactory.getLogger(SeedController.class);
    private static final Duration TIMEOUT = Duration.ofMinutes(5);

    private final BankApiClient bank;
    private final AggregationService aggregation;

    public SeedController(BankApiClient bank, AggregationService aggregation) {
        this.bank = bank;
        this.aggregation = aggregation;
    }

    /** merchant, MCC, typical amount, is it a monthly subscription */
    private static final Object[][] MERCHANTS = {
            {"Tesco Extra",       "5411", 62.40,  false},
            {"Sainsbury's Local", "5411", 18.75,  false},
            {"Pret A Manger",     "5814", 9.20,   false},
            {"Dishoom",           "5812", 47.00,  false},
            {"Shell Garage",      "5541", 71.10,  false},
            {"Trainline",         "4111", 26.50,  false},
            {"Uber",              "4121", 14.30,  false},
            {"Boots Pharmacy",    "5912", 22.15,  false},
            {"ASOS",              "5651", 58.00,  false},
            {"IKEA",              "5712", 134.99, false},
            {"Netflix",           "4899", 15.99,  true},
            {"Spotify",           "4899", 11.99,  true},
            {"PureGym",           "7997", 24.99,  true},
            {"Vodafone UK",       "4814", 32.00,  true},
            {"British Gas",       "4900", 88.20,  true},
            {"Thames Water",      "4900", 41.50,  true},
    };

    @PostMapping
    public Map<String, Object> seed(@RequestParam(defaultValue = "2") int accounts,
                                    @RequestParam(defaultValue = "6") int months) {

        List<String> createdIds = new ArrayList<>();
        for (int i = 0; i < accounts; i++) {
            JsonNode resp = bank.createAccount(accountBody(i)).block(Duration.ofSeconds(30));
            String id = extractAccountId(resp);
            log.info("Created account {} -> {}", i, id);
            if (id != null) createdIds.add(id);
        }

        // Fall back to whatever the sandbox reports if the POST response shape differs.
        List<String> targets = createdIds.isEmpty()
                ? aggregation.accounts().stream().map(AccountDto::accountId).filter(java.util.Objects::nonNull).toList()
                : createdIds;

        int total = 0;
        for (String accountId : targets) {
            total += seedTransactions(accountId, months);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("accountsCreated", createdIds.size());
        out.put("accountsSeeded", targets.size());
        out.put("transactionsCreated", total);
        out.put("monthsOfHistory", months);
        out.put("next", "GET /api/insights/overview");
        return out;
    }

    private int seedTransactions(String accountId, int months) {
        List<String> bodies = new ArrayList<>();
        LocalDate today = LocalDate.now();
        double running = 2500 + ThreadLocalRandom.current().nextInt(2000);

        for (int monthsAgo = months - 1; monthsAgo >= 0; monthsAgo--) {
            LocalDate monthStart = today.minusMonths(monthsAgo).withDayOfMonth(1);

            // Salary — without a Credit there is no income and no savings rate.
            LocalDateTime payday = monthStart
                    .withDayOfMonth(Math.min(28, monthStart.lengthOfMonth())).atTime(9, 0);
            if (!payday.toLocalDate().isAfter(today)) {
                running += 3200;
                bodies.add(transactionBody("Acme Corp Payroll", "0000", 3200.00, "Credit", payday, running));
            }

            for (Object[] m : MERCHANTS) {
                boolean subscription = (Boolean) m[3];
                int occurrences = subscription ? 1 : 1 + ThreadLocalRandom.current().nextInt(3);
                for (int o = 0; o < occurrences; o++) {
                    int day = 1 + ThreadLocalRandom.current().nextInt(monthStart.lengthOfMonth());
                    LocalDateTime when = monthStart.withDayOfMonth(day)
                            .atTime(8 + ThreadLocalRandom.current().nextInt(12),
                                    ThreadLocalRandom.current().nextInt(60));
                    if (when.toLocalDate().isAfter(today)) continue;

                    double base = (Double) m[2];
                    // Subscriptions must stay near-constant or the detector won't see them.
                    double amount = subscription ? base
                            : Math.round(base * (0.55 + ThreadLocalRandom.current().nextDouble() * 0.95) * 100) / 100.0;
                    running -= amount;
                    bodies.add(transactionBody((String) m[0], (String) m[1], amount, "Debit", when, running));
                }
            }
        }

        // One deliberate outlier so the anomaly detector has something to find on stage.
        bodies.add(transactionBody("Harrods", "5651", 1289.00, "Debit",
                today.minusDays(21).atTime(16, 42), running - 1289));

        Long written = Flux.fromIterable(bodies)
                .concatMap(body -> bank.createTransaction(accountId, body)
                        .onErrorResume(e -> {
                            log.warn("Transaction rejected: {}", e.getMessage());
                            return reactor.core.publisher.Mono.empty();
                        }))
                .count()
                .block(TIMEOUT);

        log.info("Seeded {} transactions on {}", written, accountId);
        return written == null ? 0 : written.intValue();
    }

    private String extractAccountId(JsonNode resp) {
        if (resp == null) return null;
        // .path() everywhere: .get(0) on a missing node returns null and then NPEs.
        JsonNode viaData = resp.path("Data").path("Account").path(0).path("AccountId");
        if (!viaData.isMissingNode() && !viaData.asText().isBlank()) return viaData.asText();
        JsonNode flat = resp.path("AccountId");
        if (!flat.isMissingNode() && !flat.asText().isBlank()) return flat.asText();
        log.warn("Could not find AccountId in create-account response: {}", resp);
        return null;
    }

    private String accountBody(int index) {
        String[] nicknames = {"Everyday Current", "Rainy Day Savings", "Bills", "Holiday Fund"};
        String now = LocalDateTime.now().toInstant(ZoneOffset.UTC).toString();
        return """
            {
              "Nickname": "%s",
              "StatusUpdateDateTime": "%s",
              "OpeningDate": "%s",
              "Status": "Enabled",
              "AccountCategory": "Personal",
              "AccountTypeCode": "CACC",
              "Balance": "%.2f",
              "Currency": "GBP",
              "Account": [{
                "SchemeName": "UK.OBIE.SortCodeAccountNumber",
                "Identification": "%s",
                "Name": "Demo User",
                "SecondaryIdentification": "%s"
              }],
              "Servicer": {
                "SchemeName": "UK.OBIE.BICFI",
                "Identification": "SC802001",
                "Name": "ServicerNameSample"
              },
              "StatementFrequencyAndFormat": [{
                "CommunicationMethod": "EMAL",
                "Format": "DPDF",
                "Frequency": "DAIL"
              }],
              "InternationalAccount": false
            }
            """.formatted(nicknames[index % nicknames.length], now, now,
                1500 + ThreadLocalRandom.current().nextDouble() * 5000,
                randomDigits(14), randomDigits(5));
    }

    private String transactionBody(String merchant, String mcc, double amount,
                                   String indicator, LocalDateTime when, double balanceAfter) {
        String iso = when.toInstant(ZoneOffset.UTC).toString();
        return """
            {
              "TransactionReference": "Ref%s",
              "Amount": { "Amount": "%.2f", "Currency": "GBP" },
              "CreditDebitIndicator": "%s",
              "Status": "Booked",
              "BookingDateTime": "%s",
              "ValueDateTime": "%s",
              "TransactionInformation": "%s",
              "BankTransactionCode": { "Code": "IssuedCreditTransfer", "SubCode": "AutomaticTransfer" },
              "ProprietaryBankTransactionCode": { "Code": "Transfer", "Issuer": "CoreBank" },
              "Balance": {
                "Amount": { "Amount": "%.2f", "Currency": "GBP" },
                "CreditDebitIndicator": "%s",
                "Type": "ITBD"
              },
              "PaymentPurposeCode": "CASH",
              "MerchantDetails": { "MerchantName": "%s", "MerchantCategoryCode": "%s" }
            }
            """.formatted(randomDigits(10), amount, indicator, iso, iso, merchant,
                Math.abs(balanceAfter), balanceAfter >= 0 ? "Credit" : "Debit", merchant, mcc);
    }

    private String randomDigits(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) sb.append(ThreadLocalRandom.current().nextInt(10));
        return sb.toString();
    }
}
