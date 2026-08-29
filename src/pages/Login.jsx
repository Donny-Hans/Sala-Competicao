import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'
import { validators } from '../utils/validators'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showRecover, setShowRecover] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverMsg, setRecoverMsg] = useState('')
  const { success, error } = useToast()
  const navigate = useNavigate()
  const { setProfile } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    errs.email = validators.email(email)
    errs.senha = validators.password(senha)
    setErrors(errs)
    if (errs.email || errs.senha) return

    setLoading(true)
    try {
      const { data, error: authError } = await authService.signIn(email, senha)
      if (authError) throw authError

      const prof = await authService.getProfile(data.user.id)
      if (prof.error) throw prof.error

      if (prof.data && !prof.data.ativo) {
        await authService.signOut()
        throw new Error('Este usuário está desativado. Contate o administrador.')
      }

      if (prof.data) {
        setProfile(prof.data)
      }

      success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (err) {
      error(err.message || 'Erro ao fazer login. Verifique e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRecover(e) {
    e.preventDefault()
    const err = validators.email(recoverEmail)
    if (err) {
      setErrors({ recoverEmail: err })
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(recoverEmail)
      setRecoverMsg('Enviamos um link de recuperação para o seu e-mail.')
      success('Link de recuperação enviado!')
    } catch (err) {
      error(err.message || 'Erro ao enviar link de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  if (showRecover) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-logo">🏆</span>
            <h1>Classe Ouro</h1>
            <p>Competição Interclasses</p>
          </div>
          <form onSubmit={handleRecover}>
            <h2 className="auth-title">Recuperar senha</h2>
            <Input
              label="E-mail"
              type="email"
              value={recoverEmail}
              onChange={(e) => setRecoverEmail(e.target.value)}
              placeholder="seu@email.com"
              error={errors.recoverEmail}
            />
            {recoverMsg && <p className="auth-success">{recoverMsg}</p>}
            <Button type="submit" loading={loading} fullWidth>Enviar link</Button>
            <button className="link-btn auth-link" onClick={() => { setShowRecover(false); setRecoverMsg('') }}>
              Voltar ao login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">🏆</span>
          <h1>Classe Ouro</h1>
          <p>Competição Interclasses</p>
        </div>
        <form onSubmit={handleSubmit}>
          <h2 className="auth-title">Entrar no sistema</h2>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            error={errors.email}
          />
          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            error={errors.senha}
          />
          <Button type="submit" loading={loading} fullWidth>Entrar</Button>
          <button type="button" className="link-btn auth-link" onClick={() => setShowRecover(true)}>
            Esqueci minha senha
          </button>
          <Link to="/regulamento" className="link-btn auth-link">
            Ver regulamento
          </Link>
        </form>
      </div>
    </div>
  )
}
