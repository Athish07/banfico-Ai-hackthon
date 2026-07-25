import { AlertTriangle, Repeat } from 'lucide-react'
import { gbp, signed, shortDate, catColor } from '../lib/format.js'

// ── Headline figure ─────────────────────────────────────────────
export function StatCard({ label, value, hint, tone = 'neutral' }) {
  const toneRing = {
    neutral: 'border-slate-100',
    good: 'border-teal-100',
    warn: 'border-alert/25',
  }[tone]

  return (
    <div className={`card border ${toneRing} p-4`}>
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-2 font-display text-[22px] font-semibold leading-none text-navy-900">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">{hint}</p>}
    </div>
  )
}

// ── Account tile ────────────────────────────────────────────────
export function AccountTile({ account, balance, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card w-full p-4 text-left transition hover:shadow-rail ${
        active ? 'ring-2 ring-teal-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-navy-900">{account.nickname}</p>
          <p className="mono mt-0.5 font-mono text-[11.5px] text-slate-400">
            {account.maskedNumber}
          </p>
        </div>
        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-slate-500">
          {account.type.replace('Account', '').replace('Card', ' card')}
        </span>
      </div>
      <p className="tnum mt-3 font-display text-lg font-semibold text-navy-900">
        {gbp(balance?.available)}
      </p>
    </button>
  )
}

// ── Transaction list ────────────────────────────────────────────
export function TransactionList({ items, dense = false, emptyHint }) {
  if (!items.length) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-navy-800">No transactions in this view</p>
        <p className="mt-1 text-[13px] text-slate-500">{emptyHint || 'Widen the date range or pick another account.'}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((t) => (
        <li key={t.transactionId} className="flex items-center gap-3 px-4 py-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
            style={{ background: catColor(t.category) }}
            aria-hidden="true"
          >
            {t.merchant.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium text-navy-900">
              {t.merchant}
              {t.isSubscription && <Repeat size={12} className="shrink-0 text-slate-400" title="Recurring" />}
              {t.isAnomaly && <AlertTriangle size={12} className="shrink-0 text-alert" title="Flagged" />}
            </p>
            {!dense && (
              <p className="truncate text-[12px] text-slate-400">
                {t.category} · {shortDate(t.bookingDate)}
              </p>
            )}
          </div>

          <span
            className={`tnum shrink-0 text-[13.5px] font-semibold ${
              t.direction === 'credit' ? 'text-teal-600' : 'text-navy-800'
            }`}
          >
            {signed(t)}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ── Loading placeholder. Never show a spinner where a shape will do. ──
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulseDot rounded-lg bg-slate-100 ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[330px]" />
        <Skeleton className="h-[330px]" />
      </div>
    </div>
  )
}
