import React, { useEffect, useState, useCallback } from 'react'
import { criterioService } from '../services/criterioService'
import { useToast } from '../contexts/ToastContext'
import { auditService } from '../services/auditService'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { validators } from '../utils/validators'

const estadoInicial = { nome: '', categoria: 'Organização', pontos_maximos: 50, ativo: true }
const categorias = ['Organização', 'Disciplina', 'Atividades', 'Relacionamento', 'Professor', 'Avaliações']

export default function Criterios() {
  const { success, error } = useToast()
  const [criterios, setCriterios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(estadoInicial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCriterios(await criterioService.listar())
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

  function abrirEdicao(c) {
    setEditando(c)
    setForm({ nome: c.nome, categoria: c.categoria, pontos_maximos: c.pontos_maximos, ativo: c.ativo })
    setErrors({})
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome')
    errs.pontos_maximos = validators.number(form.pontos_maximos, 'Pontos máximos')
    if (form.pontos_maximos < 1) errs.pontos_maximos = 'Pontos máximos deve ser positivo.'
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      if (editando) {
        await criterioService.atualizar(editando.id, { ...form, pontos_maximos: Number(form.pontos_maximos) })
        await auditService.registrar({
          acao: `Critério "${form.nome}" atualizado`,
          tabela: 'criterios', registroId: editando.id, tipoOperacao: 'UPDATE', dadosNovos: form
        })
        success('Critério atualizado!')
      } else {
        const criado = await criterioService.criar({ ...form, pontos_maximos: Number(form.pontos_maximos) })
        await auditService.registrar({
          acao: `Critério "${form.nome}" criado`,
          tabela: 'criterios', registroId: criado.id, tipoOperacao: 'INSERT', dadosNovos: form
        })
        success('Critério criado!')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { header: 'Nome', key: 'nome' },
    { header: 'Categoria', key: 'categoria', render: (c) => <Badge color="info">{c.categoria}</Badge> },
    { header: 'Pontos máximos', key: 'pontos_maximos', render: (c) => <strong>{c.pontos_maximos} pts</strong> },
    { header: 'Status', key: 'ativo', render: (c) => <Badge>{c.ativo}</Badge> },
    { header: 'Ações', key: 'acoes', render: (c) => (
      <button className="btn btn-info btn-sm" onClick={() => abrirEdicao(c)}>Editar</button>
    ) }
  ]

  return (
    <div className="page-content">
      <div className="page-header page-header-toolbar">
        <div>
          <h1 className="page-title">📋 Critérios de Pontuação</h1>
          <p className="page-subtitle">Tabela oficial de critérios conforme o Anexo 1 do regulamento.</p>
        </div>
        <Button onClick={abrirNovo}>+ Novo Critério</Button>
      </div>

      {loading ? <Loading skeleton /> : (
        criterios.length > 0 ? (
          <div className="card"><Table columns={columns} data={criterios} /></div>
        ) : (
          <EmptyState icon="📋" title="Nenhum critério cadastrado" />
        )
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Critério' : 'Novo Critério'}>
        <form onSubmit={handleSave} className="modal-form">
          <Input label="Nome do critério" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} error={errors.nome} />
          <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} options={categorias} />
          <Input label="Pontos máximos" type="number" min="1" value={form.pontos_maximos} onChange={(e) => setForm({ ...form, pontos_maximos: e.target.value })} error={errors.pontos_maximos} />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editando ? 'Salvar alterações' : 'Criar critério'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
