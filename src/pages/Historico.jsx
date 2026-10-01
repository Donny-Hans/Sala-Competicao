import React, { useEffect, useState, useCallback } from 'react'
import { pontuacaoService } from '../services/pontuacaoService'
import { penalidadeService } from '../services/penalidadeService'
import { turmaService } from '../services/turmaService'
import { periodoService } from '../services/periodoService'
import { criterioService } from '../services/criterioService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { auditService } from '../services/auditService'
import Select from '../components/Select'
import Input from '../components/Input'
import Table from '../components/Table'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import Button from '../components/Button'
import { formatDateTime, formatPoints } from '../utils/format'
import { validators } from '../utils/validators'

const TABELAS_LANCAMENTOS = ['pontuacoes', 'aplicacoes_penalidades']

const estadoEdicaoInicial = {
  turma_id: '',
  periodo_id: '',
  criterio_id: '',
  penalidade_id: '',
  pontos: '',
  observacao: '',
  descricao: '',
  data_aplicacao: ''
}

const corOperacao = (op) => (op === 'INSERT' ? 'success' : op === 'UPDATE' ? 'info' : 'danger')

const rotuloOperacao = (op) =>
  op === 'INSERT' ? 'Lançamento' : op === 'UPDATE' ? 'Edição' : 'Exclusão'

