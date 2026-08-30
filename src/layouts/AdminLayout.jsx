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
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('classe-ouro.sidebar') === 'collapsed'
  )
  const location = useLocation()

  const title = titulos[location.pathname] || 'Classe Ouro'

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('classe-ouro.sidebar', next ? 'collapsed' : 'open')
      return next
    })
  }

  function handleMenuClick() {
    if (window.matchMedia('(max-width: 992px)').matches) {
      setSidebarOpen(true)
    } else {
      toggleCollapsed()
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="app-main">
        <Navbar onMenuClick={handleMenuClick} title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
