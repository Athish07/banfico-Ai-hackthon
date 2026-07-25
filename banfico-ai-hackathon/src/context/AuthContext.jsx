import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

const DEMO = { email: 'nivas.ganesan+aihackathonteamf@banfico.com', password: 'KWRB@(7h2Gk2L1(8daiw' }

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

  async function signIn(email, password) {
    const result = await api.login(email.trim(), password)
    const u = {
      email: email.trim(),
      name: 'Aarav Menon',
      consentedAt: new Date().toISOString(),
      sessionToken: result.sessionToken,
    }
    localStorage.setItem('bf.user', JSON.stringify(u))
    localStorage.setItem('bf.sessionToken', result.sessionToken)
    setUser(u)
    return u
  }

  function signOut() {
    localStorage.removeItem('bf.user')
    localStorage.removeItem('bf.sessionToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, DEMO }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
