import React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPoints } from '../utils/format'
import Badge from './Badge'

export default function RankingTable({ ranking = [], showEvolucao = true }) {
  const navigate = useNavigate()
  const maxTotal = ranking.length ? Math.max(...ranking.map((t) => t.total)) : 0

  if (!ranking.length) {
    return <p className="table-empty">Nenhuma turma encontrada.</p>
  }

  return (
    <div className="table-responsive">
      <table className="table ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Turma</th>
            <th>Série</th>
            <th>Positivos</th>
            <th>Penalidades</th>
            <th>Total</th>
            {showEvolucao && <th>Ranking</th>}
          </tr>
        </thead>
        <tbody>
          {ranking.map((t) => {
            const pct = maxTotal > 0 ? Math.round((t.total / maxTotal) * 100) : 0
            return (
              <tr key={t.id} className={t.medalha ? `rank-${t.posicao}` : ''}>
                <td className="rank-pos">
                  <span className="rank-medal">{t.medalha || t.posicao}</span>
                </td>
                <td>
                  <button className="link-btn" onClick={() => navigate(`/turmas/${t.id}`)}>
                    {t.nome}
                  </button>
                  <div className="rank-bar">
                    <div className="rank-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </td>
                <td>{t.serie}</td>
                <td className="text-positive">+{formatPoints(t.pontos_positivos)}</td>
                <td className={t.penalidades < 0 ? 'text-negative' : ''}>
                  {t.penalidades < 0 ? formatPoints(t.penalidades) : '0'}
                </td>
                <td className="total-cell"><strong>{formatPoints(t.total)}</strong></td>
                {showEvolucao && (
                  <td>
                    <Badge color={t.posicao === 1 ? 'gold' : t.posicao <= 3 ? 'primary' : 'default'}>
                      {t.posicao}º lugar
                    </Badge>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
