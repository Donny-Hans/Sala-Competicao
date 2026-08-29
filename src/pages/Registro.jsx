import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import Input from '../components/Input'
import Button from '../components/Button'
import { validators } from '../utils/validators'

export default function Registro() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [msgConfirmacao, setMsgConfirmacao] = useState('')
  const { success, error } = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome completo')
    errs.email = validators.email(form.email)
    errs.senha = validators.password(form.senha)
    if (form.senha && form.confirmar && form.senha !== form.confirmar) {
      errs.confirmar = 'As senhas não coincidem.'
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setLoading(true)
    try {
      // 1. Cria o usuário no Supabase Auth
      const { data, error: authError } = await authService.signUp(form.email, form.senha, {
        nome: form.nome
      })
      if (authError) throw authError
      if (!data.user) {
        // Se o Supabase exigir confirmação de e-mail, o user pode vir vazio sem session
        setMsgConfirmacao(
          'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.'
        )
        success('Conta criada! Verifique seu e-mail.')
        setLoading(false)
        return
      }

      // 2. Decide o papel: primeiro usuário vira admin, demais viram professor
      let role = 'professor'
      try {
        const total = await authService.countProfiles()
        if (total === 0) role = 'admin'
      } catch (countErr) {
        console.warn('Não foi possível contar perfis, assumindo professor:', countErr.message)
      }

      // 3. Cria o perfil na tabela profiles
      const { error: profError } = await authService.createProfile(data.user.id, {
        nome: form.nome,
        email: form.email,
        role,
        ativo: true
      })
      if (profError) throw profError

      success(
        role === 'admin'
          ? 'Cadastro realizado! Você é o primeiro usuário e foi promovido a Administrador.'
          : 'Cadastro realizado com sucesso!'
      )

      // 4. Se já houver sessão (e-mail confirmado automaticamente), vai para o dashboard
      const session = await authService.getSession()
      if (session.data.session) {
        navigate('/dashboard')
      } else {
        setMsgConfirmacao('Cadastro criado! Você já pode fazer login.')
        navigate('/login')
      }
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
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="seu@email.com"
            error={errors.email}
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
          {msgConfirmacao && <p className="auth-success">{msgConfirmacao}</p>}
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
