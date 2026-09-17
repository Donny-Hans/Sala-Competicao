import React, { useEffect, useState, useCallback } from 'react'
import { calcularRanking, resumoPorCategoria } from '../services/rankingService'
import { turmaService } from '../services/turmaService'
import { periodoService } from '../services/periodoService'
import { pontuacaoService } from '../services/pontuacaoService'
import { penalidadeService } from '../services/penalidadeService'
import { auditService } from '../services/auditService'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/Button'
import Select from '../components/Select'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { formatPoints, formatDateTime } from '../utils/format'

export default function Relatorios() {
  const { success, error } = useToast()
  const [periodos, setPeriodos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [ranking, setRanking] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPeriodo, setFiltroPeriodo] = useState('')
  const [filtroRanking, setFiltroRanking] = useState('')
  const [detalheTurma, setDetalheTurma] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pe, tm, rank, logs] = await Promise.all([
        periodoService.listar(),
        turmaService.listar(),
        calcularRanking({}),
        auditService.listar()
      ])
      setPeriodos(pe)
      setTurmas(tm)
      setRanking(rank.ranking)
      setAuditLogs(logs || [])
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  function imprimir() {
    window.print()
  }

  function exportarCSV() {
    const rows = ranking.map((r) => ({
      Posicao: r.posicao,
      Turma: r.nome,
      Serie: r.serie,
      Positivos: r.pontos_positivos,
      Penalidades: r.penalidades,
      Total: r.total
    }))
    const headers = Object.keys(rows[0] || {})
    const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => r[h]).join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ranking-classe-ouro.csv'
    a.click()
    URL.revokeObjectURL(url)
    success('Relatório CSV exportado.')
  }

  if (loading) return <Loading fullPage label="Gerando relatórios..." />

  return (
    <div className="page-content">
      <div className="page-header page-header-toolbar">
        <div>
          <h1 className="page-title">📊 Relatórios</h1>
          <p className="page-subtitle">Exportar e visualizar relatórios da competição.</p>
        </div>
        <div className="row-actions">
          <Button variant="info" onClick={imprimir}>🖨️ Imprimir</Button>
          <Button onClick={exportarCSV}>⬇️ Exportar CSV</Button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🏆 Ranking Geral</h2>
          <Select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} options={periodos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Todos os períodos" className="width-200" />
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead><tr><th>#</th><th>Turma</th><th>Positivos</th><th>Penalidades</th><th>Total</th></tr></thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.id}>
                  <td>{r.posicao}º</td>
                  <td>{r.nome}</td>
                  <td>+{formatPoints(r.pontos_positivos)}</td>
                  <td className={r.penalidades < 0 ? 'text-negative' : ''}>{formatPoints(r.penalidades)}</td>
                  <td><strong>{formatPoints(r.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-grid-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">🛡️ Auditoria Recente</h2></div>
          {auditLogs.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Data</th><th>Usuário</th><th>Ação</th></tr></thead>
                <tbody>
                  {auditLogs.slice(0, 20).map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td>{log.profiles?.nome || 'Sistema'}</td>
                      <td>{log.acao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="🛡️" title="Nenhum log de auditoria" />
          )}
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">🏫 Detalhe por Turma</h2></div>
          <Select value={filtroRanking} onChange={async (e) => {
            setFiltroRanking(e.target.value)
            if (e.target.value) {
              const cat = await resumoPorCategoria(e.target.value, filtroPeriodo || null)
              const t = turmas.find((x) => x.id === e.target.value)
              setDetalheTurma({ ...t, categorias: cat })
            } else {
              setDetalheTurma(null)
            }
          }} options={turmas.map((t) => ({ value: t.id, label: t.nome }))} placeholder="Selecione uma turma" />
          {detalheTurma && (
            <div className="margin-top">
              <h3 className="form-section-title">{detalheTurma.nome} — {detalheTurma.serie}</h3>
              <table className="table">
                <thead><tr><th>Categoria</th><th>Pontos</th></tr></thead>
                <tbody>
                  {Object.entries(detalheTurma.categorias || {}).map(([cat, pts]) => (
                    <tr key={cat}><td>{cat}</td><td>{formatPoints(pts)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
