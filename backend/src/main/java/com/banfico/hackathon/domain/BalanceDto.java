package com.banfico.hackathon.domain;

import java.math.BigDecimal;

public record BalanceDto(
        String accountId,
        String type,
        BigDecimal amount,
        String currency,
        String asOf
) {}
