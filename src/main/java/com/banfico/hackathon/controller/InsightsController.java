package com.banfico.hackathon.controller;

import com.banfico.hackathon.dto.Insights;
import com.banfico.hackathon.service.AggregationService;
import com.banfico.hackathon.service.InsightsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Core Requirement #2 (Financial Insights) — the section that was missing.
 * Spending summaries, monthly analysis, category breakdown, income vs expense,
 * unusual spend detection and financial health observations all live here.
 */
@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    private final AggregationService aggregation;
    private final InsightsService insights;

    public InsightsController(AggregationService aggregation, InsightsService insights) {
        this.aggregation = aggregation;
        this.insights = insights;
    }

    /** Everything the dashboard needs, one request. */
    @GetMapping("/overview")
    public Insights.Overview overview() {
        return aggregation.overview();
    }

    @GetMapping("/monthly")
    public List<Insights.MonthlySummary> monthly() {
        return insights.monthlySummaries(aggregation.allTransactions());
    }

    @GetMapping("/categories")
    public List<Insights.CategorySpend> categories() {
        return insights.categoryBreakdown(aggregation.allTransactions());
    }

    @GetMapping("/subscriptions")
    public List<Insights.Subscription> subscriptions() {
        return insights.detectSubscriptions(aggregation.allTransactions());
    }

    @GetMapping("/anomalies")
    public List<Insights.Anomaly> anomalies() {
        return insights.detectAnomalies(aggregation.allTransactions());
    }
}
