import React, { useEffect, useState, useCallback } from 'react'
import { turmaService } from '../services/turmaService'
import { periodoService } from '../services/periodoService'
import { criterioService } from '../services/criterioService'
import { pontuacaoService } from '../services/pontuacaoService'
import { auditService } from '../services/auditService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/Button'
import Select from '../components/Select'
import Input from '../components/Input'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { formatDateTime, formatPoints } from '../utils/format'
import { validators } from '../utils/validators'

const estadoEdicaoInicial = {
  periodo_id: '',
  turma_id: '',
  criterio_id: '',
  pontos: '',
  observacao: ''
}

export default function Pontuacoes() {
  const { profile, isAdmin } = useAuth()
  const { success, error } = useToast()

  const [turmas, setTurmas] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [criterios, setCriterios] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    periodo_id: '',
    turma_id: '',
    criterio_id: '',
    pontos: '',
    observacao: ''
  })
  const [errors, setErrors] = useState({})
  const [maxPontos, setMaxPontos] = useState(0)
  const [acumulado, setAcumulado] = useState(0)
  const [disponivel, setDisponivel] = useState(maxPontos)
  const [somaCriterio, setSomaCriterio] = useState(0)

  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState(estadoEdicaoInicial)
  const [editErrors, setEditErrors] = useState({})
  const [editDisponivel, setEditDisponivel] = useState(null)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [savingEdicao, setSavingEdicao] = useState(false)
  const [excluir, setExcluir] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tm, pe, cr, lista] = await Promise.all([
        turmaService.listarAtivas(),
        periodoService.listarAtivos(),
        criterioService.listarAtivos(),
        pontuacaoService.listar()
      ])
      setTurmas(tm)
      setPeriodos(pe)
      setCriterios(cr)
      setLancamentos(lista || [])
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  const criterioSelecionado = criterios.find((c) => c.id === form.criterio_id)

  useEffect(() => {
    if (criterioSelecionado) {
      setMaxPontos(criterioSelecionado.pontos_maximos)
    } else {
      setMaxPontos(0)
    }
  }, [form.criterio_id])

  useEffect(() => {
    async function calcularAcumulado() {
      if (form.turma_id && form.criterio_id) {
        try {
          const data = await pontuacaoService.somaPorCriterio(form.turma_id, form.periodo_id || null)
          const soma = data
            .filter((p) => p.criterio_id === form.criterio_id)
            .reduce((s, p) => s + p.pontos, 0)
          setSomaCriterio(soma)
          setAcumulado(data.reduce((s, p) => s + p.pontos, 0))
          setDisponivel(maxPontos - soma)
        } catch (err) {
          console.error(err)
        }
      } else {
        setSomaCriterio(0)
        setAcumulado(0)
        setDisponivel(maxPontos)
      }
    }
    calcularAcumulado()
  }, [form.turma_id, form.criterio_id, form.periodo_id, maxPontos])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    errs.periodo_id = validators.required(form.periodo_id, 'Período')
    errs.turma_id = validators.required(form.turma_id, 'Turma')
    errs.criterio_id = validators.required(form.criterio_id, 'Critério')
    errs.pontos = validators.number(form.pontos, 'Pontuação')

    if (!errs.pontos && maxPontos > 0) {
      errs.pontos = validators.pontuacao(form.pontos, maxPontos)
    }

    if (!errs.pontos && form.pontos && Number(form.pontos) > disponivel) {
      errs.pontos = `Limite restante para este critério/período: ${disponivel} pontos. Você já lançou ${somaCriterio}.`
    }

    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    try {
      const pontuacao = {
        turma_id: form.turma_id,
        periodo_id: form.periodo_id,
        criterio_id: form.criterio_id,
        professor_id: profile.id,
        pontos: Number(form.pontos),
        observacao: form.observacao
      }
      const criado = await pontuacaoService.registrar(pontuacao)

      await auditService.registrar({
        acao: `${profile.nome} lançou +${form.pontos} pontos para ${criterioSelecionado.nome} na turma ${turmas.find((t) => t.id === form.turma_id)?.nome || ''}`,
        tabela: 'pontuacoes',
        registroId: criado.id,
        tipoOperacao: 'INSERT',
        dadosNovos: pontuacao
      })

      success(`Pontuação registrada com sucesso! +${form.pontos} pontos.`)
      setForm({ periodo_id: '', turma_id: '', criterio_id: '', pontos: '', observacao: '' })
      setSomaCriterio(0)
      setAcumulado(0)
      load()
    } catch (err) {
      error(err.message || 'Erro ao registrar pontuação.')
    } finally {
      setSaving(false)
    }
  }

  let visiveis = lancamentos
  if (!isAdmin) visiveis = visiveis.filter((p) => p.professor_id === profile.id)
  if (form.turma_id) visiveis = visiveis.filter((p) => p.turma_id === form.turma_id)
  if (form.periodo_id) visiveis = visiveis.filter((p) => p.periodo_id === form.periodo_id)

  const criterioEdit = criterios.find((c) => c.id === editForm.criterio_id)

  useEffect(() => {
    if (!modalEdicao || !editando) {
      setEditDisponivel(null)
      return
    }
    if (!editForm.turma_id || !editForm.periodo_id || !criterioEdit) {
      setEditDisponivel(null)
      return
    }
    let cancelado = false
    async function calcular() {
      try {
        const data = await pontuacaoService.somaPorCriterio(editForm.turma_id, editForm.periodo_id)
        const soma = data
          .filter((p) => p.criterio_id === editForm.criterio_id)
          .reduce((s, p) => s + p.pontos, 0)
        const proprio =
          editando.criterio_id === editForm.criterio_id &&
          editando.turma_id === editForm.turma_id &&
          editando.periodo_id === editForm.periodo_id
            ? editando.pontos
            : 0
        if (!cancelado) setEditDisponivel(criterioEdit.pontos_maximos - (soma - proprio))
      } catch {
        if (!cancelado) setEditDisponivel(null)
      }
    }
    calcular()
    return () => { cancelado = true }
  }, [modalEdicao, editando, editForm.turma_id, editForm.periodo_id, editForm.criterio_id, criterioEdit])

  function abrirEdicao(p) {
    setEditando(p)
    setEditForm({
      periodo_id: p.periodo_id,
      turma_id: p.turma_id,
      criterio_id: p.criterio_id,
      pontos: p.pontos,
      observacao: p.observacao || ''
    })
    setEditErrors({})
    setModalEdicao(true)
  }

  async function handleSalvarEdicao(e) {
    e.preventDefault()
    const errs = {}
    errs.periodo_id = validators.required(editForm.periodo_id, 'Período')
    errs.turma_id = validators.required(editForm.turma_id, 'Turma')
    errs.criterio_id = validators.required(editForm.criterio_id, 'Critério')
    errs.pontos = validators.pontuacao(editForm.pontos, criterioEdit?.pontos_maximos || Infinity)
    if (!errs.pontos && editDisponivel !== null && Number(editForm.pontos) > editDisponivel) {
      errs.pontos = `Limite restante para este critério/período: ${editDisponivel} pontos.`
    }
    setEditErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const payload = {
      turma_id: editForm.turma_id,
      periodo_id: editForm.periodo_id,
      criterio_id: editForm.criterio_id,
      pontos: Number(editForm.pontos),
      observacao: editForm.observacao
    }

    setSavingEdicao(true)
    try {
      await pontuacaoService.atualizar(editando.id, payload)
      await auditService.registrar({
        acao: `${profile.nome} editou o lançamento de +${editando.pontos} → +${payload.pontos} pontos (${editando.criterios?.nome || ''}) na turma ${editando.turmas?.nome || ''}`,
        tabela: 'pontuacoes',
        registroId: editando.id,
        tipoOperacao: 'UPDATE',
        dadosAnteriores: editando,
        dadosNovos: payload
      })
      success('Lançamento atualizado.')
      setModalEdicao(false)
      load()
    } catch (err) {
      error(err.message || 'Erro ao atualizar lançamento.')
    } finally {
      setSavingEdicao(false)
    }
  }

  async function handleDelete() {
    if (!excluir) return
    try {
      await pontuacaoService.excluir(excluir.id)
      await auditService.registrar({
        acao: `${profile.nome} excluiu o lançamento de +${excluir.pontos} pontos (${excluir.criterios?.nome || ''}) da turma ${excluir.turmas?.nome || ''}, lançado por ${excluir.profiles?.nome || '—'}`,
        tabela: 'pontuacoes',
        registroId: excluir.id,
        tipoOperacao: 'DELETE',
        dadosAnteriores: excluir
      })
      success('Lançamento excluído.')
      setConfirmDelete(false)
      load()
    } catch (err) {
      error(err.message)
    }
  }

  const columns = [
    { header: 'Data', key: 'data', render: (p) => formatDateTime(p.created_at) },
    { header: 'Professor', key: 'professor', render: (p) => (p.profiles?.nome || '-') },
    { header: 'Turma', key: 'turma', render: (p) => p.turmas?.nome || '-' },
    { header: 'Período', key: 'periodo', render: (p) => p.periodos?.nome || '-' },
    { header: 'Critério', key: 'criterio', render: (p) => p.criterios?.nome || '-' },
    { header: 'Pontos', key: 'pontos', render: (p) => <strong className="text-positive">+{formatPoints(p.pontos)}</strong> },
    { header: 'Observação', key: 'obs', render: (p) => p.observacao || '-' },
    {
      header: 'Ações',
      key: 'acoes',
      render: (p) => (isAdmin || p.professor_id === profile.id) ? (
        <div className="row-actions">
          <button className="btn btn-info btn-sm" onClick={() => abrirEdicao(p)}>Editar</button>
          <button className="btn btn-danger btn-sm" onClick={() => { setExcluir(p); setConfirmDelete(true) }}>Excluir</button>
        </div>
      ) : null
    }
  ]

  if (loading) return <Loading fullPage label="Carregando formulário..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">⭐ Registrar Pontuação</h1>
        <p className="page-subtitle">Lance pontos positivos para as turmas com base nos critérios do regulamento.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-column">
            <h3 className="form-section-title">Dados do lançamento</h3>
            <Select label="Período" value={form.periodo_id} onChange={(e) => handleChange('periodo_id', e.target.value)} error={errors.periodo_id} options={periodos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecione o período" />
            <Select label="Turma" value={form.turma_id} onChange={(e) => handleChange('turma_id', e.target.value)} error={errors.turma_id} options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))} placeholder="Selecione a turma" />
            <Select label="Critério" value={form.criterio_id} onChange={(e) => handleChange('criterio_id', e.target.value)} error={errors.criterio_id} options={criterios.map((c) => ({ value: c.id, label: `${c.nome} (${c.categoria})` }))} placeholder="Selecione o critério" />
            <Input label="Pontuação" type="number" min="0" max={maxPontos || undefined} value={form.pontos} onChange={(e) => handleChange('pontos', e.target.value)} placeholder="0" error={errors.pontos} hint={maxPontos > 0 ? `Máximo: ${maxPontos} pontos` : undefined} />
            <Input label="Observação" value={form.observacao} onChange={(e) => handleChange('observacao', e.target.value)} placeholder="Observação opcional" />
            <Button type="submit" loading={saving} fullWidth>Registrar pontuação</Button>
          </div>

          <div className="form-column">
            <div className="summary-panel">
              <h3 className="summary-title">Resumo</h3>
              <div className="summary-item">
                <span>Pontos máximos do critério</span>
                <strong className="summary-value">{maxPontos} pts</strong>
              </div>
              <div className="summary-item">
                <span>Já lançados (este período)</span>
                <strong>{somaCriterio} pts</strong>
              </div>
              <div className="summary-item">
                <span>Disponível</span>
                <strong className={disponivel <= 0 ? 'text-negative' : 'text-positive'}>{disponivel} pts</strong>
              </div>
              <hr />
              <div className="summary-item">
                <span>Total acumulado da turma</span>
                <strong className="summary-value">{formatPoints(acumulado)} pts</strong>
              </div>
              <div className="summary-item highlight">
                <span>Pontos que serão lançados</span>
                <strong className="summary-big">{form.pontos ? `+${form.pontos}` : '+0'} pts</strong>
              </div>

              {criterioSelecionado && (
                <div className="summary-criteria">
                  <Badge color="info">{criterioSelecionado.categoria}</Badge>
                  <p className="summary-criteria-nome">{criterioSelecionado.nome}</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">📋 Lançamentos de pontos</h2>
        </div>
        {visiveis.length > 0 ? (
          <Table columns={columns} data={visiveis.slice(0, 50)} />
        ) : (
          <EmptyState
            icon="⭐"
            title="Nenhum lançamento encontrado"
            description={form.turma_id ? 'Ajuste a turma ou o período selecionado acima para ver outros lançamentos.' : 'Registre pontos para uma turma usando o formulário acima.'}
          />
        )}
      </div>

      <Modal open={modalEdicao} onClose={() => setModalEdicao(false)} title="Editar Lançamento de Pontos">
        <form onSubmit={handleSalvarEdicao} className="modal-form">
          <Select label="Período" value={editForm.periodo_id} onChange={(e) => setEditForm({ ...editForm, periodo_id: e.target.value })} error={editErrors.periodo_id} options={periodos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecione o período" />
          <Select label="Turma" value={editForm.turma_id} onChange={(e) => setEditForm({ ...editForm, turma_id: e.target.value })} error={editErrors.turma_id} options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))} placeholder="Selecione a turma" />
          <Select label="Critério" value={editForm.criterio_id} onChange={(e) => setEditForm({ ...editForm, criterio_id: e.target.value })} error={editErrors.criterio_id} options={criterios.map((c) => ({ value: c.id, label: `${c.nome} (${c.categoria})` }))} placeholder="Selecione o critério" />
          <Input
            label="Pontuação"
            type="number"
            min="1"
            max={criterioEdit?.pontos_maximos || undefined}
            value={editForm.pontos}
            onChange={(e) => setEditForm({ ...editForm, pontos: e.target.value })}
            error={editErrors.pontos}
            hint={criterioEdit ? `Máximo: ${criterioEdit.pontos_maximos} pontos${editDisponivel !== null ? ` · disponível: ${editDisponivel}` : ''}` : undefined}
          />
          <Input label="Observação" value={editForm.observacao} onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })} />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setModalEdicao(false)}>Cancelar</Button>
            <Button type="submit" loading={savingEdicao}>Salvar alterações</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Excluir lançamento?"
        message={`Excluir os +${excluir?.pontos ?? 0} pontos de "${excluir?.criterios?.nome || ''}" da turma "${excluir?.turmas?.nome || ''}"? A exclusão ficará registrada no histórico de alterações com o seu nome.`}
        confirmText="Excluir"
        danger
      />
    </div>
  )
}