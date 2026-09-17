import React, { useEffect, useState, useCallback } from 'react'
import { turmaService } from '../services/turmaService'
import { periodoService } from '../services/periodoService'
import { penalidadeService } from '../services/penalidadeService'
import { auditService } from '../services/auditService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/Button'
import Select from '../components/Select'
import Input from '../components/Input'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { formatDate, formatDateTime, formatPoints, dataAtualISO } from '../utils/format'
import { validators } from '../utils/validators'

const estadoInicial = {
  turma_id: '',
  periodo_id: '',
  penalidade_id: '',
  data_aplicacao: dataAtualISO(),
  descricao: '',
  observacao: ''
}

export default function Penalidades() {
  const { profile, isAdmin } = useAuth()
  const { success, error } = useToast()

  const [turmas, setTurmas] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [aplicacoes, setAplicacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(estadoInicial)
  const [errors, setErrors] = useState({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dadosConfirmacao, setDadosConfirmacao] = useState({})
  const [excluir, setExcluir] = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tm, pe, cat, ap] = await Promise.all([
        turmaService.listarAtivas(),
        periodoService.listar(),
        penalidadeService.listarCatalogo(),
        penalidadeService.listarAplicacoes()
      ])
      setTurmas(tm)
      setPeriodos(pe)
      setCatalogo(cat)
      setAplicacoes(ap)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  const penalidadeSel = catalogo.find((p) => p.id === form.penalidade_id)

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    errs.turma_id = validators.required(form.turma_id, 'Turma')
    errs.periodo_id = validators.required(form.periodo_id, 'Período')
    errs.penalidade_id = validators.required(form.penalidade_id, 'Penalidade')
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const turma = turmas.find((t) => t.id === form.turma_id)

    setDadosConfirmacao({
      turma: turma?.nome,
      penalidade: penalidadeSel?.nome,
      pontos: penalidadeSel?.pontos,
      periodo: periodos.find((p) => p.id === form.periodo_id)?.nome,
      data: form.data_aplicacao
    })
    setConfirmOpen(true)
  }

  async function confirmarAplicacao() {
    setSaving(true)
    try {
      const aplicacao = {
        turma_id: form.turma_id,
        periodo_id: form.periodo_id,
        penalidade_id: form.penalidade_id,
        professor_id: profile.id,
        pontos: penalidadeSel.pontos,
        data_aplicacao: form.data_aplicacao,
        descricao: form.descricao,
        observacao: form.observacao
      }
      const criado = await penalidadeService.aplicar(aplicacao)

      await auditService.registrar({
        acao: `${profile.nome} aplicou ${penalidadeSel.pontos} pontos para ${dadosConfirmacao.turma} (${penalidadeSel.nome})`,
        tabela: 'aplicacoes_penalidades',
        registroId: criado.id,
        tipoOperacao: 'INSERT',
        dadosNovos: aplicacao
      })

      success('Penalidade aplicada com sucesso!')
      setConfirmOpen(false)
      setForm({ ...estadoInicial, data_aplicacao: dataAtualISO() })
      load()
    } catch (err) {
      error(err.message || 'Erro ao aplicar penalidade.')
    } finally {
      setSaving(false)
    }
  }

  function confirmarExclusao(ap) {
    setExcluir(ap)
    setConfirmExcluir(true)
  }

  async function handleDelete() {
    if (!excluir) return
    try {
      await penalidadeService.excluir(excluir.id)
      await auditService.registrar({
        acao: `Penalidade excluída para ${excluir.turmas?.nome}`,
        tabela: 'aplicacoes_penalidades',
        registroId: excluir.id,
        tipoOperacao: 'DELETE',
        dadosAnteriores: excluir
      })
      success('Penalidade removida.')
      setConfirmExcluir(false)
      load()
    } catch (err) {
      error(err.message)
    }
  }

  const columns = [
    { header: 'Data', key: 'data', render: (a) => formatDate(a.data_aplicacao) },
    { header: 'Turma', key: 'turma', render: (a) => a.turmas?.nome || '-' },
    { header: 'Período', key: 'periodo', render: (a) => a.periodos?.nome || '-' },
    { header: 'Penalidade', key: 'penalidade', render: (a) => a.penalidades?.nome || '-' },
    { header: 'Pontos', key: 'pontos', render: (a) => <strong className="text-negative">{formatPoints(a.pontos)}</strong> },
    { header: 'Responsável', key: 'prof', render: (a) => a.profiles?.nome || '-' },
    {
      header: 'Ações',
      key: 'acoes',
      render: (a) => (isAdmin || a.professor_id === profile.id) ? (
        <button className="btn btn-danger btn-sm" onClick={() => confirmarExclusao(a)}>Excluir</button>
      ) : null
    }
  ]

  if (loading) return <Loading fullPage label="Carregando..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">⚠️ Penalidades</h1>
        <p className="page-subtitle">Aplicar penalidades conforme o regulamento da competição.</p>
      </div>

      <div className="dash-grid-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Aplicar penalidade</h2></div>
          <form onSubmit={handleSubmit} className="modal-form">
            <Select label="Turma" value={form.turma_id} onChange={(e) => setForm({ ...form, turma_id: e.target.value })} error={errors.turma_id} options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))} placeholder="Selecione a turma" />
            <Select label="Período" value={form.periodo_id} onChange={(e) => setForm({ ...form, periodo_id: e.target.value })} error={errors.periodo_id} options={periodos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecione o período" />
            <Select label="Penalidade" value={form.penalidade_id} onChange={(e) => setForm({ ...form, penalidade_id: e.target.value })} error={errors.penalidade_id} options={catalogo.map((p) => ({ value: p.id, label: `${p.nome} (${p.pontos} pts)` }))} placeholder="Selecione a penalidade" />
            <Input label="Data" type="date" value={form.data_aplicacao} onChange={(e) => setForm({ ...form, data_aplicacao: e.target.value })} />
            <Input label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da ocorrência" />
            <Input label="Observação / Evidência" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Detalhes, justificativa" />
            {penalidadeSel && (
              <div className="penalidade-info">
                <Badge color="danger">{penalidadeSel.pontos} pontos</Badge>
                <p className="penalidade-desc">{penalidadeSel.descricao}</p>
              </div>
            )}
            <Button type="submit" fullWidth>Revisar penalidade</Button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">📋 Catálogo de penalidades</h2></div>
          <div className="catalogo-list">
            {catalogo.map((p) => (
              <div key={p.id} className="catalogo-item">
                <div className="catalogo-info">
                  <strong>{p.nome}</strong>
                  <small>{p.descricao}</small>
                </div>
                <Badge color="danger">{p.pontos} pts</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2 className="card-title">📜 Penalidades aplicadas</h2></div>
        {aplicacoes.length > 0 ? (
          <Table
            columns={columns}
            data={aplicacoes.filter((a) => isAdmin || a.professor_id === profile.id)}
          />
        ) : (
          <EmptyState icon="⚠️" title="Nenhuma penalidade aplicada" />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarAplicacao}
        loading={saving}
        title="Confirmar penalidade?"
        message={`Tem certeza que deseja aplicar "${dadosConfirmacao.penalidade}" (${dadosConfirmacao.pontos} pontos) para a turma "${dadosConfirmacao.turma}"?`}
        confirmText="Aplicar penalidade"
        danger
      />

      <ConfirmDialog
        open={confirmExcluir}
        onClose={() => setConfirmExcluir(false)}
        onConfirm={handleDelete}
        title="Excluir penalidade?"
        message={`Excluir a penalidade de "${excluir?.turmas?.nome}"?`}
        confirmText="Excluir"
        danger
      />
    </div>
  )
}
