package com.banfico.hackathon.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Enable Spring caching to speed up repeated API calls to Banfico.
 *
 * How it works:
 * - Caffeine keeps the named caches in memory
 * - Entries expire 5 minutes after they are written
 * - @Cacheable("accounts") caches accounts()
 * - @Cacheable("balances") caches balances per account
 * - @Cacheable("transactions") caches transactions per account
 * - @Cacheable("overview") caches the dashboard overview
 * - @Cacheable("insights") is available for insight-specific caching
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "accounts",
                "balances",
                "allBalances",
                "transactions",
                "overview",
                "insights");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(5)));
        return cacheManager;
    }
}
