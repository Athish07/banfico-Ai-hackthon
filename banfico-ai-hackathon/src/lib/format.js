export const gbp = (n, opts = {}) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? 0 : 2,
  }).format(n ?? 0)

export const signed = (t) => (t.direction === 'credit' ? `+${gbp(t.amount)}` : `\u2212${gbp(t.amount)}`)

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const longDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

// One colour per category, used identically by the donut, the legend and
// the transaction rows. Keeps the eye anchored across the whole dashboard.
export const CATEGORY_COLORS = {
  Housing: '#0B2135',
  Bills: '#16385A',
  Groceries: '#2E7BB8',
  'Eating out': '#17A398',
  Transport: '#22C3AF',
  Shopping: '#E0913A',
  Subscriptions: '#8B9AAB',
  Health: '#0F8A80',
  Home: '#1E4A73',
  Cash: '#CF4F4A',
  Salary: '#17A398',
  Transfers: '#DBE2EA',
}

export const catColor = (c) => CATEGORY_COLORS[c] || '#8B9AAB'
