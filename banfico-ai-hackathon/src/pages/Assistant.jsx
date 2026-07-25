import { useEffect, useState } from 'react'
import Shell from '../components/Shell.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import { api } from '../api/client.js'
import { gbp } from '../lib/format.js'

export default function Assistant() {
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    api.getInsights().then(setInsights).catch(() => {})
  }, [])

  return (
    <Shell title="Assistant" subtitle="It can read your accounts and act on them with your approval">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <ChatPanel />

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow">What it can see</p>
            <ul className="mt-3 space-y-2 text-[13px] text-slate-600">
              <li>Account details and live balances</li>
              <li>Six months of categorised transactions</li>
              <li>Recurring charges and flagged activity</li>
            </ul>
          </div>

          <div className="card p-5">
            <p className="eyebrow">What it can do</p>
            <ul className="mt-3 space-y-2 text-[13px] text-slate-600">
              <li>Set a category budget</li>
              <li>Create or change a savings transfer</li>
              <li>Draft a refund or dispute request</li>
              <li>Open a savings goal</li>
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
              Nothing is executed without your explicit approval on the suggestion card.
            </p>
          </div>

          {insights && (
            <div className="card p-5">
              <p className="eyebrow">Recurring spend</p>
              <p className="tnum mt-2 font-display text-lg font-semibold text-navy-900">
                {gbp(insights.subscriptions.reduce((s, x) => s + x.amount, 0))}
                <span className="text-[13px] font-normal text-slate-400"> / month</span>
              </p>
              <ul className="mt-3 space-y-1.5 text-[12.5px]">
                {insights.subscriptions.map((s) => (
                  <li key={s.merchant} className="flex justify-between text-slate-600">
                    <span className="truncate">{s.merchant}</span>
                    <span className="tnum ml-2 font-medium text-navy-800">{gbp(s.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  )
}
