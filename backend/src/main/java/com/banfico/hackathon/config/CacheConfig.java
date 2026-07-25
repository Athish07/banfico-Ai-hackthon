package com.banfico.hackathon.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

/**
 * Enable Spring caching to speed up repeated API calls to Banfico.
 * 
 * How it works:
 * - @Cacheable("accounts") caches accounts() for 5 minutes
 * - @Cacheable("balances") caches balances per account for 5 minutes
 * - @Cacheable("transactions") caches transactions per account for 5 minutes
 * 
 * Cache is cleared when data changes (evict on @CacheEvict)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                "accounts",
                "balances",
                "transactions",
                "overview",
                "insights");
    }
}
