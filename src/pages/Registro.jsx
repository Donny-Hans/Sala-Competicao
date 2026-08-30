import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import Input from '../components/Input'
import Button from '../components/Button'
import { validators } from '../utils/validators'

const DOMAIN = 'classe-ouro.app'

function usuarioParaEmail(usuario) {
  return `${usuario}@${DOMAIN}`
}

export default function Registro() {
  const [form, setForm] = useState({ nome: '', usuario: '', senha: '', confirmar: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome completo')
    errs.usuario = validators.usuario(form.usuario)
    errs.senha = validators.password(form.senha)
    if (form.senha && form.confirmar && form.senha !== form.confirmar) {
      errs.confirmar = 'As senhas não coincidem.'
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setLoading(true)
    try {
      const email = usuarioParaEmail(form.usuario)

      // 1. Decide o papel ANTES do cadastro: o primeiro usuário vira admin.
      //    (O trigger handle_new_user cria o perfil automaticamente no signup,
      //    então precisamos contar antes para detectar o primeiro registro.)
      let role = 'professor'
      try {
        const total = await authService.countProfiles()
        if (total === 0) role = 'admin'
      } catch (countErr) {
        console.warn('Não foi possível contar perfis, assumindo professor:', countErr.message)
      }

      // 2. Cria o usuário no Supabase Auth (e-mail interno gerado automaticamente).
      //    O Supabase rejeita e-mails duplicados, o que garante usuários únicos.
      const { data, error: authError } = await authService.signUp(email, form.senha, {
        nome: form.nome,
        usuario: form.usuario
      })
      if (authError) {
        if (/already registered|already been registered|existe/i.test(authError.message)) {
          throw new Error('Este usuário já está cadastrado. Escolha outro.')
        }
        throw authError
      }

      // 3. O trigger já criou o perfil com role 'professor';
      //    aqui garantimos nome/usuario/role corretos.
      const { error: profError } = await authService.upsertProfile(data.user.id, {
        nome: form.nome,
        usuario: form.usuario,
        email,
        role,
        ativo: true
      })
      if (profError) throw profError

      success(
        role === 'admin'
          ? 'Cadastro realizado! Você é o primeiro usuário e foi promovido a Administrador.'
          : 'Cadastro realizado com sucesso!'
      )
      navigate('/login')
    } catch (err) {
      error(err.message || 'Erro ao criar a conta.')
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
          <p>Crie sua conta de acesso</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h2 className="auth-title">Cadastro de professor</h2>
          <p className="auth-note">
            O <strong>primeiro usuário</strong> a se cadastrar é promovido automaticamente a
            <strong> Administrador</strong>. Os demais entram como <strong>Professor</strong>.
          </p>
          <Input
            label="Nome completo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Seu nome completo"
            error={errors.nome}
          />
          <Input
            label="Nome de usuário"
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            placeholder="Ex: prof.carla"
            error={errors.usuario}
          />
          <Input
            label="Senha"
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            error={errors.senha}
          />
          <Input
            label="Confirmar senha"
            type="password"
            value={form.confirmar}
            onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
            placeholder="Repita a senha"
            error={errors.confirmar}
          />
          <Button type="submit" loading={loading} fullWidth>Cadastrar</Button>
          <p className="auth-switch">
            Já tem uma conta?{' '}
            <Link to="/login" className="link-btn">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
