# MoneySense — financial insight from Open Banking data

Built for the **Banfico AI Hackathon 2026** on Banfico's Open Banking (AIS) APIs.

Most banking apps show you numbers. MoneySense explains what they mean.

It aggregates fragmented account data into one clear picture, then surfaces the patterns you'd
never spot yourself — a category creeping up, a subscription you've forgotten, a charge that
doesn't fit your history. Every finding comes with the reasoning that produced it, in plain
language, so the decision stays yours. The goal isn't to manage your money for you. It's to make
you better at managing it.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5, Tailwind CSS, Recharts, React Router |
| Backend | Java 21 + Spring Boot 3.3, `RestClient`, Maven |
| Banking data | Banfico OBIE AISP v4.0 sandbox, Keycloak OAuth2 |

This repository is the **frontend**. The backend lives in `moneysense-backend/`.

---

## Run it

Two processes. Start the backend first.

**Backend** — `:8080`

```bash
cd moneysense-backend
export BANFICO_USERNAME='...'      # sandbox credentials from the organizers
export BANFICO_PASSWORD='...'
./mvnw spring-boot:run
```

Once only, to populate the sandbox with history:

```bash
curl -X POST http://localhost:8080/api/accounts         # if you have no account yet
curl -X POST "http://localhost:8080/api/seed?months=6"
```

**Frontend** — `:5173`

```bash
npm install
cp .env.example .env
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React + Vite  ·  :5173                                     │
│  Home · Login · Dashboard · Transactions                     │
└───────────────────────────┬─────────────────────────────────┘
                            │  the JSON contract
                            │  documented in src/api/client.js
              ┌─────────────┴──────────────┐
              │                            │
   ┌──────────▼──────────┐    ┌────────────▼─────────────────┐
   │  Mock layer         │    │  Spring Boot  ·  :8080       │
   │  src/data/mock.js   │    │                              │
   │  VITE_USE_MOCK=true │    │  TokenService     Keycloak   │
   │  6 months seeded    │    │  BankClient       OBIE calls │
   └─────────────────────┘    │  Categoriser      MCC → cat  │
                              │  ObieMapper       normalise  │
                              │  InsightService   aggregate  │
                              │  AnomalyDetector  flag       │
                              └──────────────┬───────────────┘
                                             │
                              ┌──────────────▼───────────────┐
                              │  Banfico OBIE AISP v4.0      │
                              │  Accounts · Balances ·        │
                              │  Transactions                 │
                              └──────────────────────────────┘
```

The browser never touches the Banfico APIs. Spring Boot holds the OAuth2 credentials, normalises
OBIE responses into flat records, and computes every figure the dashboard displays.

Every number in this app is derived deterministically from the transaction data. Nothing is
estimated, and the same input always produces the same output — so any finding can be traced back
to the specific transactions that caused it.

---

## The contract

All request and response shapes are documented at the top of **`src/api/client.js`**. That file is
the single agreement between the three workstreams. The rule that matters most:
`amount` is always positive, and `direction` (`credit` / `debit`) carries the sign — OBIE signs
money with an indicator field, not a minus.

| Endpoint | Returns |
|---|---|
| `GET /api/accounts` | normalised account list |
| `GET /api/balances` | one available balance per account |
| `GET /api/transactions?accountId=` | categorised, flagged, newest first |
| `GET /api/insights` | summary, category slices, six-month trend, recurring charges, flagged items |
| `GET /api/observations` | the findings that matter most, each with its reasoning |
| `POST /api/seed?months=6` | seeds realistic history — run once before demoing |

---

## Who owns what

| | Owns | Where |
|---|---|---|
| **Dev 1 — Data** | Banfico API client, token handling, seeder, OBIE normalisation | `io.moneysense.bank`, `.map`, `.seed` |
| **Dev 2 — Experience** | Login, home, dashboard, charts, responsiveness | `src/pages/`, `src/components/` |
| **Dev 3 — Insight** | Categorisation rules, aggregation, anomaly and subscription detection, observation wording | `io.moneysense.insight`, `.map.Categoriser` |

