package com.banfico.hackathon.service;

import com.banfico.hackathon.domain.TransactionDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * High-performance transaction search and filtering.
 *
 * Enables:
 * - Search by merchant name
 * - Filter by date range
 * - Filter by amount range
 * - Filter by credit/debit
 * - Pagination for large result sets
 */
@Service
public class SearchService {

    private final AggregationService agg;

    public SearchService(AggregationService agg) {
        this.agg = agg;
    }

    /**
     * Search transactions by merchant name (case-insensitive partial match)
     * Example: searchByMerchant("amazon") returns all Amazon transactions
     */
    public List<TransactionDto> searchByMerchant(String merchantName) {
        return agg.allTransactions().stream()
                .filter(t -> t.merchant() != null &&
                        t.merchant().toLowerCase().contains(merchantName.toLowerCase()))
                .collect(Collectors.toList());
    }

    /**
     * Filter transactions by date range
     * Example: filterByDate(startDate, endDate)
     */
    public List<TransactionDto> filterByDate(LocalDate start, LocalDate end) {
        return agg.allTransactions().stream()
                .filter(t -> !t.bookedOn().isBefore(start) && !t.bookedOn().isAfter(end))
                .collect(Collectors.toList());
    }

    /**
     * Filter transactions by amount range (in GBP)
     * Example: filterByAmount(100, 500) returns transactions between £100-£500
     */
    public List<TransactionDto> filterByAmount(BigDecimal min, BigDecimal max) {
        return agg.allTransactions().stream()
                .filter(t -> t.amount() != null &&
                        t.amount().compareTo(min) >= 0 &&
                        t.amount().compareTo(max) <= 0)
                .collect(Collectors.toList());
    }

    /**
     * Filter by transaction direction (true = Credit, false = Debit)
     */
    public List<TransactionDto> filterByCredit(boolean isCredit) {
        return agg.allTransactions().stream()
                .filter(t -> t.credit() == isCredit)
                .collect(Collectors.toList());
    }

    /**
     * Combined search: merchant + date range
     */
    public List<TransactionDto> searchByMerchantAndDate(String merchantName, LocalDate start, LocalDate end) {
        return agg.allTransactions().stream()
                .filter(t -> t.merchant() != null &&
                        t.merchant().toLowerCase().contains(merchantName.toLowerCase()) &&
                        !t.bookedOn().isBefore(start) &&
                        !t.bookedOn().isAfter(end))
                .collect(Collectors.toList());
    }

    /**
     * Find recurring transactions (same merchant within 28 days)
     */
    public List<TransactionDto> findRecurring(String accountId) {
        List<TransactionDto> accountTxns = agg.transactions(accountId);
        return accountTxns.stream()
                .filter(t -> {
                    long count = accountTxns.stream()
                            .filter(other -> t.merchant() != null &&
                                    other.merchant() != null &&
                                    t.merchant().equals(other.merchant()) &&
                                    !other.bookedOn().isBefore(t.bookedOn().minusDays(28)))
                            .count();
                    return count >= 2;
                })
                .collect(Collectors.toList());
    }

    /**
     * Paginate results (limit, offset)
     */
    public List<TransactionDto> paginate(List<TransactionDto> transactions, int page, int pageSize) {
        int start = page * pageSize;
        int end = Math.min(start + pageSize, transactions.size());
        if (start >= transactions.size()) return List.of();
        return transactions.subList(start, end);
    }
}