export default function Historico() {
  const { profile, isAdmin, isGestor } = useAuth()
  const { success, error } = useToast()

  const [pontuacoes, setPontuacoes] = useState([])
  const [penalidades, setPenalidades] = useState([])
  const [auditorias, setAuditorias] = useState([])
  const [turmas, setTurmas] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [criterios, setCriterios] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroProfessor, setFiltroProfessor] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [excluir, setExcluir] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState(estadoEdicaoInicial)
  const [editErrors, setEditErrors] = useState({})
  const [editDisponivel, setEditDisponivel] = useState(null)
  const [modalEdicao, setModalEdicao] = useState(false)
  const [savingEdicao, setSavingEdicao] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pos, pen, aud, tm, pe, cr, cat] = await Promise.all([
        pontuacaoService.listar(),
        penalidadeService.listarAplicacoes(),
        auditService.listarMeus(profile?.id),
        turmaService.listarAtivas(),
        periodoService.listar(),
        criterioService.listarAtivos(),
        penalidadeService.listarCatalogo()
      ])
      const posNorm = (pos || []).map((p) => ({
        tipo: 'positivo',
        id: p.id,
        created_at: p.created_at,
        professor: p.profiles?.nome || '-',
        professor_id: p.professor_id,
        turma: p.turmas?.nome || '-',
        turma_id: p.turma_id,
        periodo: p.periodos?.nome || '-',
        periodo_id: p.periodo_id,
        item: p.criterios?.nome || '-',
        criterio_id: p.criterio_id,
        pontos: p.pontos,
        observacao: p.observacao,
        anterior: p
      }))
      const penNorm = (pen || []).map((p) => ({
        tipo: 'penalidade',
        id: p.id,
        created_at: p.created_at,
        professor: p.profiles?.nome || '-',
        professor_id: p.professor_id,
        turma: p.turmas?.nome || '-',
        turma_id: p.turma_id,
        periodo: p.periodos?.nome || '-',
        periodo_id: p.periodo_id,
        item: p.penalidades?.nome || '-',
        penalidade_id: p.penalidade_id,
        pontos: p.pontos,
        observacao: p.observacao,
        descricao: p.descricao,
        data_aplicacao: p.data_aplicacao,
        anterior: p
      }))
      setPontuacoes(posNorm)
      setPenalidades(penNorm)
      setAuditorias((aud || []).filter((a) => TABELAS_LANCAMENTOS.includes(a.tabela)))
      setTurmas(tm)
      setPeriodos(pe)
      setCriterios(cr)
      setCatalogo(cat)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error, profile?.id])

  useEffect(() => { load() }, [load])

  let combinado = [...pontuacoes, ...penalidades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (!isGestor) {
    combinado = combinado.filter((c) => c.professor_id === profile.id)
  }

  if (filtroTipo) combinado = combinado.filter((c) => c.tipo === filtroTipo)
  if (filtroProfessor) combinado = combinado.filter((c) => c.professor_id === filtroProfessor)
  if (filtroData) {
    combinado = combinado.filter((c) => {
      const d = new Date(c.created_at)
      return d.toISOString().split('T')[0] === filtroData
    })
  }
  if (search) {
    const s = search.toLowerCase()
    combinado = combinado.filter((c) =>
      c.turma.toLowerCase().includes(s) ||
      c.item.toLowerCase().includes(s) ||
      c.professor.toLowerCase().includes(s) ||
      c.periodo.toLowerCase().includes(s) ||
      (c.observacao || '').toLowerCase().includes(s)
    )
  }

  const professores = [...new Set([...pontuacoes, ...penalidades].map((c) => c.professor_id))].map((id) => {
    const item = [...pontuacoes, ...penalidades].find((c) => c.professor_id === id)
    return { value: id, label: item?.professor }
  })

  // Regra de autoria: só o admin edita/exclui lançamentos de terceiros.
  const podeEditar = (c) => isAdmin || c.professor_id === profile.id

  function abrirEdicao(c) {
    setEditando(c)
    setEditForm({
      turma_id: c.turma_id || '',
      periodo_id: c.periodo_id || '',
      criterio_id: c.criterio_id || '',
      penalidade_id: c.penalidade_id || '',
      pontos: c.pontos ?? '',
      observacao: c.observacao || '',
      descricao: c.descricao || '',
      data_aplicacao: c.data_aplicacao || ''
    })
    setEditErrors({})
    setModalEdicao(true)
  }

  const criterioEdicao = criterios.find((c) => c.id === editForm.criterio_id)
  const penalidadeEdicao = catalogo.find((p) => p.id === editForm.penalidade_id)

  useEffect(() => {
    if (!modalEdicao || !editando || editando.tipo !== 'positivo' || !criterioEdicao) {
      setEditDisponivel(null)
      return
    }
    if (!editForm.turma_id || !editForm.periodo_id) {
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
        if (!cancelado) setEditDisponivel(criterioEdicao.pontos_maximos - (soma - proprio))
      } catch {
        if (!cancelado) setEditDisponivel(null)
      }
    }
    calcular()
    return () => { cancelado = true }
  }, [modalEdicao, editando, editForm.turma_id, editForm.periodo_id, editForm.criterio_id, criterioEdicao])

  async function handleSalvarEdicao(e) {
    e.preventDefault()
    const errs = {}

    errs.turma_id = validators.required(editForm.turma_id, 'Turma')
    errs.periodo_id = validators.required(editForm.periodo_id, 'Período')

    let payload
    let descricaoAlteracao

    if (editando.tipo === 'positivo') {
      errs.criterio_id = validators.required(editForm.criterio_id, 'Critério')
      errs.pontos = validators.pontuacao(editForm.pontos, criterioEdicao?.pontos_maximos || Infinity)
      if (!errs.pontos && editDisponivel !== null && Number(editForm.pontos) > editDisponivel) {
        errs.pontos = `Limite restante para este critério/período: ${editDisponivel} pontos.`
      }
      payload = {
        turma_id: editForm.turma_id,
        periodo_id: editForm.periodo_id,
        criterio_id: editForm.criterio_id,
        pontos: Number(editForm.pontos),
        observacao: editForm.observacao
      }
      descricaoAlteracao = `+${editando.pontos} → +${editForm.pontos} pontos (${editando.item})`
    } else {
      errs.penalidade_id = validators.required(editForm.penalidade_id, 'Penalidade')
      errs.data_aplicacao = validators.required(editForm.data_aplicacao, 'Data')
      payload = {
        turma_id: editForm.turma_id,
        periodo_id: editForm.periodo_id,
        penalidade_id: editForm.penalidade_id,
        pontos: penalidadeEdicao?.pontos ?? editando.pontos,
        data_aplicacao: editForm.data_aplicacao,
        descricao: editForm.descricao,
        observacao: editForm.observacao
      }
      descricaoAlteracao = `${editando.pontos} → ${payload.pontos} pontos (${editando.item})`
    }

    setEditErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSavingEdicao(true)
    try {
      if (editando.tipo === 'positivo') {
        await pontuacaoService.atualizar(editando.id, payload)
        await auditService.registrar({
          acao: `${profile.nome} editou o lançamento de ${descricaoAlteracao} na turma ${editando.turma}`,
          tabela: 'pontuacoes',
          registroId: editando.id,
          tipoOperacao: 'UPDATE',
          dadosAnteriores: editando.anterior,
          dadosNovos: payload
        })
      } else {
        await penalidadeService.atualizarAplicacao(editando.id, payload)
        await auditService.registrar({
          acao: `${profile.nome} editou a penalidade de ${descricaoAlteracao} na turma ${editando.turma}`,
          tabela: 'aplicacoes_penalidades',
          registroId: editando.id,
          tipoOperacao: 'UPDATE',
          dadosAnteriores: editando.anterior,
          dadosNovos: payload
        })
      }
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
      if (excluir.tipo === 'positivo') {
        await pontuacaoService.excluir(excluir.id)
        await auditService.registrar({
          acao: `${profile.nome} excluiu o lançamento de +${excluir.pontos} pontos (${excluir.item}) da turma ${excluir.turma}, lançado por ${excluir.professor}`,
          tabela: 'pontuacoes',
          registroId: excluir.id,
          tipoOperacao: 'DELETE',
          dadosAnteriores: excluir.anterior
        })
      } else {
        await penalidadeService.excluir(excluir.id)
        await auditService.registrar({
          acao: `${profile.nome} excluiu a penalidade de ${excluir.pontos} pontos (${excluir.item}) da turma ${excluir.turma}, lançada por ${excluir.professor}`,
          tabela: 'aplicacoes_penalidades',
          registroId: excluir.id,
          tipoOperacao: 'DELETE',
          dadosAnteriores: excluir.anterior
        })
      }
      success('Registro excluído.')
      setConfirmDelete(false)
      load()
    } catch (err) {
      error(err.message)
    }
  }

  const columns = [
    { header: 'Data', key: 'data', render: (c) => formatDateTime(c.created_at) },
    { header: 'Professor', key: 'professor', render: (c) => (c.professor_id === profile.id ? <strong>{c.professor} (você)</strong> : c.professor) },
    { header: 'Turma', key: 'turma' },
    { header: 'Período', key: 'periodo' },
    { header: 'Critério', key: 'item' },
    { header: 'Tipo', key: 'tipo', render: (c) => <Badge color={c.tipo === 'positivo' ? 'success' : 'danger'}>{c.tipo === 'positivo' ? 'Positivo' : 'Penalidade'}</Badge> },
    { header: 'Pontos', key: 'pontos', render: (c) => <strong className={c.tipo === 'positivo' ? 'text-positive' : 'text-negative'}>{c.pontos > 0 ? `+${formatPoints(c.pontos)}` : formatPoints(c.pontos)}</strong> },
    { header: 'Observação', key: 'obs', render: (c) => c.observacao || '-' },
    {
      header: 'Ações',
      key: 'acoes',
      render: (c) => (podeEditar(c) ? (
        <div className="row-actions">
          <button className="btn btn-info btn-sm" onClick={() => abrirEdicao(c)}>Editar</button>
          <button className="btn btn-danger btn-sm" onClick={() => { setExcluir(c); setConfirmDelete(true) }}>Excluir</button>
        </div>
      ) : null)
    }
  ]

  const colunasAuditoria = [
    { header: 'Data', key: 'data', render: (a) => formatDateTime(a.created_at) },
    { header: 'Operação', key: 'tipo', render: (a) => <Badge color={corOperacao(a.tipo_operacao)}>{rotuloOperacao(a.tipo_operacao)}</Badge> },
    { header: 'Professor', key: 'professor', render: (a) => a.profiles?.nome || '-' },
    { header: 'Registros', key: 'tabela', render: (a) => (a.tabela === 'pontuacoes' ? 'Pontos positivos' : 'Penalidades') },
    { header: 'Descrição da alteração', key: 'acao' }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">📜 Histórico de Lançamentos</h1>
        <p className="page-subtitle">Todos os lançamentos de pontos e penalidades registrados.</p>
      </div>

      <div className="toolbar toolbar-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar em todos os campos..." />
        <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} options={[{ value: 'positivo', label: 'Positivos' }, { value: 'penalidade', label: 'Penalidades' }]} placeholder="Todos os tipos" className="width-160" />
        {isGestor && (
          <Select value={filtroProfessor} onChange={(e) => setFiltroProfessor(e.target.value)} options={professores} placeholder="Todos os professores" className="width-200" />
        )}
        <Input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} className="width-180" label="" />
      </div>

      {loading ? <Loading skeleton /> : (
        combinado.length > 0 ? (
          <div className="card">
            <Table columns={columns} data={combinado.slice(0, 100)} />
          </div>
        ) : (
          <EmptyState icon="📜" title="Nenhum lançamento encontrado" description="Ajuste os filtros ou registre novas pontuações." />
        )
      )}

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 className="card-title">🕵️ Minhas alterações</h2>
        </div>
        {auditorias.length > 0 ? (
          <Table columns={colunasAuditoria} data={auditorias.slice(0, 50)} />
        ) : (
          <EmptyState icon="🕵️" title="Nenhuma alteração registrada" description="Quando você lançar, editar ou excluir um registro, a alteração aparecerá aqui." />
        )}
      </div>

      <Modal
        open={modalEdicao}
        onClose={() => setModalEdicao(false)}
        title={editando?.tipo === 'positivo' ? 'Editar Lançamento de Pontos' : 'Editar Penalidade'}
      >
        <form onSubmit={handleSalvarEdicao} className="modal-form">
          <Select label="Período" value={editForm.periodo_id} onChange={(e) => setEditForm({ ...editForm, periodo_id: e.target.value })} error={editErrors.periodo_id} options={periodos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecione o período" />
          <Select label="Turma" value={editForm.turma_id} onChange={(e) => setEditForm({ ...editForm, turma_id: e.target.value })} error={editErrors.turma_id} options={turmas.map((t) => ({ value: t.id, label: `${t.nome} - ${t.serie}` }))} placeholder="Selecione a turma" />

          {editando?.tipo === 'positivo' ? (
            <>
              <Select label="Critério" value={editForm.criterio_id} onChange={(e) => setEditForm({ ...editForm, criterio_id: e.target.value })} error={editErrors.criterio_id} options={criterios.map((c) => ({ value: c.id, label: `${c.nome} (${c.categoria})` }))} placeholder="Selecione o critério" />
              <Input
                label="Pontuação"
                type="number"
                min="1"
                max={criterioEdicao?.pontos_maximos || undefined}
                value={editForm.pontos}
                onChange={(e) => setEditForm({ ...editForm, pontos: e.target.value })}
                error={editErrors.pontos}
                hint={criterioEdicao ? `Máximo: ${criterioEdicao.pontos_maximos} pontos${editDisponivel !== null ? ` · disponível: ${editDisponivel}` : ''}` : undefined}
              />
              <Input label="Observação" value={editForm.observacao} onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })} />
            </>
          ) : (
            <>
              <Select
                label="Penalidade"
                value={editForm.penalidade_id}
                onChange={(e) => setEditForm({ ...editForm, penalidade_id: e.target.value })}
                error={editErrors.penalidade_id}
                options={catalogo.map((p) => ({ value: p.id, label: `${p.nome} (${p.pontos} pts)` }))}
                placeholder="Selecione a penalidade"
              />
              <Input label="Data" type="date" value={editForm.data_aplicacao} onChange={(e) => setEditForm({ ...editForm, data_aplicacao: e.target.value })} error={editErrors.data_aplicacao} />
              <Input label="Descrição" value={editForm.descricao} onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })} />
              <Input label="Observação / Evidência" value={editForm.observacao} onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })} />
            </>
          )}

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
        title="Excluir registro?"
        message={`Excluir o lançamento de "${excluir?.item}" para "${excluir?.turma}"? A exclusão ficará registrada em "Minhas alterações" com o seu nome.`}
        confirmText="Excluir"
        danger
      />
    </div>
  )
}