import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

const titulos = {
  '/dashboard': 'Dashboard',
  '/turmas': 'Turmas',
  '/alunos': 'Alunos',
  '/professores': 'Professores',
  '/periodos': 'Períodos',
  '/criterios': 'Critérios de Pontuação',
  '/pontuacoes': 'Registrar Pontuação',
  '/penalidades': 'Penalidades',
  '/ranking': 'Ranking das Turmas',
  '/historico': 'Histórico de Lançamentos',
  '/relatorios': 'Relatórios',
  '/premiacao': 'Premiação',
  '/perfil': 'Meu Perfil',
  '/configuracoes': 'Configurações',
  '/regulamento': 'Regulamento'
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const title = titulos[location.pathname] || 'Classe Ouro'

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
