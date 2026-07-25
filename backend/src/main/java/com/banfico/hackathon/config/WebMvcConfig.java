package com.banfico.hackathon.config;

import com.banfico.hackathon.service.SessionService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final SessionService sessionService;
    private final AppProperties appProps;

    public WebMvcConfig(SessionService sessionService, AppProperties appProps) {
        this.sessionService = sessionService;
        this.appProps = appProps;
    }

    /**
     * CORS is configured centrally here instead of with @CrossOrigin("*") on each
     * controller. Two reasons: one place to change it, and "*" stops working the
     * moment you want credentialed requests — better to name the Vite origin now
     * than debug it during your demo.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(appProps.getCorsOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * Protects everything except /api/auth/** and /api/health.
     *
     * Fix vs the first version: that one listed only /api/accounts, /api/insights
     * and /api/chat, which left /api/transactions and — more importantly —
     * /api/seed wide open. An unauthenticated POST /api/seed can write junk into
     * your sandbox mid-demo.
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SessionInterceptor(sessionService))
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**", "/api/health");
    }
}
