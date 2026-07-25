package com.banfico.hackathon.service;

import com.banfico.hackathon.domain.AccountDto;
import com.banfico.hackathon.domain.BalanceDto;
import com.banfico.hackathon.domain.TransactionDto;
import com.banfico.hackathon.dto.Insights;
import com.banfico.hackathon.mapping.ObieMapper;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * "Unified financial visibility" with caching for fast dashboard loads.
 *
 * PERFORMANCE FIX (this revision):
 * The previous version cached accounts()/balances()/transactions()/overview()
 * individually, but every "give me everything" endpoint (allTransactions(),
 * allBalances(), and the four /api/insights/* endpoints that each call
 * allTransactions() themselves) recomputed from scratch by hitting Banfico
 * once per account, EVERY request. allTransactions() had no @Cacheable at all,
 * even though CacheConfig already declared a cache slot for it. That is the
 * entire "our API is slow, Banfico is fast" symptom: a single dashboard paint
 * fans out to 5 uncached, per-account round trips to Banfico instead of 1.
 *
 * Fix, in order of impact:
 * 1. allTransactions() and allBalances() are now @Cacheable (sync = true).
 * 2. All @Cacheable methods use sync = true, so N concurrent requests on a
 *    cold cache (typical of a SPA firing accounts+balances+transactions+
 *    insights in parallel on page load) share ONE in-flight fetch instead of
 *    each racing to hit Banfico independently.
 * 3. Self-invocation fixed: overview()/allBalances()/allTransactions() used to
 *    call accounts()/balances()/transactions() via `this.`, which bypasses the
 *    Spring AOP proxy and silently skips @Cacheable on the inner call. They now
 *    go through an injected self-proxy, so every code path shares the exact
 *    same cache entries instead of quietly re-fetching from Banfico.
 * 4. overview() no longer re-derives transactions/balances with its own
 *    duplicate reactive fan-out; it now simply reuses allTransactions() and
 *    allBalances(), so there is exactly one fetch strategy, not two.
 * 5. clearCache() actually clears the caches now (see below) so seeding /
 *    creating an account or transaction doesn't leave the dashboard showing
 *    stale data for up to 5 minutes.
 *
 * Net effect: on a cold cache, one dashboard load makes exactly one Banfico
 * round trip per account (in parallel), no matter how many widgets/endpoints
 * the frontend calls. On a warm cache (<5 min old), every endpoint returns
 * from memory.
 *
 * On the .block() calls: this is a Spring MVC (servlet) app — WebClient came in
 * only because it is a convenient HTTP client. Blocking a Tomcat request thread
 * is exactly what MVC does anyway, so this is safe. The per-account fan-outs
 * below use Schedulers.boundedElastic() so those blocking cache/HTTP calls run
 * off the calling thread and in parallel with each other.
 */
@Service
public class AggregationService {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    private final BankApiClient bank;
    private final ObieMapper mapper;
    private final InsightsService insights;
    private final CacheManager cacheManager;

    /**
     * Lazy self-proxy. Calling self.accounts() (instead of this.accounts())
     * from inside another method of this bean routes the call back through
     * Spring's caching proxy, so @Cacheable actually applies. Without this,
     * internal calls silently bypass the cache — the bug that caused
     * overview()/allBalances()/allTransactions() to each independently
     * re-fetch everything from Banfico.
     */
    private final AggregationService self;

    public AggregationService(BankApiClient bank, ObieMapper mapper, InsightsService insights,
                               CacheManager cacheManager, @Lazy AggregationService self) {
        this.bank = bank;
        this.mapper = mapper;
        this.insights = insights;
        this.cacheManager = cacheManager;
        this.self = self;
    }

    /**
     * CACHED: Returns all accounts (cached for 5 min, shared across all
     * concurrent callers thanks to sync = true).
     */
    @Cacheable(value = "accounts", sync = true)
    public List<AccountDto> accounts() {
        return mapper.accounts(bank.getAccounts().block(TIMEOUT));
    }

    public AccountDto account(String accountId) {
        List<AccountDto> found = mapper.accounts(bank.getAccountById(accountId).block(TIMEOUT));
        if (found.isEmpty())
            throw new NotFoundException("Account " + accountId + " not found");
        return found.get(0);
    }

    /**
     * CACHED: Returns balances for a specific account (cached for 5 min).
     * Cache key: balances::accountId
     */
    @Cacheable(value = "balances", key = "#accountId", sync = true)
    public List<BalanceDto> balances(String accountId) {
        return mapper.balances(bank.getBalances(accountId).block(TIMEOUT));
    }

    /**
     * CACHED: every balance across every account, in account order.
     * Fetches concurrently per account (via the boundedElastic scheduler) but
     * preserves account order in the result, and shares its per-account
     * entries with the "balances" cache instead of quietly bypassing it.
     */
    @Cacheable(value = "allBalances", sync = true)
    public List<BalanceDto> allBalances() {
        List<AccountDto> accounts = self.accounts();
        return Flux.fromIterable(accounts)
                .filter(a -> a.accountId() != null)
                .flatMapSequential(a -> Mono.fromCallable(() -> self.balances(a.accountId()))
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMapIterable(list -> list)
                .collectList()
                .block(TIMEOUT);
    }

    /**
     * CACHED: Returns transactions for a specific account (cached for 5 min).
     * Cache key: transactions::accountId
     */
    @Cacheable(value = "transactions", key = "#accountId", sync = true)
    public List<TransactionDto> transactions(String accountId) {
        return mapper.transactions(bank.getTransactions(accountId).block(TIMEOUT), accountId);
    }

    /**
     * CACHED: every transaction across every account, newest first.
     *
     * This was previously NOT cached at all, despite CacheConfig already
     * declaring an "allTransactions" cache slot. Every call to
     * /api/transactions, /api/insights/monthly, /api/insights/categories,
     * /api/insights/subscriptions, /api/insights/anomalies, and every
     * SearchService method independently re-fetched every account's full
     * transaction history from Banfico. A single dashboard paint that hits
     * 4-5 of those endpoints meant 4-5x the necessary Banfico traffic. This
     * one annotation is the single biggest fix in this file.
     */
    @Cacheable(value = "allTransactions", sync = true)
    public List<TransactionDto> allTransactions() {
        List<AccountDto> accounts = self.accounts();
        return Flux.fromIterable(accounts)
                .filter(a -> a.accountId() != null)
                .flatMap(a -> Mono.fromCallable(() -> self.transactions(a.accountId()))
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMapIterable(list -> list)
                .sort(Comparator.comparing(TransactionDto::bookedOn).reversed())
                .collectList()
                .block(TIMEOUT);
    }

    /**
     * CACHED COMPOSITE: One call that powers the entire dashboard overview.
     * Now simply reuses allTransactions() and allBalances() (both cached and
     * shared with every other endpoint) instead of maintaining a second,
     * duplicate reactive fetch strategy that hit Banfico all over again.
     */
    @Cacheable(value = "overview", sync = true)
    public Insights.Overview overview() {
        List<AccountDto> accounts = self.accounts();
        List<TransactionDto> txns = self.allTransactions();
        BigDecimal totalBalance = totalBalance(accounts, self.allBalances());
        return insights.build(txns, totalBalance, accounts.size());
    }

    /**
     * Sums one balance per account: the account's own Banfico balance entry
     * if present, otherwise the balance figure embedded in the account record
     * itself (mirrors the previous fallback behaviour).
     */
    private BigDecimal totalBalance(List<AccountDto> accounts, List<BalanceDto> balances) {
        Map<String, BigDecimal> byAccount = balances.stream()
                .filter(b -> b.accountId() != null && b.amount() != null)
                .collect(Collectors.toMap(BalanceDto::accountId, BalanceDto::amount, (first, dupe) -> first));

        BigDecimal total = BigDecimal.ZERO;
        for (AccountDto a : accounts) {
            BigDecimal amount = a.accountId() != null ? byAccount.get(a.accountId()) : null;
            if (amount == null) amount = a.balance();
            if (amount != null) total = total.add(amount);
        }
        return total;
    }

    /**
     * Actually clears every named cache now, instead of doing nothing. Call
     * this after any mutation (seeding, creating an account/transaction) so
     * the dashboard doesn't show stale data for up to 5 minutes. Caffeine's
     * expireAfterWrite still provides the automatic 5-minute TTL on top of
     * this for normal operation.
     */
    public void clearCache() {
        for (String name : cacheManager.getCacheNames()) {
            var cache = cacheManager.getCache(name);
            if (cache != null) cache.clear();
        }
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String msg) {
            super(msg);
        }
    }
}
