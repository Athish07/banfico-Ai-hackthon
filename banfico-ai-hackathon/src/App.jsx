import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Assistant from './pages/Assistant.jsx'

function Private({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <div className="min-h-screen bg-slate-50" />
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
      <Route path="/transactions" element={<Private><Transactions /></Private>} />
      <Route path="/assistant" element={<Private><Assistant /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
