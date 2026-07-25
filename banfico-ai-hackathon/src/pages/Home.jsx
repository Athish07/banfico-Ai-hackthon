import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import Logo from '../components/Logo.jsx'

const PILLARS = [
  {
    icon: Wallet,
    title: 'Every account, one picture',
    body: 'Balances and six months of history from all your accounts, aggregated through Open Banking AIS.',
  },
  {
    icon: Sparkles,
    title: 'Insight you can act on',
    body: 'We do not just chart your spending. We tell you what changed, why it matters, and offer to fix it.',
  },
  {
    icon: ShieldCheck,
    title: 'Consent you control',
    body: 'Read-only access under explicit consent. Revoke it in one tap, and the connection closes.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Logo />
        <Link to="/login" className="btn-primary">
          Sign in
        </Link>
      </header>

      {/* ── Hero: the thesis, not a feature list ── */}
      <section className="relative overflow-hidden bg-navy-900">
        {/* Teal crescent motif from the logo, blown up as ambient geometry */}
        <svg
          className="pointer-events-none absolute -right-24 -top-32 h-[560px] w-[560px] opacity-[.16]"
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <path d="M20 4a16 16 0 1 0 0 32 11 11 0 0 1 0-22 8 8 0 0 0 0-10z" fill="#17A398" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <p className="eyebrow text-teal-400">Powered by Banfico Open Banking APIs</p>
          <h1
            className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Your bank shows you
            <br />
            <span className="text-slate-400 line-through decoration-teal-500 decoration-2">
              what you spent
            </span>
            <br />
            We tell you what to do next.
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-200/70">
            MoneySense reads your accounts, finds the pattern you missed, and then sets up the
            transfer, the budget or the cancellation for you. One approval, done.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary px-5 py-3">
              Connect your accounts <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              See the demo account
            </Link>
          </div>

          <p className="mt-6 font-mono text-[12px] text-slate-200/40">
            demo@banfico.com · hackathon
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-100 text-teal-600">
                <Icon size={19} />
              </span>
              <h2 className="mt-4 font-display text-[17px] font-semibold text-navy-900">{title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 text-[12.5px] text-slate-400">
          <Logo size={20} />
          <span className="ml-auto">
            Built for the Banfico AI Hackathon. Account data is simulated.
          </span>
        </div>
      </footer>
    </div>
  )
}
