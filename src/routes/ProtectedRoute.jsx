import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loading from '../components/Loading'

export function ProtectedRoute({ children, adminOnly = false, gestorOnly = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Loading fullPage label="Carregando..." />

  if (!user) return <Navigate to="/login" replace />

  const role = profile?.role

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (gestorOnly && role !== 'admin' && role !== 'coordenador') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
