package com.banfico.hackathon.service;

import com.banfico.hackathon.config.AnthropicProperties;
import com.banfico.hackathon.domain.TransactionDto;
import com.banfico.hackathon.dto.Insights;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The AI layer. Two capabilities: coaching (narrate the numbers) and a
 * conversational assistant (answer questions about the user's money).
 *
 * THE IMPORTANT DESIGN RULE: InsightsService does all arithmetic in plain Java,
 * deterministically. The model receives finished figures and is told never to
 * compute or invent one. Ask an LLM to add up your transactions and sooner or
 * later a judge will spot a total that does not reconcile — and then nothing
 * else you show them is trusted.
 */
@Service
public class AiCoachService {

    private static final Logger log = LoggerFactory.getLogger(AiCoachService.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(60);
    private static final int MAX_TXNS_IN_CONTEXT = 60;

    private static final String SYSTEM_PROMPT = """
            You are a financial coach inside a UK personal banking app.

            You will be given a JSON payload containing the user's pre-computed
            financial figures and a sample of recent transactions.

            Rules you must follow:
            - Use ONLY figures present in the JSON. Never calculate a new total,
              average or projection, and never invent a number, merchant or date.
            - If the JSON does not contain what is needed to answer, say so plainly
              and name what is missing.
            - Amounts are GBP. Quote them as given, to two decimal places.
            - Be specific and concrete. "Your Dining spend rose 34% to 412.90"
              beats "consider reviewing discretionary spending".
            - Be warm and non-judgemental. Never shame the user about money.
            - Keep it short: at most three observations unless asked for more.
            """;

    private final WebClient webClient;
    private final AnthropicProperties props;
    private final AggregationService aggregation;
    private final ObjectMapper json;

    public AiCoachService(WebClient webClient, AnthropicProperties props,
                          AggregationService aggregation, ObjectMapper json) {
        this.webClient = webClient;
        this.props = props;
        this.aggregation = aggregation;
        this.json = json;
    }

    /** Proactive coaching for the dashboard. */
    public Map<String, Object> coach() {
        Insights.Overview overview = aggregation.overview();
        String reply = ask(buildContext(overview, aggregation.allTransactions()),
                "Give me three specific observations about my finances right now, "
                        + "each with a concrete next step. Cite the exact figures.");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coaching", reply);
        out.put("healthScore", overview.health().score());
        out.put("grade", overview.health().grade());
        return out;
    }

    /** Conversational assistant. Pass prior turns to keep context. */
    public Map<String, Object> chat(String question, List<Map<String, String>> history) {
        Insights.Overview overview = aggregation.overview();
        String reply = ask(buildContext(overview, aggregation.allTransactions()), question, history);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("answer", reply);
        return out;
    }

    /**
     * Grounding context. Note that we send the AGGREGATES plus a bounded sample of
     * transactions, not every row. Cheaper, faster, and it keeps the model away
     * from doing its own arithmetic.
     *
     * Upgrade path for the "MCP / AI Agent integration" bonus: expose
     * getCategoryBreakdown / getSubscriptions / findTransactions as tools and let
     * the model call them. It demos far better than context stuffing.
     */
    private String buildContext(Insights.Overview overview, List<TransactionDto> txns) {
        try {
            Map<String, Object> ctx = new LinkedHashMap<>();
            ctx.put("summary", overview);
            ctx.put("recentTransactions", txns.size() > MAX_TXNS_IN_CONTEXT
                    ? txns.subList(0, MAX_TXNS_IN_CONTEXT) : txns);
            ctx.put("note", "All monetary values are GBP and already computed. Do not recalculate.");
            return json.writeValueAsString(ctx);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialise financial context", e);
        }
    }

    private String ask(String context, String question) {
        return ask(context, question, List.of());
    }

    private String ask(String context, String question, List<Map<String, String>> history) {
        if (!props.isConfigured()) {
            throw new AiUnavailableException(
                    "No Anthropic API key configured. Set ANTHROPIC_API_KEY and restart.");
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        if (history != null) {
            for (Map<String, String> turn : history) {
                String role = turn.get("role");
                String content = turn.get("content");
                if (role == null || content == null) continue;
                messages.add(Map.<String, Object>of("role", role, "content", content));
            }
        }
        messages.add(Map.<String, Object>of("role", "user", "content",
                "Here is my financial data as JSON:\n" + context + "\n\nQuestion: " + question));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", props.getModel());
        body.put("max_tokens", props.getMaxTokens());
        body.put("system", SYSTEM_PROMPT);
        body.put("messages", messages);

        try {
            JsonNode response = webClient.post()
                    .uri(props.getBaseUrl())
                    .header("x-api-key", props.getApiKey())
                    .header("anthropic-version", props.getVersion())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(TIMEOUT);

            return extractText(response);
        } catch (WebClientResponseException e) {
            log.error("Anthropic API error [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiUnavailableException("AI request failed: " + e.getStatusCode());
        }
    }

    /**
     * The response content is a list of blocks; concatenate every text block
     * rather than assuming content[0] is the answer. Once you add tool use, the
     * list will also contain tool_use blocks and index 0 will not be text.
     */
    private String extractText(JsonNode response) {
        if (response == null || !response.has("content")) {
            throw new AiUnavailableException("Empty response from AI provider");
        }
        StringBuilder sb = new StringBuilder();
        for (JsonNode block : response.get("content")) {
            if ("text".equals(block.path("type").asText())) {
                sb.append(block.path("text").asText());
            }
        }
        return sb.toString().trim();
    }

    public static class AiUnavailableException extends RuntimeException {
        public AiUnavailableException(String msg) { super(msg); }
    }
}
