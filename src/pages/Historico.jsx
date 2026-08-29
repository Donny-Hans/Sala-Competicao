import React, { useEffect, useState, useCallback } from 'react'
import { pontuacaoService } from '../services/pontuacaoService'
import { penalidadeService } from '../services/penalidadeService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { auditService } from '../services/auditService'
import Select from '../components/Select'
import Input from '../components/Input'
import Table from '../components/Table'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { formatDateTime, formatPoints } from '../utils/format'

export default function Historico() {
  const { profile, isAdmin } = useAuth()
  const { success, error } = useToast()

  const [pontuacoes, setPontuacoes] = useState([])
  const [penalidades, setPenalidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroProfessor, setFiltroProfessor] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [excluir, setExcluir] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pos, pen] = await Promise.all([
        pontuacaoService.listar(),
        penalidadeService.listarAplicacoes()
      ])
      const posNorm = (pos || []).map((p) => ({
        tipo: 'positivo',
        id: p.id,
        created_at: p.created_at,
        professor: p.profiles?.nome || '-',
        professor_id: p.professor_id,
        turma: p.turmas?.nome || '-',
        periodo: p.periodos?.nome || '-',
        item: p.criterios?.nome || '-',
        pontos: p.pontos,
        observacao: p.observacao
      }))
      const penNorm = (pen || []).map((p) => ({
        tipo: 'penalidade',
        id: p.id,
        created_at: p.created_at,
        professor: p.profiles?.nome || '-',
        professor_id: p.professor_id,
        turma: p.turmas?.nome || '-',
        periodo: p.periodos?.nome || '-',
        item: p.penalidades?.nome || '-',
        pontos: p.pontos,
        observacao: p.observacao
      }))
      setPontuacoes(posNorm)
      setPenalidades(penNorm)
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  let combinado = [...pontuacoes, ...penalidades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (!isAdmin) {
    combinado = combinado.filter((c) => c.professor_id === profile.id)
  }

  if (filtroTipo) combinado = combinado.filter((c) => c.tipo === filtroTipo)
  if (filtroProfessor) combinado = combinado.filter((c) => c.professor_id === filtroProfessor)
  if (filtroData) {
    const dia = filtroData
    combinado = combinado.filter((c) => {
      const d = new Date(c.created_at)
      return d.toISOString().split('T')[0] === dia
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

  const columns = [
    { header: 'Data', key: 'data', render: (c) => formatDateTime(c.created_at) },
    { header: 'Professor', key: 'professor' },
    { header: 'Turma', key: 'turma' },
    { header: 'Período', key: 'periodo' },
    { header: 'Critério', key: 'item' },
    { header: 'Tipo', key: 'tipo', render: (c) => <Badge color={c.tipo === 'positivo' ? 'success' : 'danger'}>{c.tipo === 'positivo' ? 'Positivo' : 'Penalidade'}</Badge> },
    { header: 'Pontos', key: 'pontos', render: (c) => <strong className={c.tipo === 'positivo' ? 'text-positive' : 'text-negative'}>{c.pontos > 0 ? `+${formatPoints(c.pontos)}` : formatPoints(c.pontos)}</strong> },
    { header: 'Observação', key: 'obs', render: (c) => c.observacao || '-' },
    {
      header: 'Ações',
      key: 'acoes',
      render: (c) => isAdmin ? (
        <button className="btn btn-danger btn-sm" onClick={() => { setExcluir(c); setConfirmDelete(true) }}>Excluir</button>
      ) : null
    }
  ]

  async function handleDelete() {
    if (!excluir) return
    try {
      if (excluir.tipo === 'positivo') {
        await pontuacaoService.excluir(excluir.id)
        await auditService.registrar({
          acao: `Lançamento de ${excluir.pontos} pontos excluído (${excluir.turma})`,
          tabela: 'pontuacoes', registroId: excluir.id, tipoOperacao: 'DELETE', dadosAnteriores: excluir
        })
      } else {
        await penalidadeService.excluir(excluir.id)
        await auditService.registrar({
          acao: `Penalidade excluída (${excluir.turma})`,
          tabela: 'aplicacoes_penalidades', registroId: excluir.id, tipoOperacao: 'DELETE', dadosAnteriores: excluir
        })
      }
      success('Registro excluído.')
      setConfirmDelete(false)
      load()
    } catch (err) {
      error(err.message)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">📜 Histórico de Lançamentos</h1>
        <p className="page-subtitle">Todos os lançamentos de pontos e penalidades registrados.</p>
      </div>

      <div className="toolbar toolbar-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar em todos os campos..." />
        <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} options={[{ value: 'positivo', label: 'Positivos' }, { value: 'penalidade', label: 'Penalidades' }]} placeholder="Todos os tipos" className="width-160" />
        {isAdmin && (
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

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} title="Excluir registro?" message={`Excluir o lançamento de "${excluir?.item}" para "${excluir?.turma}"?`} confirmText="Excluir" danger />
    </div>
  )
}
