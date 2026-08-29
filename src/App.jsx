import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Turmas from './pages/Turmas'
import TurmaDetalhes from './pages/TurmaDetalhes'
import Alunos from './pages/Alunos'
import Professores from './pages/Professores'
import Periodos from './pages/Periodos'
import Criterios from './pages/Criterios'
import Pontuacoes from './pages/Pontuacoes'
import Penalidades from './pages/Penalidades'
import Ranking from './pages/Ranking'
import Historico from './pages/Historico'
import Relatorios from './pages/Relatorios'
import Regulamento from './pages/Regulamento'
import Premiacao from './pages/Premiacao'
import Perfil from './pages/Perfil'
import Configuracoes from './pages/Configuracoes'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/regulamento" element={<PublicLayout><Regulamento /></PublicLayout>} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="turmas" element={<Turmas />} />
        <Route path="turmas/:id" element={<TurmaDetalhes />} />
        <Route path="alunos" element={<Alunos />} />
        <Route path="professores" element={<ProtectedRoute adminOnly><Professores /></ProtectedRoute>} />
        <Route path="periodos" element={<Periodos />} />
        <Route path="criterios" element={<ProtectedRoute adminOnly><Criterios /></ProtectedRoute>} />
        <Route path="pontuacoes" element={<Pontuacoes />} />
        <Route path="penalidades" element={<Penalidades />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="historico" element={<Historico />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="premiacao" element={<Premiacao />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="configuracoes" element={<ProtectedRoute adminOnly><Configuracoes /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
