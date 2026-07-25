package com.banfico.hackathon.dto;

import com.banfico.hackathon.domain.TransactionDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Container for every insight shape the dashboard consumes. */
public final class Insights {

    private Insights() {}

    public record MonthlySummary(
            String month,          // e.g. "2026-07"
            BigDecimal income,
            BigDecimal expense,
            BigDecimal net,
            BigDecimal savingsRate // percent of income retained
    ) {}

    public record CategorySpend(
            String category,
            BigDecimal total,
            BigDecimal sharePercent,
            int transactionCount,
            BigDecimal changeVsPreviousMonth // percent, null when no baseline
    ) {}

    public record MerchantSpend(String merchant, BigDecimal total, int transactionCount) {}

    public record Subscription(
            String merchant,
            BigDecimal typicalAmount,
            int occurrences,
            LocalDate lastCharged,
            BigDecimal estimatedAnnualCost
    ) {}

    public record Anomaly(
            TransactionDto transaction,
            String reason,
            BigDecimal categoryAverage,
            BigDecimal timesAverage
    ) {}

    public record HealthObservation(String severity, String title, String detail) {}

    public record FinancialHealth(int score, String grade, List<HealthObservation> observations) {}

    /** Everything the dashboard needs, in one round trip. */
    public record Overview(
            BigDecimal totalBalance,
            String currency,
            int accountCount,
            int transactionCount,
            LocalDate periodFrom,
            LocalDate periodTo,
            List<MonthlySummary> monthly,
            List<CategorySpend> categories,
            List<MerchantSpend> topMerchants,
            List<Subscription> subscriptions,
            List<Anomaly> anomalies,
            FinancialHealth health
    ) {}
}
