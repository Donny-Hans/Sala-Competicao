import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import { initials, formatDate } from '../utils/format'
import Badge from '../components/Badge'

export default function Perfil() {
  const { user, profile, isAdmin } = useAuth()
  const { success, error } = useToast()
  const [novaSenha, setNovaSenha] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function handleAlterarSenha(e) {
    e.preventDefault()
    if (!novaSenha || novaSenha.length < 6) {
      error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      await authService.updatePassword(novaSenha)
      success('Senha alterada com sucesso!')
      setNovaSenha('')
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">👤 Meu Perfil</h1>
        <p className="page-subtitle">Suas informações e configurações de conta.</p>
      </div>

      <div className="profile-layout">
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{initials(profile?.nome || user?.email)}</div>
            <div>
              <h2 className="profile-name">{profile?.nome || 'Usuário'}</h2>
              <Badge color={isAdmin ? 'primary' : 'info'}>
                {isAdmin ? 'Administrador' : 'Professor'}
              </Badge>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail">
              <span className="profile-label">Nome</span>
              <span className="profile-value">{profile?.nome || '-'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">E-mail</span>
              <span className="profile-value">{user?.email || profile?.email || '-'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Perfil de acesso</span>
              <span className="profile-value">{isAdmin ? 'Administrador' : 'Professor'}</span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Status</span>
              <span className="profile-value">
                <Badge>{profile?.ativo ? 'Ativo' : 'Inativo'}</Badge>
              </span>
            </div>
            <div className="profile-detail">
              <span className="profile-label">Membro desde</span>
              <span className="profile-value">{formatDate(profile?.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔒 Alterar senha</h2>
          </div>
          <form onSubmit={handleAlterarSenha} className="modal-form">
            <div className="field">
              <label className="field-label">Nova senha</label>
              <input
                type="password"
                className="input"
                placeholder="Digite a nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
              <small className="field-hint">Mínimo de 6 caracteres.</small>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
