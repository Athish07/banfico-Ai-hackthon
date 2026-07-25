// ═══════════════════════════════════════════════════════════════
// THE CONTRACT
//
// This file is the agreement between the three of us. Dev 1 makes the
// backend return these shapes; Dev 2 renders them; Dev 3's tools consume
// them. Change it only by talking to the other two.
//
//  GET  /api/accounts
//       -> [{ accountId, nickname, type, bank, currency, maskedNumber, iban }]
//
//  GET  /api/balances
//       -> [{ accountId, currency, available, current, asOf }]
//
//  GET  /api/transactions?accountId=&from=&to=
//       -> [{ transactionId, accountId, bookingDate, amount, currency,
//             direction: 'credit'|'debit', merchant, description,
//             category, isSubscription, isAnomaly, anomalyReason? }]
//       NOTE: amount is always POSITIVE. `direction` carries the sign.
//
//  GET  /api/insights
//       -> { period, summary: { income, expense, net, savingsRate },
//            byCategory: [{ category, amount, previous, pctChange }],
//            byMonth:    [{ month, label, income, expense }],
//            subscriptions: [{ merchant, amount, cadence, annualised }],
//            anomalies:  [ transaction ] }
//
//  GET  /api/observations
//       -> [{ id, severity: 'good'|'info'|'alert'|'danger',
//             title, body, action: { type, label, payload } | null }]
//
//  POST /api/assistant/chat   { messages: [{ role, content }] }
//       -> { reply, proposedAction: { type, label, payload } | null }
//
//  POST /api/actions/execute  { type, payload }
//       -> { ok, message }
// ═══════════════════════════════════════════════════════════════

import * as mock from '../data/mock.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE = import.meta.env.VITE_API_BASE || '/api'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function live(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`${options?.method || 'GET'} ${path} failed (${res.status})`)
  return res.json()
}

export const api = {
  async getAccounts() {
    if (USE_MOCK) return sleep(320).then(() => mock.accounts)
    return live('/accounts')
  },

  async getBalances() {
    if (USE_MOCK) return sleep(380).then(() => mock.balances)
    return live('/balances')
  },

  async getTransactions({ accountId } = {}) {
    if (USE_MOCK) {
      await sleep(440)
      return accountId ? mock.transactions.filter((t) => t.accountId === accountId) : mock.transactions
    }
    const qs = accountId ? `?accountId=${encodeURIComponent(accountId)}` : ''
    return live(`/transactions${qs}`)
  },

  async getInsights() {
    if (USE_MOCK) return sleep(500).then(() => mock.insights)
    return live('/insights')
  },

  async getObservations() {
    if (USE_MOCK) return sleep(620).then(() => mock.observations)
    return live('/observations')
  },

  // Dev 3 owns the real implementation. The canned replies below keep the
  // chat demoable from hour one — delete them once the agent is wired up.
  async chat(messages) {
    if (USE_MOCK) {
      await sleep(900)
      return mockReply(messages.at(-1)?.content || '')
    }
    return live('/assistant/chat', { method: 'POST', body: JSON.stringify({ messages }) })
  },

  async executeAction(action) {
    if (USE_MOCK) {
      await sleep(700)
      return { ok: true, message: `${action.label} — done.` }
    }
    return live('/actions/execute', { method: 'POST', body: JSON.stringify(action) })
  },
}

function mockReply(q) {
  const t = q.toLowerCase()
  if (t.includes('food') || t.includes('eating') || t.includes('takeaway')) {
    return {
      reply:
        'Eating out came to £428 this month across 22 purchases — 31% above your six-month average of £327. Deliveroo is the biggest single driver at £141 over four orders. Capping this category at £300 would put you back in line without touching your grocery spend.',
      proposedAction: {
        type: 'CREATE_BUDGET',
        label: 'Cap eating out at £300',
        payload: { category: 'Eating out', limit: 300 },
      },
    }
  }
  if (t.includes('save') || t.includes('saving')) {
    return {
      reply:
        'You have finished five of the last six months in surplus, averaging £340 spare after everything cleared. Your standing order is currently £200. Raising it to £340 still leaves your current account above its lowest point this year.',
      proposedAction: {
        type: 'CREATE_TRANSFER',
        label: 'Increase savings order to £340',
        payload: { from: 'ACC-1001', to: 'ACC-1002', amount: 340, cadence: 'monthly' },
      },
    }
  }
  if (t.includes('subscription') || t.includes('recurring')) {
    return {
      reply:
        'Six recurring charges total £84.93 a month, or £1,019 a year. Adobe Creative Cloud billed twice in June — that duplicate £19.97 is usually refundable. Guardian Digital shows no matching activity in your card history.',
      proposedAction: {
        type: 'DRAFT_DISPUTE',
        label: 'Draft a refund request to Adobe',
        payload: { amount: 19.97 },
      },
    }
  }
  if (t.includes('unusual') || t.includes('fraud') || t.includes('strange')) {
    return {
      reply:
        'Three things stand out. TechnoWorld Online took £899 on 11 July — about 17 times your typical Shopping transaction, from a merchant with no prior history. A Lisbon ATM withdrawal on 19 July carried a 2.75% non-sterling fee. And Adobe double-billed in June.',
      proposedAction: null,
    }
  }
  return {
    reply:
      'This is the mock assistant — Dev 3 replaces it with the real agent. Try asking about your food spending, subscriptions, savings capacity, or anything unusual.',
    proposedAction: null,
  }
}