Dev 2 and Dev 3 were unblocked from minute one because the mock layer already returned the real
shapes. Dev 1 swapped the source behind the same interface with no UI changes.

---

## Design

Theme derived from Banfico's own identity — deep navy (`#0B2135`) with the teal crescent accent
(`#17A398`) from their mark, plus the mid-blue (`#2E7BB8`) used in their documents. Every token
lives in **`tailwind.config.js`**, so it changes in one place.

Type: Sora for display, Inter for UI, IBM Plex Mono for account numbers. All monetary figures use
tabular numerals, so nothing jitters as values update.

The signature element is the **insight rail** on the right of the dashboard. The layout encodes
the product thesis: the left half is what happened, the right half is what it means.

Quality floor: responsive to mobile, visible keyboard focus, reduced motion respected, real empty
and loading states rather than spinners.

---

## How the insights are computed

**Categorisation.** OBIE transactions have no category field, so every category insight is
derived. `Categoriser` reads `MerchantDetails.MerchantCategoryCode` — an ISO 18245 code the payment
network already assigned to the merchant — then falls back to merchant-name rules, then to `Other`.
Using a code the network already provides is both more accurate and far cheaper than inferring one
from the description string.

**Recurring charges.** A merchant taking a near-identical amount (within 5%) across three or more
distinct months. The tolerance matters: subscription prices drift, and strict equality misses
renewals.

**Unusual spending.** Three rules, each catching a different kind of surprise, and each producing a
sentence a person can read:

- an amount that is a statistical outlier within its own category
- a large payment to a merchant with no prior history
- the same merchant charging the same amount twice inside ten days

Outlier detection uses **median absolute deviation, not standard deviation**. A single £899 charge
inflates the mean and SD enough to hide itself; the median doesn't move, so the outlier stays an
outlier.

**Financial health.** Savings rate, month-on-month headroom, and total recurring load as a share of
income — the three figures that say most about whether a month went well.

---

## Mapping to the brief

**Core requirements**

- Portal with home and login page — `pages/Home.jsx`, `pages/Login.jsx`
- Account information, balances, transaction history — aggregated on the dashboard
- Unified dashboard view — all accounts in one picture, tap any tile to filter
- Spending summaries, monthly analysis, category breakdown — `components/Charts.jsx`
- Income vs expense trend — six-month composed chart with a net line
- Unusual spending detection — flagged transactions in the rail, filterable in Transactions
- Financial health observations — savings rate, headroom, recurring load

**Bonus features**

Subscription detection · anomaly detection · multi-account analytics · personalised dashboard ·
category budget guidance

---

## Demo path

1. Land on home, sign in
2. Dashboard: three accounts unified, savings rate, the shape of the month
3. The rail has already noticed eating out is up 31% — nobody asked it to
4. Tap through to the 22 purchases behind that figure, and the merchants driving it
5. Transactions → filter to Flagged → the £899 charge from an unseen merchant, and the duplicate
   Adobe billing the user can reclaim

Under four minutes. One person drives, one narrates.

---

## Scope and known limits

**We don't act on the user's behalf.** MoneySense explains; it never moves money, sets a budget, or
cancels a subscription for you. That is a design decision, not a missing feature. Executing
financial actions on a customer's behalf crosses from guidance into regulated advice, with
suitability obligations attached — so we kept the human as the decision-maker. It also reflects the
API surface honestly: the provided collection is AISP only (Account Information). There is no
Payment Initiation endpoint, so no real money can move.

**Authentication is demo-grade by design.** The brief asks for a login page, not an identity
provider. In production this hands off to the bank's own strong customer authentication under PSD2.

**Account data is simulated** throughout, seeded into the Banfico sandbox by `SeederService`. The
sample transaction request in the provided Postman collection timestamps everything to the moment
of creation and hardcodes the credit indicator, merchant name and category code — which flattens
every chart into a single bar and a single category — so the seeder sets those explicitly to
produce a realistic six-month history.
