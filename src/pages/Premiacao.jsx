import React, { useEffect, useState, useCallback } from 'react'
import { calcularRanking } from '../services/rankingService'
import { useAuth } from '../contexts/AuthContext'
import Loading from '../components/Loading'
import { formatPoints } from '../utils/format'

export default function Premiacao() {
  const { profile } = useAuth()
  const [campeao, setCampeao] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { ranking } = await calcularRanking({})
      setCampeao(ranking[0] || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading fullPage label="Buscando turma vencedora..." />

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">🎉 Premiação</h1>
        <p className="page-subtitle">A turma que acumular a maior pontuação ao final do período receberá o Troféu "Classe Ouro" e uma rodada de pizza!</p>
      </div>

      {campeao ? (
        <div className="champion-card">
          <div className="champion-trophy">🏆</div>
          <h2 className="champion-title">Classe Ouro {new Date().getFullYear()}</h2>
          <p className="champion-turma">A turma vencedora é a</p>
          <h1 className="champion-nome">{campeao.nome}</h1>
          <p className="champion-sub">Série {campeao.serie} · Turno {campeao.turno}</p>
          <div className="champion-score">
            <div className="champion-stat">
              <span>Pontos positivos</span>
              <strong>+{formatPoints(campeao.pontos_positivos)}</strong>
            </div>
            <div className="champion-stat">
              <span>Penalidades</span>
              <strong className={campeao.penalidades < 0 ? 'text-negative' : ''}>{formatPoints(campeao.penalidades)}</strong>
            </div>
            <div className="champion-stat total">
              <span>Total</span>
              <strong>{formatPoints(campeao.total)} pontos</strong>
            </div>
          </div>
          <div className="champion-reward">🍕</div>
          <p className="champion-reward-text">Recompensa coletiva: uma rodada de pizza para a {campeao.nome}!</p>
        </div>
      ) : (
        <div className="champion-card empty">
          <div className="champion-trophy">🏆</div>
          <h2>A competição ainda não tem vencedora</h2>
          <p>Registre pontuações para as turmas para descobrir a campeã no final do período.</p>
        </div>
      )}
    </div>
  )
}
