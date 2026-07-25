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

Sign in with **`demo@banfico.com`** / **`hackathon`** (prefilled on the login page).

The app ships with a deterministic mock data layer, so it runs fully standalone with no backend.
To switch to the live Banfico APIs, set `VITE_USE_MOCK=false` in `.env` and start the backend on
port `8080` (Vite proxies `/api` to it — see `vite.config.js`).

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
      ┌───────▼────────┐        ┌─────────▼──────────┐
      │  Mock layer    │        │  Backend proxy     │
      │  src/data/     │        │  (Dev 1)           │
      │  6 months of   │        │  normalise +       │
      │  seeded data   │        │  categorise +      │
      └────────────────┘        │  aggregate         │
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
| **Dev 1 — Data** | Banfico API client, seeder, categorisation, aggregation, anomaly + subscription detection | backend, replaces `src/data/mock.js` as the source |
| **Dev 2 — Experience** | Login, home, dashboard, charts, chat UI, responsiveness | `src/pages/`, `src/components/` |
| **Dev 3 — Intelligence** | Agent loop, tool definitions, insight narratives, action execution | `POST /assistant/chat`, `GET /observations`, `POST /actions/execute` |

Dev 2 and Dev 3 are unblocked from minute one because the mock layer already returns the real
shapes. Dev 1 swaps the source behind the same interface; no UI changes needed.

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

## Demo path

1. Land on home, sign in
2. Dashboard: three accounts unified, savings rate, spending shape
3. The rail has already noticed eating out is up 31% — no one asked it to
4. Ask the assistant why → it explains with real figures and proposes a £300 cap
5. Approve → the action executes and confirms
6. Transactions → filter to Flagged → the £899 charge and the duplicate Adobe billing

Under four minutes. One person drives, one narrates.

---

## Known limits

Authentication is demo-grade by design — the brief asks for a login page, not an identity
provider. In production this hands off to the bank's own strong customer authentication under
PSD2. Account data is simulated throughout.
