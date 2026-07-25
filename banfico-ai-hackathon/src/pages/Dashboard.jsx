import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import Shell from '../components/Shell.jsx'
import { CashflowChart, SpendByCategory } from '../components/Charts.jsx'
import { TransactionList, DashboardSkeleton } from '../components/Widgets.jsx'
import InsightRail from '../components/InsightRail.jsx'
import { api } from '../api/client.js'
import { gbp, catColor, longDate, shortDate } from '../lib/format.js'

const DAILY_LIMIT = 2500

function ProgressBar({ value }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 via-sky-400 to-cyan-400"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function InfoTile({ label, value, detail }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-navy-900">{value}</p>
      {detail && <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{detail}</p>}
    </div>
  )
}

function CardBalance({ account, balance, userName }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-teal-500 via-sky-500 to-cyan-500 px-6 py-7 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-slate-100/80">My Card</p>
            <p className="mt-2 text-sm font-medium text-slate-100/80">{account.nickname}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-[11px] uppercase tracking-[.24em] text-white/90">
            Active</div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.3em] text-slate-100/80">Balance</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{gbp(balance.available)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[.3em] text-slate-100/80">Exp</p>
            <p className="mt-2 text-base font-semibold tracking-tight">12/28</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-3xl bg-slate-50 p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[.22em] text-slate-400">Card holder</p>
              <p className="mt-2 font-medium text-navy-900">{userName}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">••• 335</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {['Top up', 'Transfer', 'Request', 'History'].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 transition hover:border-teal-400 hover:text-teal-600"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecentActivity({ items }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Recent activity</p>
          <h2 className="mt-1 text-base font-semibold text-navy-900">Latest transactions</h2>
        </div>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 transition hover:text-teal-500"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.transactionId} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-semibold text-white"
                style={{ background: catColor(item.category) }}
              >
                {item.merchant.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy-900">{item.merchant}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.category} · {shortDate(item.bookingDate)}
                </p>
              </div>
              <div className="text-right">
                <p className={`tnum text-sm font-semibold ${item.direction === 'credit' ? 'text-teal-600' : 'text-navy-900'}`}>
                  {item.direction === 'credit' ? `+${gbp(item.amount)}` : `−${gbp(item.amount)}`}
                </p>
                <p className="mt-1 text-[12px] text-slate-400">
                  {item.isAnomaly ? 'Flagged' : 'Completed'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [obs, setObs] = useState([])
  const [obsLoading, setObsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true

    api
      .getDashboard()
      .then((dashboard) => {
        if (alive) setData(dashboard)
      })
      .catch(() => alive && setError('We could not load your accounts. Check the backend is running.'))

    api
      .getObservations()
      .then((o) => alive && setObs(o))
      .catch(() => {})
      .finally(() => alive && setObsLoading(false))

    return () => {
      alive = false
    }
  }, [])

  const selectedTransactions = useMemo(() => {
    if (!data) return []
    return selected ? data.transactions.filter((t) => t.accountId === selected) : data.transactions
  }, [data, selected])

  if (error) {
    return (
      <Shell title="Dashboard">
        <div className="card mx-auto max-w-md p-6 text-center">
          <p className="text-[14px] font-semibold text-navy-900">Nothing to show yet</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-ghost mt-4">
            Try again
          </button>
        </div>
      </Shell>
    )
  }

  if (!data) {
    return (
      <Shell title="Dashboard" subtitle="Loading your accounts">
        <DashboardSkeleton />
      </Shell>
    )
  }

  const { accounts, balances, transactions, insights } = data
  const netWorth = balances.reduce((t, b) => t + b.available, 0)
  const balanceFor = (id) => balances.find((b) => b.accountId === id) || { available: 0 }
  const topCategory = insights.byCategory?.[0]
  const cardAccount = accounts.find((a) => a.type.toLowerCase().includes('card')) || accounts[0]
  const cardBalance = balanceFor(cardAccount.accountId)
  const recentTransactions = selectedTransactions.slice(0, 4)
  const spent = insights.summary.expense
  const limitPct = Math.min(Math.round((spent / DAILY_LIMIT) * 100), 100)

  return (
    <Shell
      title={`Hello, ${data.user?.name || 'Aarav'}`}
      subtitle={`Updated ${longDate(balances[0]?.asOf || new Date().toISOString())}`}
    >
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1.5fr_360px]">
          <div className="space-y-5">
            <div className="card overflow-hidden">
              <div className="bg-[#0b2135] px-6 py-7 text-white sm:px-8 sm:py-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[.22em] text-slate-300">Dashboard overview</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {gbp(netWorth)} available across your accounts
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      Your balances, spending and savings are all shown in one place with the latest insights from Banfico.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoTile label="Income" value={gbp(insights.summary.income)} detail="This month" />
                    <InfoTile label="Expense" value={gbp(insights.summary.expense)} detail="This month" />
                    <InfoTile
                      label="Savings"
                      value={`${insights.summary.savingsRate}%`}
                      detail={`${gbp(insights.summary.net)} left after costs`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <CashflowChart data={insights.byMonth} />
              <SpendByCategory data={insights.byCategory} />
            </div>

            <div className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="eyebrow">Transaction history</p>
                  <h2 className="mt-1 text-base font-semibold text-navy-900">Most recent movements</h2>
                </div>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 transition hover:text-teal-500"
                >
                  View all activity <ArrowRight size={14} />
                </Link>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
                <TransactionList items={selectedTransactions.slice(0, 8)} />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <CardBalance account={cardAccount} balance={cardBalance} userName={data.user?.name || 'Aarav Jain'} />

            <div className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Daily limit</p>
                  <h3 className="mt-2 text-base font-semibold text-navy-900">£{DAILY_LIMIT.toLocaleString()}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] text-slate-500">
                  {limitPct}% used
                </span>
              </div>
              <div className="mt-5 space-y-3">
                <ProgressBar value={limitPct} />
                <p className="text-sm text-slate-500">
                  You’ve spent {gbp(spent)} of your £{DAILY_LIMIT.toLocaleString()} monthly budget so far.
                </p>
              </div>
            </div>

            <RecentActivity items={recentTransactions} />

            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-teal-500/10 p-3 text-teal-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="eyebrow">Insight</p>
                  <p className="mt-1 text-base font-semibold text-navy-900">What the AI suggests</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Your eating out spend is above average this month. The dashboard spots anomalies and gives you clear next steps to save more.
              </p>
            </div>

            <InsightRail observations={obs} loading={obsLoading} />
          </div>
        </div>
      </div>
    </Shell>
  )
}
