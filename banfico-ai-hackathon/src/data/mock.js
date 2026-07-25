// ─────────────────────────────────────────────────────────────
// MOCK DATA LAYER
//
// Everything here matches the JSON contract in api/client.js exactly.
// Dev 1 replaces the *source* (mock -> live API); nothing in the UI changes.
//
// Deterministic seed => the demo looks identical every rehearsal.
// ─────────────────────────────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260725)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const between = (lo, hi) => lo + rnd() * (hi - lo)

export const accounts = [
  {
    accountId: 'ACC-1001',
    nickname: 'Everyday Current',
    type: 'CurrentAccount',
    bank: 'Banfico Bank',
    currency: 'GBP',
    maskedNumber: '•••• 4417',
    iban: 'GB29 BFCO 6016 1331 9268 19',
  },
  {
    accountId: 'ACC-1002',
    nickname: 'Rainy Day Savings',
    type: 'SavingsAccount',
    bank: 'Banfico Bank',
    currency: 'GBP',
    maskedNumber: '•••• 8802',
    iban: 'GB33 BFCO 6016 1331 9268 44',
  },
  {
    accountId: 'ACC-1003',
    nickname: 'Travel Card',
    type: 'PrepaidCard',
    bank: 'Banfico Bank',
    currency: 'GBP',
    maskedNumber: '•••• 2290',
    iban: 'GB71 BFCO 6016 1331 9268 77',
  },
]

export const balances = [
  { accountId: 'ACC-1001', currency: 'GBP', available: 2418.63, current: 2418.63, asOf: '2026-07-25T08:10:00Z' },
  { accountId: 'ACC-1002', currency: 'GBP', available: 9140.0, current: 9140.0, asOf: '2026-07-25T08:10:00Z' },
  { accountId: 'ACC-1003', currency: 'GBP', available: 312.45, current: 312.45, asOf: '2026-07-25T08:10:00Z' },
]

// merchant -> [category, minAmount, maxAmount, timesPerMonth]
const PATTERNS = [
  ['Tesco Express', 'Groceries', 12, 48, 6],
  ['Sainsbury\u2019s', 'Groceries', 22, 70, 2],
  ['Pret A Manger', 'Eating out', 5, 14, 5],
  ['Deliveroo', 'Eating out', 16, 42, 4],
  ['The Mason Arms', 'Eating out', 24, 62, 2],
  ['TfL Travel', 'Transport', 3, 9, 12],
  ['Uber', 'Transport', 8, 26, 3],
  ['Shell', 'Transport', 40, 75, 1],
  ['Boots', 'Health', 6, 30, 1],
  ['Zara', 'Shopping', 25, 90, 1],
  ['Amazon', 'Shopping', 9, 65, 4],
  ['John Lewis', 'Home', 18, 120, 1],
]

const SUBSCRIPTIONS = [
  ['Netflix', 'Subscriptions', 12.99],
  ['Spotify', 'Subscriptions', 11.99],
  ['iCloud+', 'Subscriptions', 2.99],
  ['PureGym', 'Health', 24.99],
  ['Guardian Digital', 'Subscriptions', 12.0],
  ['Adobe Creative Cloud', 'Subscriptions', 19.97],
]

const BILLS = [
  ['Thames Water', 'Bills', 32.4],
  ['Octopus Energy', 'Bills', 88.5],
  ['Vodafone UK', 'Bills', 21.0],
  ['Hackney Council Tax', 'Bills', 142.0],
  ['Landlord \u2014 Rent', 'Housing', 1250.0],
]

const MONTHS = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07']

function iso(month, day) {
  return `${month}-${String(day).padStart(2, '0')}`
}

let seq = 0
const tx = (o) => ({
  transactionId: `TX-${String(++seq).padStart(5, '0')}`,
  currency: 'GBP',
  isSubscription: false,
  isAnomaly: false,
  ...o,
})

