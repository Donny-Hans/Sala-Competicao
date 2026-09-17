import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'
import { validators } from '../utils/validators'

const DOMAIN = 'classe-ouro.app'

function usuarioParaEmail(usuario) {
  return `${usuario}@${DOMAIN}`
}

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { success, error } = useToast()
  const navigate = useNavigate()
  const { setProfile } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    errs.usuario = validators.usuario(usuario)
    errs.senha = validators.password(senha)
    setErrors(errs)
    if (errs.usuario || errs.senha) return

    setLoading(true)
    try {
      const email = usuarioParaEmail(usuario.trim())
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
      error(err.message || 'Erro ao fazer login. Verifique usuário e senha.')
    } finally {
      setLoading(false)
    }
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
            label="Nome de usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Ex: prof.carla"
            error={errors.usuario}
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
          <p className="auth-switch">
            Não tem uma conta?{' '}
            <Link to="/registro" className="link-btn">Cadastre-se</Link>
          </p>
          <Link to="/regulamento" className="link-btn auth-link">
            Ver regulamento
          </Link>
        </form>
      </div>
    </div>
  )
}
