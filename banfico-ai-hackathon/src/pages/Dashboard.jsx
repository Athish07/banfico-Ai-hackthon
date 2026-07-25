import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Shell from '../components/Shell.jsx'
import { CashflowChart, SpendByCategory } from '../components/Charts.jsx'
import { StatCard, AccountTile, TransactionList, DashboardSkeleton } from '../components/Widgets.jsx'
import InsightRail from '../components/InsightRail.jsx'
import { api } from '../api/client.js'
import { gbp, longDate } from '../lib/format.js'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [obs, setObs] = useState([])
  const [obsLoading, setObsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true

    // Core data blocks the page; observations stream in after, so the
    // dashboard is usable before the AI layer has finished thinking.
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
  const balanceFor = (id) => balances.find((b) => b.accountId === id)
  const visible = selected ? transactions.filter((t) => t.accountId === selected) : transactions
  const topCategory = insights.byCategory[0]

  return (
    <Shell
      title={`Good morning, ${'Aarav'}`}
      subtitle={`Everything as of ${longDate(balances[0].asOf)}`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_312px]">
        {/* ── Left: what happened ── */}
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total available"
              value={gbp(netWorth)}
              hint={`Across ${accounts.length} accounts`}
            />
            <StatCard
              label="Money in, July"
              value={gbp(insights.summary.income)}
              hint="Salary and transfers received"
              tone="good"
            />
            <StatCard
              label="Money out, July"
              value={gbp(insights.summary.expense)}
              hint={`${topCategory.category} is your largest at ${gbp(topCategory.amount)}`}
            />
            <StatCard
              label="Kept this month"
              value={`${insights.summary.savingsRate}%`}
              hint={`${gbp(insights.summary.net)} left after everything cleared`}
              tone={insights.summary.savingsRate < 10 ? 'warn' : 'good'}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {accounts.map((a) => (
              <AccountTile
                key={a.accountId}
                account={a}
                balance={balanceFor(a.accountId)}
                active={selected === a.accountId}
                onClick={() => setSelected(selected === a.accountId ? null : a.accountId)}
              />
            ))}
          </div>

          <CashflowChart data={insights.byMonth} />

          <div className="grid gap-5 lg:grid-cols-2">
            <SpendByCategory data={insights.byCategory} />

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 pb-3 pt-5">
                <div>
                  <p className="eyebrow">Latest activity</p>
                  <h2 className="mt-1 font-display text-base font-semibold text-navy-900">
                    {selected ? accounts.find((a) => a.accountId === selected).nickname : 'All accounts'}
                  </h2>
                </div>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-teal-600 hover:text-teal-500"
                >
                  See all <ArrowRight size={14} />
                </Link>
              </div>
              <TransactionList items={visible.slice(0, 8)} />
            </div>
          </div>
        </div>

        {/* ── Right: what to do about it ── */}
        <InsightRail observations={obs} loading={obsLoading} />
      </div>
    </Shell>
  )
}
