import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { turmaService } from '../services/turmaService'
import { alunoService } from '../services/alunoService'
import { calcularRanking } from '../services/rankingService'
import { pontuacaoService } from '../services/pontuacaoService'
import { penalidadeService } from '../services/penalidadeService'
import DashboardCard from '../components/DashboardCard'
import RankingTable from '../components/RankingTable'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { formatPoints } from '../utils/format'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [ranking, setRanking] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [turmas, alunos, pontuacoes, penalidades, rank] = await Promise.all([
        turmaService.listarAtivas(),
        alunoService.listar({ ativo: true }),
        pontuacaoService.totalPontosPositivos(),
        penalidadeService.totalPenalidadesAplicadas(),
        calcularRanking({})
      ])

      const totalPositivos = pontuacoes.reduce((s, p) => s + p.pontos, 0)
      const totalPenais = penalidades.reduce((s, p) => s + p.pontos, 0)

      setStats({
        totalTurmas: turmas.length,
        totalAlunos: alunos.length,
        totalPontos: totalPositivos,
        totalPenalidades: Math.abs(totalPenais),
        pontuacaoGeral: totalPositivos + totalPenais
      })

      setRanking(rank.ranking.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading fullPage label="Carregando dashboard..." />

  return (
    <div className="page-content">
      <div className="dash-hero">
        <div>
          <h1>Bem-vindo, {profile?.nome?.split(' ')[0] || 'Professor'}! 👋</h1>
          <p>Visão geral da competição interclasses. Registre pontos, aplique penalidades e acompanhe o ranking das turmas.</p>
        </div>
        <div className="dash-hero-emoji">🏆</div>
      </div>

      <div className="dash-grid">
        <DashboardCard title="Turmas" value={stats.totalTurmas} icon="🏫" color="blue" />
        <DashboardCard title="Alunos" value={stats.totalAlunos} icon="👨‍🎓" color="green" />
        <DashboardCard title="Pontos Positivos" value={formatPoints(stats.totalPontos)} icon="⭐" color="gold" />
        <DashboardCard title="Penalidades" value={formatPoints(-stats.totalPenalidades)} icon="⚠️" color="red" />
      </div>

      {ranking.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📊 Evolução da Pontuação por Turma</h2>
            <Link to="/ranking" className="link-btn">Ver detalhes →</Link>
          </div>
          <div className="bar-chart">
            {ranking.map((t) => {
              const max = Math.max(...ranking.map((r) => r.total), 1)
              const h = Math.max((t.total / max) * 100, 4)
              return (
                <div className="bar-item" key={t.id} title={`${t.nome}: ${t.total} pontos`}>
                  <span className="bar-value">{formatPoints(t.total)}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${t.posicao === 1 ? 'bar-gold' : t.posicao <= 3 ? 'bar-silver' : ''}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="bar-label">{t.nome}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="dash-grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🏆 Ranking das Melhores Turmas</h2>
            <Link to="/ranking" className="link-btn">Ver ranking completo →</Link>
          </div>
          {ranking.length > 0 ? (
            <RankingTable ranking={ranking} />
          ) : (
            <EmptyState
              icon="🏆"
              title="Nenhuma turma cadastrada"
              description="Cadastre turmas para iniciar a competição."
            />
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">⚡ Ações rápidas</h2>
          </div>
          <div className="quick-actions">
            <button className="quick-action" onClick={() => navigate('/pontuacoes')}>
              <span className="qa-icon">⭐</span>
              <span>
                <strong>Registrar Pontuação</strong>
                <small>Lançar pontos positivos</small>
              </span>
            </button>
            <button className="quick-action" onClick={() => navigate('/penalidades')}>
              <span className="qa-icon">⚠️</span>
              <span>
                <strong>Aplicar Penalidade</strong>
                <small>Registrar pontos negativos</small>
              </span>
            </button>
            <button className="quick-action" onClick={() => navigate('/turmas')}>
              <span className="qa-icon">🏫</span>
              <span>
                <strong>Gerenciar Turmas</strong>
                <small>Cadastrar e editar turmas</small>
              </span>
            </button>
            <button className="quick-action" onClick={() => navigate('/alunos')}>
              <span className="qa-icon">👨‍🎓</span>
              <span>
                <strong>Gerenciar Alunos</strong>
                <small>Cadastrar alunos</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