function buildTransactions() {
  const out = []

  MONTHS.forEach((month, mi) => {
    const lastDay = month === '2026-07' ? 24 : 28
    // Growth factor: spending creeps up over the six months. Gives the
    // AI something true to observe rather than noise.
    const drift = 1 + mi * 0.045

    // Salary
    out.push(
      tx({
        accountId: 'ACC-1001',
        bookingDate: iso(month, 28 > lastDay ? lastDay : 25),
        amount: 3180.0,
        direction: 'credit',
        merchant: 'Northgate Analytics Ltd',
        description: 'SALARY JUL26',
        category: 'Salary',
      }),
    )

    // Standing transfer to savings
    out.push(
      tx({
        accountId: 'ACC-1002',
        bookingDate: iso(month, 2),
        amount: 200.0,
        direction: 'credit',
        merchant: 'Transfer from Everyday Current',
        description: 'STANDING ORDER SAVINGS',
        category: 'Transfers',
      }),
    )

    BILLS.forEach(([merchant, category, amt], i) => {
      out.push(
        tx({
          accountId: 'ACC-1001',
          bookingDate: iso(month, 1 + i * 2),
          amount: +(amt * between(0.96, 1.08)).toFixed(2),
          direction: 'debit',
          merchant,
          description: `DIRECT DEBIT ${merchant.toUpperCase()}`,
          category,
        }),
      )
    })

    SUBSCRIPTIONS.forEach(([merchant, category, amt], i) => {
      out.push(
        tx({
          accountId: 'ACC-1001',
          bookingDate: iso(month, 4 + i * 3),
          amount: amt,
          direction: 'debit',
          merchant,
          description: `CARD PAYMENT ${merchant.toUpperCase()}`,
          category,
          isSubscription: true,
        }),
      )
    })

    PATTERNS.forEach(([merchant, category, lo, hi, perMonth]) => {
      const n = Math.max(1, Math.round(perMonth * between(0.7, 1.3)))
      for (let i = 0; i < n; i++) {
        out.push(
          tx({
            accountId: rnd() > 0.86 ? 'ACC-1003' : 'ACC-1001',
            bookingDate: iso(month, 1 + Math.floor(rnd() * lastDay)),
            amount: +(between(lo, hi) * drift).toFixed(2),
            direction: 'debit',
            merchant,
            description: `CARD PAYMENT ${merchant.toUpperCase()}`,
            category,
          }),
        )
      }
    })
  })

  // ── Planted anomalies. These are the moments you point at on stage. ──
  out.push(
    tx({
      accountId: 'ACC-1001',
      bookingDate: '2026-07-11',
      amount: 899.0,
      direction: 'debit',
      merchant: 'TechnoWorld Online',
      description: 'CARD PAYMENT TECHNOWORLD',
      category: 'Shopping',
      isAnomaly: true,
      anomalyReason: '17x your typical Shopping transaction, and a merchant you have never paid before.',
    }),
    tx({
      accountId: 'ACC-1003',
      bookingDate: '2026-07-19',
      amount: 64.2,
      direction: 'debit',
      merchant: 'Unknown ATM \u2014 Lisbon',
      description: 'ATM WITHDRAWAL PT',
      category: 'Cash',
      isAnomaly: true,
      anomalyReason: 'First foreign withdrawal in six months, charged a 2.75% non-sterling fee.',
    }),
    tx({
      accountId: 'ACC-1001',
      bookingDate: '2026-06-14',
      amount: 19.97,
      direction: 'debit',
      merchant: 'Adobe Creative Cloud',
      description: 'CARD PAYMENT ADOBE \u2014 DUPLICATE',
      category: 'Subscriptions',
      isSubscription: true,
      isAnomaly: true,
      anomalyReason: 'Charged twice in June. Looks like a duplicate billing you can reclaim.',
    }),
  )

  return out.sort((a, b) => (a.bookingDate < b.bookingDate ? 1 : -1))
}

export const transactions = buildTransactions()

// ─── Derived analytics. Mirrors what Dev 1's /api/insights returns. ───

