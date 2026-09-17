import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { initials } from '../utils/format'
import Badge from './Badge'

export default function Navbar({ onMenuClick, title }) {
  const { user, profile, isAdmin } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await authService.signOut()
    success('Sessão encerrada com sucesso.')
    navigate('/login')
  }

  function go(path) {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <header className="navbar">
      <button className="menu-toggle" onClick={onMenuClick} aria-label="Abrir menu">
        <span />
        <span />
        <span />
      </button>
      <div className="navbar-title">{title}</div>
      <div className="navbar-actions">
        <button className="icon-btn" title="Histórico" onClick={() => navigate('/historico')}>
          🔔
        </button>

        <div className="navbar-user" ref={menuRef}>
          <button className="navbar-user-trigger" onClick={() => setMenuOpen((v) => !v)}>
            <div className="avatar">
              {initials(profile?.nome || user?.email)}
            </div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{profile?.nome || user?.email}</span>
              <Badge color={isAdmin ? 'primary' : 'info'}>
                {isAdmin ? 'Administrador' : 'Professor'}
              </Badge>
            </div>
            <svg className="navbar-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {menuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="avatar avatar-sm">{initials(profile?.nome || user?.email)}</div>
                <div>
                  <div className="user-menu-name">{profile?.nome || user?.email}</div>
                  <div className="user-menu-email">{user?.email}</div>
                </div>
              </div>
              <div className="user-menu-items">
                <button className="user-menu-item" onClick={() => go('/perfil')}>👤 Meu perfil</button>
                <button className="user-menu-item" onClick={() => go('/regulamento')}>📖 Regulamento</button>
                {isAdmin && <button className="user-menu-item" onClick={() => go('/configuracoes')}>⚙️ Configurações</button>}
                <button className="user-menu-item" onClick={() => go('/premiacao')}>🎉 Premiação</button>
                <div className="user-menu-divider" />
                <button className="user-menu-item danger" onClick={handleLogout}>🚪 Sair</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
