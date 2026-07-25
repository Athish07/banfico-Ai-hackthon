# MoneySense — AI financial co-pilot

Built for the **Banfico AI Hackathon 2026** on Banfico's Open Banking (AIS) APIs.

Most banking apps tell you what you spent. MoneySense tells you what to do next — and then
does it. Every insight carries an action the user approves in one tap: set a budget, change a
standing order, open a savings goal, draft a refund request.

---

## Run it

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Start the backend on port `8080` and run the frontend locally with live API integration.

The frontend now connects directly to the backend proxy through `/api`. Ensure the backend is
running before signing in.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React + Vite frontend                                   │
│  Home · Login · Dashboard · Transactions · Assistant     │
└───────────────────────────┬──────────────────────────────┘
                            │  the JSON contract
                            │  (src/api/client.js)
              ┌─────────────┴─────────────┐
              │                           │
      ┌───────────────────────▼──────────┐
      │            Backend proxy           │
      │             (Dev 1)                │
      │        normalise + categorise      │
      │             aggregate              │
      └────────────────────────────────────┘
                                └────┬──────────┬────┘
                                     │          │
                        ┌────────────▼──┐   ┌───▼─────────────┐
                        │ Banfico APIs  │   │ LLM agent       │
                        │ Accounts      │   │ (Dev 3)         │
                        │ Balances      │   │ tool calling:   │
                        │ Transactions  │   │ read + act      │
                        └───────────────┘   └─────────────────┘
```

The frontend never talks to the Banfico APIs directly — a thin backend proxy holds the
credentials, normalises transactions, and orchestrates the AI layer.

---

## The contract

All request and response shapes are documented at the top of **`src/api/client.js`**. That file
is the single agreement between the three workstreams. The rule that matters:
`amount` is always positive, and `direction` (`credit` / `debit`) carries the sign.

Two endpoints do the interesting work:

| Endpoint | Purpose |
|---|---|
| `GET /api/observations` | Proactive AI findings, each with an optional executable `action` |
| `POST /api/assistant/chat` | Conversational agent; may return a `proposedAction` for approval |
| `POST /api/actions/execute` | Runs an approved action against the Transactions API |

---

## Who owns what

| | Owns | Files |
|---|---|---|
| **Dev 1 — Data** | Banfico API client, seeder, categorisation, aggregation, anomaly + subscription detection | backend proxy, returns live bank data |
| **Dev 2 — Experience** | Login, home, dashboard, charts, chat UI, responsiveness | `src/pages/`, `src/components/` |
| **Dev 3 — Intelligence** | Agent loop, tool definitions, insight narratives, action execution | `POST /assistant/chat`, `GET /observations`, `POST /actions/execute` |

The frontend now depends on the live backend contract. Dev 1 provides the real data shapes and
Dev 2 / Dev 3 render them directly.

---

## Design

Theme derived from Banfico's own identity — deep navy (`#0B2135`) with the teal crescent accent
(`#17A398`) from their mark, plus the mid-blue (`#2E7BB8`) used in their documents. Every token
lives in **`tailwind.config.js`**; change it in one place.

Type: Sora for display, Inter for UI, IBM Plex Mono for account numbers. All monetary figures use
tabular numerals so nothing jitters as values update.

The signature element is the **insight rail** on the right of the dashboard. The layout itself
encodes the product thesis: the left half is what happened, the right half is what to do about it.

---

## Mapping to the brief

**Core requirements**

- Portal with home and login page — `pages/Home.jsx`, `pages/Login.jsx`
- Account information, balances, transaction history — aggregated on the dashboard
- Unified dashboard view — all accounts in one picture, tap any tile to filter
- Spending summaries, monthly analysis, category breakdown — `components/Charts.jsx`
- Income vs expense trend — six-month composed chart with a net line
- Unusual spending detection — flagged transactions surfaced in the rail and filterable
- Financial health observations — savings rate, headroom, recurring load

**Bonus features implemented**

Conversational assistant · natural language queries · budget recommendations · subscription
detection · anomaly detection · AI financial coaching · voice input · multi-account analytics ·
workflow automation (agentic actions) · personalised dashboard

---

## Live backend path

1. Land on home, sign in with your bank credentials
2. Dashboard: accounts unified, balances, spending shape, savings rate
3. The rail surfaces real insights and recommendations based on connected accounts
4. Ask the assistant about spending, subscriptions, or savings
5. Approve an action and the backend executes it through the connected service
6. View transactions and flagged activity in your real account history

---

## Known limits

Authentication currently uses the app's own login page and session token flow. In a
full production deployment this would be replaced by your bank's identity provider or
standard strong customer authentication.
