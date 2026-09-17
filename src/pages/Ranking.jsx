import React, { useEffect, useState, useCallback } from 'react'
import { calcularRanking } from '../services/rankingService'
import { periodoService } from '../services/periodoService'
import { turmaService } from '../services/turmaService'
import Select from '../components/Select'
import RankingTable from '../components/RankingTable'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import { formatPoints } from '../utils/format'

export default function Ranking() {
  const [periodos, setPeriodos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPeriodo, setFiltroPeriodo] = useState('')
  const [filtroAno, setFiltroAno] = useState('')
  const [filtroTurma, setFiltroTurma] = useState('')

  const anos = [...new Set(turmas.map((t) => t.ano_letivo))].sort((a, b) => b - a)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pe, tm] = await Promise.all([periodoService.listar(), turmaService.listar()])
      setPeriodos(pe)
      setTurmas(tm)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    async function calc() {
      setLoading(true)
      try {
        const { ranking: ranks } = await calcularRanking({
          periodoId: filtroPeriodo || null,
          anoLetivo: filtroAno || null
        })
        let filtrado = ranks
        if (filtroTurma) {
          filtrado = ranks.filter((r) => r.id === filtroTurma)
        }
        setRanking(filtrado)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    calc()
  }, [filtroPeriodo, filtroAno, filtroTurma])

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">🏆 Ranking das Turmas</h1>
        <p className="page-subtitle">Classificação da competição com base nos pontos acumulados.</p>
      </div>

      <div className="toolbar">
        <Select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} options={periodos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Todos os períodos" className="width-200" />
        <Select value={filtroAno} onChange={(e) => setFiltroAno(e.target.value)} options={anos.map((a) => ({ value: a, label: `Ano ${a}` }))} placeholder="Todos os anos" className="width-180" />
        <Select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)} options={turmas.map((t) => ({ value: t.id, label: t.nome }))} placeholder="Todas as turmas" className="width-180" />
      </div>

      {ranking.length > 0 && (
        <div className="podium">
          {ranking.slice(1, 3).reverse().map((t) => (
            <div key={t.id} className={`podium-item podium-${t.posicao}`}>
              <span className="podium-medal">{t.medalha}</span>
              <strong className="podium-nome">{t.nome}</strong>
              <span className="podium-pontos">{formatPoints(t.total)} pts</span>
            </div>
          ))}
          {ranking[0] && (
            <div className="podium-item podium-1">
              <span className="podium-medal">🥇</span>
              <strong className="podium-nome">{ranking[0].nome}</strong>
              <span className="podium-pontos">{formatPoints(ranking[0].total)} pts</span>
            </div>
          )}
        </div>
      )}

      {loading ? <Loading skeleton /> : (
        ranking.length > 0 ? (
          <div className="card"><RankingTable ranking={ranking} /></div>
        ) : (
          <EmptyState icon="🏆" title="Nenhuma turma encontrada" description="Ajuste os filtros ou cadastre turmas." />
        )
      )}
    </div>
  )
}
