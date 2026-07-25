# Banfico Hackathon Backend

Spring Boot 3.3 BFF over the Banfico OBIE sandbox, with a deterministic insights
engine and a Claude-powered coach. See `ARCHITECTURE.md` for the design.

## Run

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # optional; only the AI endpoints need it
mvn spring-boot:run
```

## First five minutes

```bash
# 1. Does the bank token exchange work?  ("bankAuth":"OK")
curl localhost:8080/api/health

# 2. Log in to the portal (default demo / demo123)
curl -s -X POST localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"demo123"}'
# → {"success":true,"sessionToken":"..."}

export T=<sessionToken>

# 3. Look at the REAL OBIE shape before trusting the mapper
curl -s localhost:8080/api/debug/raw/accounts -H "Authorization: Bearer $T" | jq .

# 4. Seed six months of analysable data (do this before building any chart)
curl -s -X POST "localhost:8080/api/seed?accounts=2&months=6" -H "Authorization: Bearer $T"

# 5. The one call the dashboard needs
curl -s localhost:8080/api/insights/overview -H "Authorization: Bearer $T" | jq .
```

If step 1 reports `"bankAuth":"FAILED"`, the problem is credentials or realm —
check the `tokenUrl` it echoes back. Nothing else will work until that says OK.

## Config

Everything is overridable by environment variable; see `application.yml`.
Secrets worth moving out of the file: `BANK_PASSWORD`, `BANK_CLIENT_SECRET`,
`ANTHROPIC_API_KEY`, `PORTAL_PASSWORD`.

## What is where

```
config/      properties, CORS, session interceptor, exception handling
controller/  Auth, Bank, Insights, Chat, Seed, Debug, Health
service/     AuthService (token), BankApiClient (HTTP), AggregationService,
             InsightsService (analytics), AiCoachService (Claude), SessionService
mapping/     ObieMapper (OBIE → DTO), CategoryResolver (MCC + keywords → category)
domain/      AccountDto, BalanceDto, TransactionDto
dto/         Insights (all insight shapes), LoginRequest/Response
```

## Next, for score

Evaluation weights Innovation 25% and AI 20% against Effective Use of APIs 10%.
The API plumbing is done — spend remaining time on the UI and on turning
`/api/chat` into a tool-using agent (expose `getCategoryBreakdown`,
`getSubscriptions`, `findTransactions` as tools rather than stuffing context).
That is the "MCP / AI Agent integration" bonus and it demos much better.
