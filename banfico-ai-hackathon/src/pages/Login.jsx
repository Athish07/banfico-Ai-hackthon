import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Lock } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
      nav('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 lg:flex">
        <svg
          className="pointer-events-none absolute -bottom-40 -left-32 h-[620px] w-[620px] opacity-[.13]"
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <path d="M20 4a16 16 0 1 0 0 32 11 11 0 0 1 0-22 8 8 0 0 0 0-10z" fill="#17A398" />
        </svg>

        <Link to="/" className="relative">
          <Logo light />
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow text-teal-400">Account Information Services</p>
          <p className="mt-4 font-display text-[26px] font-semibold leading-snug text-white">
            Read-only access, granted by you, revocable at any time.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-slate-200/60">
            We never hold your bank credentials. Authorisation happens with your bank, and we
            receive only the account data you approve.
          </p>
        </div>

        <p className="relative font-mono text-[12px] text-slate-200/35">
          Banfico AI Hackathon 2026 · secure live banking data
        </p>
      </div>

      {/* ── Form ── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-8 font-display text-[26px] font-semibold tracking-tight text-navy-900 lg:mt-0">
            Sign in
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-500">
            Sign in with your bank credentials to view your Banfico dashboard.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-navy-800">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-navy-800">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-[13px] font-medium text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Checking your details
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-relaxed text-slate-400">
            <Lock size={13} className="mt-0.5 shrink-0" />
            Authentication is handled by your bank and strongly protected using secure credentials.
          </p>
        </div>
      </div>
    </div>
  )
}
