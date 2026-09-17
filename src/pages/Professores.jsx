import React, { useEffect, useState, useCallback } from 'react'
import { authService } from '../services/authService'
import { useToast } from '../contexts/ToastContext'
import { auditService } from '../services/auditService'
import { supabase } from '../services/supabase'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import SearchInput from '../components/SearchInput'
import { formatDate } from '../utils/format'
import { validators } from '../utils/validators'

const DOMAIN = 'classe-ouro.app'

function usuarioParaEmail(usuario) {
  return `${usuario}@${DOMAIN}`
}

export default function Professores() {
  const { success, error } = useToast()
  const [professores, setProfessores] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', usuario: '', senha: '', role: 'professor' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: err } = await authService.listProfessores()
      if (err) throw err
      setProfessores(data || [])
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  const filtrados = professores.filter((p) =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase()) || (p.usuario || '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome')
    errs.usuario = validators.usuario(form.usuario)
    errs.senha = validators.password(form.senha)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      const email = usuarioParaEmail(form.usuario)
      const { data: authData, error: authError } = await authService.signUp(email, form.senha, { nome: form.nome, usuario: form.usuario, role: form.role })
      if (authError) {
        if (/already registered|already been registered|existe/i.test(authError.message)) {
          throw new Error('Este usuário já está cadastrado. Escolha outro.')
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar o usuário. Verifique as configurações de autenticação do Supabase.')
      }

      const { error: profError } = await authService.upsertProfile(authData.user.id, {
        nome: form.nome,
        usuario: form.usuario,
        email,
        role: form.role,
        ativo: true
      })
      if (profError) throw profError

      await auditService.registrar({
        acao: `Professor "${form.nome}" cadastrado`,
        tabela: 'profiles', tipoOperacao: 'INSERT', dadosNovos: form
      })

      success('Professor cadastrado com sucesso!')
      setModalOpen(false)
      setForm({ nome: '', usuario: '', senha: '', role: 'professor' })
      load()
    } catch (err) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(p) {
    try {
      await authService.toggleProfAtivo(p.id, !p.ativo)
      await auditService.registrar({
        acao: `Professor "${p.nome}" ${p.ativo ? 'desativado' : 'ativado'}`,
        tabela: 'profiles', registroId: p.id, tipoOperacao: 'UPDATE', dadosAnteriores: p, dadosNovos: { ...p, ativo: !p.ativo }
      })
      success(p.ativo ? 'Professor desativado.' : 'Professor ativado.')
      load()
    } catch (err) {
      error(err.message)
    }
  }

  async function updateRole(p, role) {
    try {
      await authService.updateProfile(p.id, { role })
      await auditService.registrar({
        acao: `Papel de "${p.nome}" alterado para ${role}`,
        tabela: 'profiles', registroId: p.id, tipoOperacao: 'UPDATE', dadosAnteriores: p, dadosNovos: { ...p, role }
      })
      success('Perfil atualizado.')
      load()
    } catch (err) {
      error(err.message)
    }
  }

  const columns = [
    { header: 'Nome', key: 'nome' },
    { header: 'Usuário', key: 'usuario' },
    { header: 'Perfil', key: 'role', render: (p) => (
      <Badge color={p.role === 'admin' ? 'primary' : 'info'}>{p.role === 'admin' ? 'Administrador' : 'Professor'}</Badge>
    ) },
    { header: 'Status', key: 'ativo', render: (p) => <Badge>{p.ativo}</Badge> },
    { header: 'Cadastro', key: 'created_at', render: (p) => formatDate(p.created_at) },
    { header: 'Ações', key: 'acoes', render: (p) => (
      <div className="row-actions">
        <Select value={p.role} onChange={(e) => updateRole(p, e.target.value)} options={['professor', 'admin']} className="width-120 compact" />
        <button className={`btn btn-${p.ativo ? 'warning' : 'success'} btn-sm`} onClick={() => toggleAtivo(p)}>
          {p.ativo ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    ) }
  ]

  return (
    <div className="page-content">
      <div className="page-header page-header-toolbar">
        <div>
          <h1 className="page-title">👨‍🏫 Professores</h1>
          <p className="page-subtitle">Gerenciar os usuários com acesso ao sistema.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Novo Professor</Button>
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome ou e-mail..." />
      </div>

      {loading ? <Loading skeleton /> : (
        filtrados.length > 0 ? (
          <div className="card"><Table columns={columns} data={filtrados} /></div>
        ) : (
          <EmptyState icon="👨‍🏫" title="Nenhum professor cadastrado" />
        )
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Professor">
        <form onSubmit={handleCreate} className="modal-form">
          <Input label="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} error={errors.nome} />
          <Input label="Nome de usuário" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} error={errors.usuario} placeholder="Ex: prof.carla" />
          <Input label="Senha inicial" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} error={errors.senha} hint="Mínimo de 6 caracteres" />
          <Select label="Perfil" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={['professor', 'admin']} />
          <p className="info-note">O usuário acessará o sistema com o nome de usuário e a senha definidos.</p>
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Cadastrar professor</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
