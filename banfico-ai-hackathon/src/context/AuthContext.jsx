import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const DEMO = { email: 'demo@banfico.com', password: 'hackathon' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bf.user')
      if (raw) setUser(JSON.parse(raw))
    } catch {
      /* first visit, nothing stored */
    }
    setReady(true)
  }, [])

  // Demo-grade auth on purpose: the brief asks for a login page, not an
  // identity provider. Swap for the real consent flow if there is time.
  async function signIn(email, password) {
    await new Promise((r) => setTimeout(r, 550))
    if (email.trim().toLowerCase() !== DEMO.email || password !== DEMO.password) {
      throw new Error('That email and password do not match our demo account.')
    }
    const u = { email: DEMO.email, name: 'Aarav Menon', consentedAt: new Date().toISOString() }
    localStorage.setItem('bf.user', JSON.stringify(u))
    setUser(u)
    return u
  }

  function signOut() {
    localStorage.removeItem('bf.user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, DEMO }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