const sum = (rows) => rows.reduce((t, r) => t + r.amount, 0)
const debits = transactions.filter((t) => t.direction === 'debit' && t.category !== 'Transfers')
const credits = transactions.filter((t) => t.direction === 'credit' && t.category !== 'Transfers')
const inMonth = (rows, m) => rows.filter((r) => r.bookingDate.startsWith(m))

const CURRENT = '2026-07'
const PREVIOUS = '2026-06'

function categoryBreakdown(month) {
  const map = {}
  inMonth(debits, month).forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })
  return map
}

const thisMonth = categoryBreakdown(CURRENT)
const lastMonth = categoryBreakdown(PREVIOUS)

export const insights = {
  period: CURRENT,
  summary: {
    income: +sum(inMonth(credits, CURRENT)).toFixed(2),
    expense: +sum(inMonth(debits, CURRENT)).toFixed(2),
    get net() {
      return +(this.income - this.expense).toFixed(2)
    },
    savingsRate: null, // filled below
  },
  byCategory: Object.entries(thisMonth)
    .map(([category, amount]) => ({
      category,
      amount: +amount.toFixed(2),
      previous: +(lastMonth[category] || 0).toFixed(2),
      pctChange: lastMonth[category]
        ? +(((amount - lastMonth[category]) / lastMonth[category]) * 100).toFixed(1)
        : null,
    }))
    .sort((a, b) => b.amount - a.amount),
  byMonth: MONTHS.map((m) => ({
    month: m,
    label: new Date(`${m}-01`).toLocaleString('en-GB', { month: 'short' }),
    income: +sum(inMonth(credits, m)).toFixed(2),
    expense: +sum(inMonth(debits, m)).toFixed(2),
  })),
  subscriptions: SUBSCRIPTIONS.map(([merchant, , amount]) => ({
    merchant,
    amount,
    cadence: 'monthly',
    annualised: +(amount * 12).toFixed(2),
  })),
  anomalies: transactions.filter((t) => t.isAnomaly),
}

insights.summary.savingsRate = +(
  ((insights.summary.income - insights.summary.expense) / insights.summary.income) *
  100
).toFixed(1)

// ─── Proactive AI observations. Dev 3 will generate these for real; ───
// ─── the shape stays identical so the UI never has to change.       ───

export const observations = [
  {
    id: 'obs-1',
    severity: 'alert',
    title: 'Eating out is up 31% this month',
    body:
      'You have spent \u00a3428 across 22 food purchases, against a six-month average of \u00a3327. Deliveroo alone accounts for \u00a3141.',
    action: {
      type: 'CREATE_BUDGET',
      label: 'Cap eating out at \u00a3300',
      payload: { category: 'Eating out', limit: 300 },
    },
  },
  {
    id: 'obs-2',
    severity: 'danger',
    title: 'Adobe billed you twice in June',
    body:
      'Two identical \u00a319.97 charges eight days apart. Duplicate subscription charges are usually refundable on request.',
    action: {
      type: 'DRAFT_DISPUTE',
      label: 'Draft a refund request',
      payload: { transactionId: 'adobe-duplicate', amount: 19.97 },
    },
  },
  {
    id: 'obs-3',
    severity: 'good',
    title: 'You can afford \u00a3140 more a month into savings',
    body:
      'Your income has covered outgoings in five of the last six months with \u00a3340 average headroom. Moving \u00a3140 leaves a comfortable buffer.',
    action: {
      type: 'CREATE_TRANSFER',
      label: 'Increase savings order to \u00a3340',
      payload: { from: 'ACC-1001', to: 'ACC-1002', amount: 340, cadence: 'monthly' },
    },
  },
  {
    id: 'obs-4',
    severity: 'info',
    title: '\u00a385/month sits in subscriptions',
    body:
      'Six recurring services, \u00a31,019 a year. Guardian Digital and Adobe have not been used in your recent card activity.',
    action: null,
  },
]
