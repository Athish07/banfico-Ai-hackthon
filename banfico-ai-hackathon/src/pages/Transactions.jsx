import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import Shell from '../components/Shell.jsx'
import { TransactionList, Skeleton } from '../components/Widgets.jsx'
import { api } from '../api/client.js'
import { gbp } from '../lib/format.js'

export default function Transactions() {
  const [rows, setRows] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [q, setQ] = useState('')
  const [account, setAccount] = useState('all')
  const [only, setOnly] = useState('all') // all | flagged | recurring

  useEffect(() => {
    Promise.all([api.getTransactions(), api.getAccounts()]).then(([t, a]) => {
      setRows(t)
      setAccounts(a)
    })
  }, [])

  const filtered = useMemo(() => {
    if (!rows) return []
    const term = q.trim().toLowerCase()
    return rows.filter((t) => {
      if (account !== 'all' && t.accountId !== account) return false
      if (only === 'flagged' && !t.isAnomaly) return false
      if (only === 'recurring' && !t.isSubscription) return false
      if (!term) return true
      return (
        t.merchant.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      )
    })
  }, [rows, q, account, only])

  const outgoing = filtered
    .filter((t) => t.direction === 'debit')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <Shell title="Transactions" subtitle="Six months across every connected account">
      <div className="card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-9"
            placeholder="Search merchant, category or reference"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select className="field w-auto" value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.accountId} value={a.accountId}>
              {a.nickname}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1">
          {[
            ['all', 'Everything'],
            ['flagged', 'Flagged'],
            ['recurring', 'Recurring'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setOnly(k)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition ${
                only === k ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!rows ? (
        <Skeleton className="h-[520px]" />
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <p className="text-[13px] text-slate-500">
              <span className="tnum font-semibold text-navy-900">{filtered.length}</span> transactions ·{' '}
              <span className="tnum font-semibold text-navy-900">{gbp(outgoing)}</span> out
            </p>
          </div>
          <TransactionList items={filtered} emptyHint="Try clearing the search or switching filters." />
        </div>
      )}
    </Shell>
  )
}
