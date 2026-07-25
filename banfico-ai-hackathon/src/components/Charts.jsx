import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from 'recharts'
import { gbp, catColor } from '../lib/format.js'

function TooltipShell({ children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-card">
      {children}
    </div>
  )
}

// ── Income vs expense, six months ──────────────────────────────
export function CashflowChart({ data }) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="eyebrow">Six-month view</p>
          <h2 className="mt-1 font-display text-base font-semibold text-navy-900">
            Income against spending
          </h2>
        </div>
        <p className="text-[13px] text-slate-500">Net line shows what you kept</p>
      </div>

      <div className="mt-5 h-[248px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
            <CartesianGrid stroke="#EBEFF4" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8B9AAB', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8B9AAB', fontSize: 12 }}
              tickFormatter={(v) => `£${Math.round(v / 1000)}k`}
            />
            <Tooltip
              cursor={{ fill: '#F5F7FA' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipShell>
                    <p className="mb-1 font-semibold text-navy-900">{label}</p>
                    {payload.map((p) => (
                      <p key={p.name} className="tnum text-slate-500">
                        <span style={{ color: p.color }}>■</span> {p.name}: {gbp(p.value)}
                      </p>
                    ))}
                  </TooltipShell>
                ) : null
              }
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#5A6B7C', paddingTop: 8 }}
            />
            <Bar dataKey="income" name="Money in" fill="#17A398" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="expense" name="Money out" fill="#16385A" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Line
              type="monotone"
              dataKey={(d) => d.income - d.expense}
              name="Net"
              stroke="#E0913A"
              strokeWidth={2}
              dot={{ r: 3, fill: '#E0913A' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Category donut with a real legend, not a floating key ───────
export function SpendByCategory({ data }) {
  const total = data.reduce((t, d) => t + d.amount, 0)
  const top = data.slice(0, 7)

  return (
    <div className="card p-5">
      <p className="eyebrow">This month</p>
      <h2 className="mt-1 font-display text-base font-semibold text-navy-900">Where it went</h2>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-[176px] w-[176px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top}
                dataKey="amount"
                nameKey="category"
                innerRadius={56}
                outerRadius={84}
                paddingAngle={2}
                stroke="none"
              >
                {top.map((d) => (
                  <Cell key={d.category} fill={catColor(d.category)} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <TooltipShell>
                      <p className="font-semibold text-navy-900">{payload[0].name}</p>
                      <p className="tnum text-slate-500">
                        {gbp(payload[0].value)} · {Math.round((payload[0].value / total) * 100)}%
                      </p>
                    </TooltipShell>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Total</p>
              <p className="tnum font-display text-lg font-semibold text-navy-900">
                {gbp(total, { compact: true })}
              </p>
            </div>
          </div>
        </div>

        <ul className="w-full space-y-1.5">
          {top.map((d) => (
            <li key={d.category} className="flex items-center gap-2.5 text-[13px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: catColor(d.category) }}
              />
              <span className="truncate text-slate-600">{d.category}</span>
              <span className="tnum ml-auto font-medium text-navy-800">{gbp(d.amount)}</span>
              {d.pctChange !== null && Math.abs(d.pctChange) >= 10 && (
                <span
                  className={`tnum w-[52px] shrink-0 text-right text-[12px] ${
                    d.pctChange > 0 ? 'text-alert' : 'text-teal-600'
                  }`}
                >
                  {d.pctChange > 0 ? '+' : ''}
                  {Math.round(d.pctChange)}%
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
