import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar({ open, onClose, collapsed = false, onToggleCollapsed }) {
  const { isAdmin } = useAuth()

  const itens = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/turmas', icon: '🏫', label: 'Turmas' },
    { to: '/alunos', icon: '👨‍🎓', label: 'Alunos' },
    ...(isAdmin ? [{ to: '/professores', icon: '👨‍🏫', label: 'Professores' }] : []),
    { to: '/periodos', icon: '📅', label: 'Períodos' },
    { to: '/pontuacoes', icon: '⭐', label: 'Pontuações' },
    { to: '/penalidades', icon: '⚠️', label: 'Penalidades' },
    { to: '/ranking', icon: '🏆', label: 'Ranking' },
    ...(isAdmin ? [{ to: '/relatorios', icon: '📊', label: 'Relatórios' }, { to: '/criterios', icon: '📋', label: 'Critérios' }] : []),
    { to: '/historico', icon: '📜', label: 'Histórico' },
    { to: '/premiacao', icon: '🎉', label: 'Premiação' },
    ...(isAdmin ? [{ to: '/configuracoes', icon: '⚙️', label: 'Configurações' }] : []),
    { to: '/regulamento', icon: '📖', label: 'Regulamento' }
  ]

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">🏆</span>
          <div className="sidebar-brand-text">
            <strong>Classe Ouro</strong>
            <small>Competição Interclasses</small>
          </div>
          {onToggleCollapsed && (
            <button
              className="sidebar-collapse"
              onClick={onToggleCollapsed}
              title="Ocultar menu"
              aria-label="Ocultar menu"
            >
              ‹
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/regulamento" className="sidebar-link footer-link">
            <span className="sidebar-icon">📖</span>
            <span>Ver Regulamento</span>
          </a>
        </div>
      </aside>
    </>
  )
}
