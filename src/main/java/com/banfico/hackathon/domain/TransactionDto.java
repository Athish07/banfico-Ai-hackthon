package com.banfico.hackathon.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Flat, UI-friendly transaction. {@code amount} is always positive;
 * {@code credit} carries the direction. Use {@link #signed()} for arithmetic.
 */
public record TransactionDto(
        String transactionId,
        String accountId,
        LocalDate bookedOn,
        String merchant,
        String description,
        String merchantCategoryCode,
        String category,
        BigDecimal amount,
        String currency,
        boolean credit,
        String status
) {
    public BigDecimal signed() {
        return credit ? amount : amount.negate();
    }

    public YearMonth month() {
        return YearMonth.from(bookedOn);
    }
}
