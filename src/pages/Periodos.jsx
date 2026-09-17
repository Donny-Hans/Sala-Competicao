import React, { useEffect, useState, useCallback } from 'react'
import { periodoService } from '../services/periodoService'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { auditService } from '../services/auditService'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import Table from '../components/Table'
import Badge from '../components/Badge'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { formatDate, dataAtualISO } from '../utils/format'
import { validators } from '../utils/validators'

const estadoInicial = { nome: '', data_inicio: dataAtualISO(), data_fim: dataAtualISO(), status: 'planejado' }

export default function Periodos() {
  const { isAdmin } = useAuth()
  const { success, error } = useToast()
  const [periodos, setPeriodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(estadoInicial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [remover, setRemover] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await periodoService.listar()
      setPeriodos(data)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  function abrirNovo() {
    setEditando(null)
    setForm({ ...estadoInicial })
    setErrors({})
    setModalOpen(true)
  }

  function abrirEdicao(p) {
    setEditando(p)
    setForm({ nome: p.nome, data_inicio: p.data_inicio, data_fim: p.data_fim, status: p.status })
    setErrors({})
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome do período')
    errs.data_inicio = validators.required(form.data_inicio, 'Data inicial')
    errs.data_fim = validators.required(form.data_fim, 'Data final')
    if (form.data_inicio && form.data_fim && form.data_fim < form.data_inicio) {
      errs.data_fim = 'Data final deve ser posterior à data inicial.'
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      if (editando) {
        await periodoService.atualizar(editando.id, form)
        await auditService.registrar({
          acao: `Período "${form.nome}" atualizado`,
          tabela: 'periodos', registroId: editando.id, tipoOperacao: 'UPDATE',
          dadosAnteriores: editando, dadosNovos: form
        })
        success('Período atualizado!')
      } else {
        const criado = await periodoService.criar(form)
        await auditService.registrar({
          acao: `Período "${form.nome}" criado`,
          tabela: 'periodos', registroId: criado.id, tipoOperacao: 'INSERT', dadosNovos: form
        })
        success('Período criado!')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!remover) return
    try {
      await periodoService.excluir(remover.id)
      await auditService.registrar({
        acao: `Período "${remover.nome}" excluído`,
        tabela: 'periodos', registroId: remover.id, tipoOperacao: 'DELETE', dadosAnteriores: remover
      })
      success('Período removido.')
      setConfirmOpen(false)
      load()
    } catch (err) {
      error(err.message)
    }
  }

  const columns = [
    { header: 'Nome', key: 'nome' },
    { header: 'Data inicial', key: 'di', render: (p) => formatDate(p.data_inicio) },
    { header: 'Data final', key: 'df', render: (p) => formatDate(p.data_fim) },
    { header: 'Status', key: 'status', render: (p) => (
      <Badge color={p.status === 'ativo' ? 'success' : p.status === 'planejado' ? 'warning' : 'default'}>
        {p.status}
      </Badge>
    ) },
    { header: 'Ações', key: 'acoes', render: (p) => isAdmin ? (
      <div className="row-actions">
        <button className="btn btn-info btn-sm" onClick={() => abrirEdicao(p)}>Editar</button>
        <button className="btn btn-danger btn-sm" onClick={() => { setRemover(p); setConfirmOpen(true) }}>Excluir</button>
      </div>
    ) : null }
  ]

  return (
    <div className="page-content">
      <div className="page-header page-header-toolbar">
        <div>
          <h1 className="page-title">📅 Períodos</h1>
          <p className="page-subtitle">Gerenciar os períodos da competição.</p>
        </div>
        {isAdmin && <Button onClick={abrirNovo}>+ Novo Período</Button>}
      </div>

      {loading ? <Loading skeleton /> : (
        periodos.length > 0 ? (
          <div className="card"><Table columns={columns} data={periodos} /></div>
        ) : (
          <EmptyState icon="📅" title="Nenhum período cadastrado" action={isAdmin && <Button onClick={abrirNovo}>+ Novo Período</Button>} />
        )
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Período' : 'Novo Período'}>
        <form onSubmit={handleSave} className="modal-form">
          <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: 1º Período" error={errors.nome} />
          <div className="form-grid-2">
            <Input label="Data inicial" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} error={errors.data_inicio} />
            <Input label="Data final" type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} error={errors.data_fim} />
          </div>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={['ativo', 'planejado', 'encerrado']} />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editando ? 'Salvar alterações' : 'Criar período'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Excluir período?" message={`Excluir "${remover?.nome}"?`} confirmText="Excluir" danger />
    </div>
  )
}
