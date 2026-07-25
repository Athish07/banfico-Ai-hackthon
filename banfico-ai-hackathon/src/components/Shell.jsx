import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, Sparkles, LogOut, Menu, X, Search } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { initials } from '../lib/format.js'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
]

function NavItems({ onNavigate }) {
  return NAV.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-teal-500/15 text-white ring-1 ring-inset ring-teal-500/40'
            : 'text-slate-200/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </NavLink>
  ))
}

export default function Shell({ children, title, subtitle }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-[236px] shrink-0 flex-col bg-navy-900 px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo light />
        </div>

        <nav className="mt-9 flex flex-col gap-1">
          <NavItems />
        </nav>

        <div className="mt-auto">
          <div className="rounded-card bg-white/[.04] p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-teal-400">
              Consent active
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-200/60">
              3 accounts shared under AIS consent. Expires in 87 days.
            </p>
          </div>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200/60 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-900/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[262px] flex-col bg-navy-900 px-4 py-6 animate-rise">
            <div className="flex items-center justify-between px-2">
              <Logo light />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-slate-200/70">
                <X size={20} />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              <NavItems onNavigate={() => setOpen(false)} />
            </nav>
            <button
              onClick={signOut}
              className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200/60"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur lg:px-8">
          <button
            className="rounded-lg border border-slate-200 bg-white p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-semibold tracking-tight text-navy-900">
                  {title}
                </h1>
                {subtitle && <p className="truncate text-[13px] text-slate-500">{subtitle}</p>}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input placeholder="Search transactions, merchants or categories" className="field pl-9 w-[360px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="block font-medium text-navy-800">{user?.name}</span>
              <span className="block text-slate-400 text-[13px]">{user?.email}</span>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 rounded-full bg-white border border-slate-100 px-3 py-1.5 shadow-sm">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-navy-900 text-white font-semibold">{initials(user?.name)}</span>
                <span className="hidden sm:inline text-sm text-navy-800">{user?.name?.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </header>

        <main key={pathname} className="flex-1 px-5 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
