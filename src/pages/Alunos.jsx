import React, { useEffect, useState, useCallback } from 'react'
import { alunoService } from '../services/alunoService'
import { turmaService } from '../services/turmaService'
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
import { formatDate } from '../utils/format'
import { validators } from '../utils/validators'

const estadoInicial = { nome: '', matricula: '', turma_id: '', ativo: true }

export default function Alunos() {
  const { success, error } = useToast()

  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTurma, setFiltroTurma] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [transferindo, setTransferindo] = useState(null)
  const [form, setForm] = useState(estadoInicial)
  const [errors, setErrors] = useState({})
  const [formTransfer, setFormTransfer] = useState({ turma_id: '' })
  const [errorsTransfer, setErrorsTransfer] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [remover, setRemover] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [al, tm] = await Promise.all([alunoService.listar(), turmaService.listarAtivas()])
      setAlunos(al)
      setTurmas(tm)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  const filtrados = alunos.filter((a) => {
    const matchSearch = !search || a.nome.toLowerCase().includes(search.toLowerCase()) || a.matricula?.toLowerCase().includes(search.toLowerCase())
    const matchTurma = !filtroTurma || a.turma_id === filtroTurma
    return matchSearch && matchTurma
  })

  function abrirNovo() {
    setEditando(null)
    setForm({ ...estadoInicial })
    setErrors({})
    setModalOpen(true)
  }

  function abrirEdicao(aluno) {
    setEditando(aluno)
    setForm({
      nome: aluno.nome,
      matricula: aluno.matricula,
      turma_id: aluno.turma_id || '',
      ativo: aluno.ativo
    })
    setErrors({})
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = {}
    errs.nome = validators.required(form.nome, 'Nome do aluno')
    errs.matricula = validators.required(form.matricula, 'Matrícula')
    errs.turma_id = validators.required(form.turma_id, 'Turma')
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      if (editando) {
        await alunoService.atualizar(editando.id, form)
        await auditService.registrar({
          acao: `Aluno "${form.nome}" atualizado`,
          tabela: 'alunos', registroId: editando.id, tipoOperacao: 'UPDATE',
          dadosAnteriores: editando, dadosNovos: form
        })
        success('Aluno atualizado com sucesso!')
      } else {
        const criado = await alunoService.criar(form)
        await auditService.registrar({
          acao: `Aluno "${form.nome}" cadastrado`,
          tabela: 'alunos', registroId: criado.id, tipoOperacao: 'INSERT', dadosNovos: form
        })
        success('Aluno cadastrado com sucesso!')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      error(err.message || 'Erro ao salvar aluno. Verifique se a matrícula já existe.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTransfer(e) {
    e.preventDefault()
    if (!formTransfer.turma_id) {
      setErrorsTransfer({ turma_id: 'Selecione a turma de destino.' })
      return
    }
    setSaving(true)
    try {
      const anterior = transferindo
      await alunoService.transferir(transferindo.id, formTransfer.turma_id)
      await auditService.registrar({
        acao: `Aluno "${transferindo.nome}" transferido de turma`,
        tabela: 'alunos', registroId: transferindo.id, tipoOperacao: 'UPDATE',
        dadosAnteriores: anterior, dadosNovos: { ...anterior, turma_id: formTransfer.turma_id }
      })
      success('Aluno transferido com sucesso!')
      setTransferindo(null)
      setFormTransfer({ turma_id: '' })
      setErrorsTransfer({})
      load()
    } catch (err) {
      error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function confirmarExclusao(aluno) {
    setRemover(aluno)
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (!remover) return
    try {
      await alunoService.excluir(remover.id)
      await auditService.registrar({
        acao: `Aluno "${remover.nome}" excluído`,
        tabela: 'alunos', registroId: remover.id, tipoOperacao: 'DELETE', dadosAnteriores: remover
      })
      success('Aluno removido.')
      setConfirmOpen(false)
      load()
    } catch (err) {
      error(err.message)
    }
  }

  async function toggleAtivo(aluno) {
    try {
      const novo = { ...aluno, ativo: !aluno.ativo }
      await alunoService.atualizar(aluno.id, { ativo: novo.ativo })
      await auditService.registrar({
        acao: `Aluno "${aluno.nome}" ${novo.ativo ? 'ativado' : 'desativado'}`,
        tabela: 'alunos', registroId: aluno.id, tipoOperacao: 'UPDATE',
        dadosAnteriores: aluno, dadosNovos: novo
      })
      success(novo.ativo ? 'Aluno ativado.' : 'Aluno desativado.')
      load()
    } catch (err) {
      error(err.message)
    }
  }

  const columns = [
    { header: 'Nome', key: 'nome' },
    { header: 'Matrícula', key: 'matricula' },
    { header: 'Turma', key: 'turma', render: (a) => a.turmas?.nome || <Badge color="warning">Sem turma</Badge> },
    { header: 'Status', key: 'ativo', render: (a) => <Badge>{a.ativo}</Badge> },
    {
      header: 'Ações',
      key: 'acoes',
      render: (a) => (
        <div className="row-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { setTransferindo(a); setFormTransfer({ turma_id: '' }); setErrorsTransfer({}) }}>Transferir</button>
          <button className="btn btn-info btn-sm" onClick={() => abrirEdicao(a)}>Editar</button>
          <button className={`btn btn-${a.ativo ? 'warning' : 'success'} btn-sm`} onClick={() => toggleAtivo(a)}>
            {a.ativo ? 'Desativar' : 'Ativar'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => confirmarExclusao(a)}>Excluir</button>
        </div>
      )
    }
  ]

  return (
    <div className="page-content">
      <div className="page-header page-header-toolbar">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-subtitle">Cadastro e composição das turmas.</p>
        </div>
        <Button onClick={abrirNovo}>+ Novo Aluno</Button>
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome ou matrícula..." />
        <Select
          value={filtroTurma}
          onChange={(e) => setFiltroTurma(e.target.value)}
          options={turmas.map((t) => ({ value: t.id, label: t.nome }))}
          placeholder="Todas as turmas"
          className="width-200"
        />
      </div>

      {loading ? <Loading skeleton /> : (
        filtrados.length > 0 ? (
          <div className="card"><Table columns={columns} data={filtrados} /></div>
        ) : (
          <EmptyState icon="👨‍🎓" title="Nenhum aluno encontrado" description="Cadastre alunos nas turmas." action={<Button onClick={abrirNovo}>+ Novo Aluno</Button>} />
        )
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Aluno' : 'Novo Aluno'}>
        <form onSubmit={handleSave} className="modal-form">
          <Input label="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do aluno" error={errors.nome} />
          <Input label="Matrícula" value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} placeholder="Número da matrícula" error={errors.matricula} />
          <Select label="Turma" value={form.turma_id} onChange={(e) => setForm({ ...form, turma_id: e.target.value })} error={errors.turma_id} options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))} placeholder="Selecione a turma" />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editando ? 'Salvar alterações' : 'Cadastrar aluno'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!transferindo} onClose={() => setTransferindo(null)} title={`Transferir Aluno`}>
        {transferindo && (
          <form onSubmit={handleTransfer} className="modal-form">
            <p className="transfer-info">
              Transferindo <strong>{transferindo.nome}</strong> para outra turma.
            </p>
            <Select
              label="Nova turma"
              value={formTransfer.turma_id}
              onChange={(e) => setFormTransfer({ turma_id: e.target.value })}
              error={errorsTransfer.turma_id}
              options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))}
              placeholder="Selecione a turma de destino"
            />
            <div className="form-actions">
              <Button variant="ghost" onClick={() => setTransferindo(null)}>Cancelar</Button>
              <Button type="submit" loading={saving}>Transferir</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Excluir aluno?" message={`Tem certeza que deseja excluir "${remover?.nome}"?`} confirmText="Excluir" danger />
    </div>
  )
}
