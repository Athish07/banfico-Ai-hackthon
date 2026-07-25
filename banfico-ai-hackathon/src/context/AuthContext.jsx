import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

function displayNameFromEmail(email = '') {
  const local = email.split('@')[0] || ''
  const first = local.split(/[.+]/)[0] || local
  return first
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

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
    const name = displayNameFromEmail(email.trim())
    const u = {
      email: email.trim(),
      name,
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
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
