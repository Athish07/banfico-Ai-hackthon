import { useState } from 'react'
import { TrendingUp, Info, AlertTriangle, ShieldAlert, Check, Loader2 } from 'lucide-react'
import { api } from '../api/client.js'

// ═══════════════════════════════════════════════════════════════
// THE SIGNATURE ELEMENT.
//
// Every other team will build a dashboard that tells you what happened.
// This rail is the half that tells you what to do about it — and then
// does it. Insight -> recommendation -> executed action, in one card.
// Protect this in the experience above everything else.
// ═══════════════════════════════════════════════════════════════

const SEVERITY = {
  good: { icon: TrendingUp, ring: 'border-l-teal-500', tint: 'text-teal-600' },
  info: { icon: Info, ring: 'border-l-brandblue-500', tint: 'text-brandblue-500' },
  alert: { icon: AlertTriangle, ring: 'border-l-alert', tint: 'text-alert' },
  danger: { icon: ShieldAlert, ring: 'border-l-danger', tint: 'text-danger' },
}

function ObservationCard({ obs }) {
  const [state, setState] = useState('idle') // idle | running | done | failed
  const [message, setMessage] = useState('')
  const { icon: Icon, ring, tint } = SEVERITY[obs.severity] || SEVERITY.info

  async function run() {
    setState('running')
    try {
      const res = await api.executeAction(obs.action)
      setMessage(res.message)
      setState('done')
    } catch (e) {
      setMessage('That did not go through. Try again in a moment.')
      setState('failed')
    }
  }

  return (
    <article className={`card animate-rise border-l-[3px] p-4 ${ring}`}>
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`mt-0.5 shrink-0 ${tint}`} />
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-semibold leading-snug text-navy-900">{obs.title}</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{obs.body}</p>
        </div>
      </div>

      {obs.action && state !== 'done' && (
        <button
          onClick={run}
          disabled={state === 'running'}
          className="btn-primary mt-3.5 w-full py-2 text-[13px]"
        >
          {state === 'running' ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Working on it
            </>
          ) : (
            obs.action.label
          )}
        </button>
      )}

      {state === 'done' && (
        <p className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-teal-100 px-3 py-2 text-[12.5px] font-medium text-teal-600">
          <Check size={14} /> {message}
        </p>
      )}
      {state === 'failed' && (
        <p className="mt-3.5 rounded-lg bg-danger/10 px-3 py-2 text-[12.5px] font-medium text-danger">
          {message}
        </p>
      )}
    </article>
  )
}

export default function InsightRail({ observations, loading }) {
  return (
    <aside className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulseDot rounded-full bg-teal-400" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
        </span>
        <p className="eyebrow">What we noticed</p>
      </div>

      {loading &&
        [0, 1, 2].map((i) => (
          <div key={i} className="card animate-pulseDot h-[132px] border-l-[3px] border-l-slate-200" />
        ))}

      {!loading && observations.length === 0 && (
        <div className="card p-5">
          <p className="text-[13.5px] font-semibold text-navy-900">Nothing needs your attention</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
            Your spending is tracking its usual pattern. We will flag anything that moves.
          </p>
        </div>
      )}

      {!loading && observations.map((obs) => <ObservationCard key={obs.id} obs={obs} />)}
    </aside>
  )
}
