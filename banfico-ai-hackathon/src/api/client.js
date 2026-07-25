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
//  GET  /api/performance/dashboard
//       -> { accounts, balances, transactions, overview }
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
//  GET  /api/performance/dashboard
//       -> { accounts, balances, transactions, insights }
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

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'

function getToken() {
  return localStorage.getItem('bf.sessionToken') || null
}

async function live(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${options?.method || 'GET'} ${path} failed (${res.status})${text ? `: ${text}` : ''}`)
  }

  return res.json()
}

function mapAccount(account) {
  return {
    ...account,
    type: account.accountType || account.type || 'Account',
    maskedNumber: account.accountNumber?.slice(-4) ? `•••• ${account.accountNumber.slice(-4)}` : '•••• 0000',
  }
}

function mapBalance(balance) {
  return {
    ...balance,
    available: Number(balance.amount ?? balance.available ?? 0),
    current: Number(balance.amount ?? balance.current ?? 0),
    asOf: balance.asOf || new Date().toISOString(),
  }
}

function mapTransaction(tx) {
  const amount = Number(tx.amount ?? 0)
  return {
    ...tx,
    transactionId: tx.transactionId || `${tx.accountId}-${tx.merchant}-${tx.bookedOn}`,
    bookingDate: tx.bookedOn || tx.bookingDate || '',
    amount,
    direction: tx.credit ? 'credit' : 'debit',
    merchant: tx.merchant || tx.description || 'Transaction',
    category: tx.category || 'Other',
    isSubscription: Boolean(tx.isSubscription),
    isAnomaly: Boolean(tx.isAnomaly),
  }
}

function mapInsights(raw) {
  return {
    summary: {
      income: Number(raw?.monthly?.reduce((sum, m) => sum + Number(m.income || 0), 0) || 0),
      expense: Number(raw?.monthly?.reduce((sum, m) => sum + Number(m.expense || 0), 0) || 0),
      net: Number(raw?.monthly?.reduce((sum, m) => sum + Number(m.net || 0), 0) || 0),
      savingsRate: Number(raw?.monthly?.[raw.monthly.length - 1]?.savingsRate ?? 0),
    },
    byMonth: (raw?.monthly || []).map((m) => ({
      month: m.month,
      income: Number(m.income || 0),
      expense: Number(m.expense || 0),
      net: Number(m.net || 0),
      savingsRate: Number(m.savingsRate || 0),
    })),
    byCategory: (raw?.categories || []).map((c) => ({
      category: c.category,
      amount: Number(c.total || 0),
      previous: 0,
      pctChange: Number(c.changeVsPreviousMonth || 0),
    })),
    topMerchants: (raw?.topMerchants || []).map((m) => ({
      merchant: m.merchant,
      total: Number(m.total || 0),
      transactionCount: Number(m.transactionCount || 0),
    })),
    subscriptions: (raw?.subscriptions || []).map((s) => ({
      merchant: s.merchant,
      amount: Number(s.typicalAmount || 0),
      cadence: 'monthly',
      annualised: Number(s.estimatedAnnualCost || 0),
    })),
    anomalies: (raw?.anomalies || []).map((a) => ({
      ...a,
      transaction: mapTransaction(a.transaction),
    })),
  }
}

export const api = {
  async login(username, password) {
    const res = await fetch(`${BASE.replace('/api', '')}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Login failed')
    if (data.sessionToken) localStorage.setItem('bf.sessionToken', data.sessionToken)
    return data
  },

  async getAccounts() {
    const rows = await live('/accounts')
    return rows.map(mapAccount)
  },

  async getBalances() {
    const rows = await live('/balances')
    return rows.map(mapBalance)
  },

  async getTransactions({ accountId } = {}) {
    const path = accountId ? `/accounts/${encodeURIComponent(accountId)}/transactions` : '/transactions'
    const rows = await live(path)
    return rows.map(mapTransaction)
  },

  async getTransactionsPage({ page = 0, pageSize = 50 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    const payload = await live(`/performance/transactions?${params.toString()}`)

    return {
      ...payload,
      transactions: (payload.transactions || []).map(mapTransaction),
    }
  },

  async getInsights() {
    const raw = await live('/insights/overview')
    return mapInsights(raw)
  },

  async getDashboard() {
    const raw = await live('/performance/dashboard')
    return {
      accounts: (raw.accounts || []).map(mapAccount),
      balances: (raw.balances || []).map(mapBalance),
      transactions: (raw.transactions || []).map(mapTransaction),
      insights: mapInsights(raw.insights || raw.overview || {}),
    }
  },

  async getObservations() {
    return live('/observations')
  },

  async chat(messages) {
    return live('/chat', { method: 'POST', body: JSON.stringify({ message: messages.at(-1)?.content || '', history: messages }) })
  },

  async executeAction(action) {
    return live('/chat', { method: 'POST', body: JSON.stringify(action) })
  },
}
