import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { turmaService } from '../services/turmaService'
import { alunoService } from '../services/alunoService'
import { useToast } from '../contexts/ToastContext'
import { auditService } from '../services/auditService'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Modal from '../components/Modal'
import Table from '../components/Table'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { formatDate, formatPoints, dataAtualISO } from '../utils/format'
import { validators } from '../utils/validators'

const estadoInicial = {
  nome: '',
  serie: '',
  turno: 'Manhã',
  sala: '',
  ano_letivo: new Date().getFullYear(),
  descricao: '',
  ativo: true
}

export default function Turmas() {
  const { success, error } = useToast()
  const navigate = useNavigate()

  const [turmas, setTurmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(estadoInicial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [remover, setRemover] = useState(null)
  const [contagemAlunos, setContagemAlunos] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await turmaService.listar()
      setTurmas(data)
      const contagem = await alunoService.contarPorTurma()
      setContagemAlunos(contagem)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  const filtradas = turmas.filter((t) =>
    !search ||
    t.nome.toLowerCase().includes(search.toLowerCase()) ||
    (t.serie && t.serie.toLowerCase().includes(search.toLowerCase()))
  )

  function abrirNovo() {
    setEditando(null)
    setForm({ ...estadoInicial, ano_letivo: new Date().getFullYear() })
    setErrors({})
    setModalOpen(true)
  }

  function abrirEdicao(turma) {
    setEditando(turma)
    setForm({
      nome: turma.nome,
      serie: turma.serie,
      turno: turma.turno,
      sala: turma.sala || '',
      ano_letivo: turma.ano_letivo,
      descricao: turma.descricao || '',
      ativo: turma.ativo
    })
    setErrors({})
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome da turma')
    errs.serie = validators.required(form.serie, 'Série')
    errs.ano_letivo = validators.required(form.ano_letivo, 'Ano letivo')
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      if (editando) {
        const anterior = editando
        await turmaService.atualizar(editando.id, form)
        await auditService.registrar({
          acao: `Turma "${form.nome}" atualizada`,
          tabela: 'turmas',
          registroId: editando.id,
          tipoOperacao: 'UPDATE',
          dadosAnteriores: anterior,
          dadosNovos: form
        })
        success('Turma atualizada com sucesso!')
      } else {
        const criada = await turmaService.criar(form)
        await auditService.registrar({
          acao: `Turma "${form.nome}" criada`,
          tabela: 'turmas',
          registroId: criada.id,
          tipoOperacao: 'INSERT',
          dadosNovos: form
        })
        success('Turma cadastrada com sucesso!')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      error(err.message || 'Erro ao salvar turma.')
    } finally {
      setSaving(false)
    }
  }

  function confirmarExclusao(turma) {
    setRemover(turma)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (!remover) return
    try {
      await turmaService.excluir(remover.id)
      await auditService.registrar({
        acao: `Turma "${remover.nome}" excluída`,
        tabela: 'turmas',
        registroId: remover.id,
        tipoOperacao: 'DELETE',
        dadosAnteriores: remover
      })
      success('Turma removida.')
      setConfirmOpen(false)
      load()
    } catch (err) {
      error(err.message || 'Erro ao excluir turma. Verifique se há alunos vinculados.')
    }
  }

  const columns = [
    { header: 'Turma', key: 'nome' },
    { header: 'Série', key: 'serie' },
    { header: 'Turno', key: 'turno' },
    { header: 'Sala', key: 'sala', render: (t) => t.sala || '-' },
    { header: 'Alunos', key: 'alunos', render: (t) => <Badge color="info">{contagemAlunos[t.id] || 0}</Badge> },
    { header: 'Ano', key: 'ano_letivo' },
    { header: 'Status', key: 'ativo', render: (t) => <Badge>{t.ativo ? 'Ativo' : 'Inativo'}</Badge> },
    {
      header: 'Ações',
      key: 'acoes',
      render: (t) => (
        <div className="row-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/turmas/${t.id}`)}>Detalhes</button>
          <button className="btn btn-info btn-sm" onClick={() => abrirEdicao(t)}>Editar</button>
          <button className="btn btn-danger btn-sm" onClick={() => (t.ativo ? confirmarExclusao(t) : null)}>{t.ativo ? 'Inativar' : 'Inativo'}</button>
        </div>
      )
    }
  ]

  return (
    <div className="page-content">
      <div className="page-header page-header-toolbar">
        <div>
          <h1 className="page-title">Turmas</h1>
          <p className="page-subtitle">Gerenciar turmas participantes da competição.</p>
        </div>
        <Button onClick={abrirNovo}>+ Nova Turma</Button>
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por turma ou série..." />
      </div>

      {loading ? <Loading skeleton /> : (
        filtradas.length > 0 ? (
          <div className="card">
            <Table
              columns={columns}
              data={filtradas}
              onRowClick={(t) => navigate(`/turmas/${t.id}`)}
            />
          </div>
        ) : (
          <EmptyState
            icon="🏫"
            title="Nenhuma turma encontrada"
            description="Cadastre a primeira turma para iniciar a competição."
            action={<Button onClick={abrirNovo}>+ Nova Turma</Button>}
          />
        )
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Turma' : 'Nova Turma'}
      >
        <form onSubmit={handleSave} className="modal-form">
          <Input
            label="Nome da turma"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: 1º Ano A"
            error={errors.nome}
          />
          <div className="form-grid-2">
            <Select
              label="Série"
              value={form.serie}
              onChange={(e) => setForm({ ...form, serie: e.target.value })}
              error={errors.serie}
              options={['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', 'Ensino Médio']}
            />
            <Select
              label="Turno"
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value })}
              options={['Manhã', 'Tarde', 'Noite', 'Integral']}
            />
          </div>
          <div className="form-grid-2">
            <Input
              label="Sala"
              value={form.sala}
              onChange={(e) => setForm({ ...form, sala: e.target.value })}
              placeholder="Ex: Sala 01"
            />
            <Input
              label="Ano letivo"
              type="number"
              value={form.ano_letivo}
              onChange={(e) => setForm({ ...form, ano_letivo: Number(e.target.value) })}
              error={errors.ano_letivo}
            />
          </div>
          <Input
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição opcional"
            asTextarea
          />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editando ? 'Salvar alterações' : 'Cadastrar turma'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir turma?"
        message={`Tem certeza que deseja excluir a turma "${remover?.nome}"? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        danger
      />
    </div>
  )
}
