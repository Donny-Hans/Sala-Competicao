import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { turmaService } from '../services/turmaService'
import { alunoService } from '../services/alunoService'
import { calcularPontuacaoTurma, resumoPorCategoria, calcularRanking } from '../services/rankingService'
import { periodoService } from '../services/periodoService'
import Loading from '../components/Loading'
import Badge from '../components/Badge'
import Select from '../components/Select'
import EmptyState from '../components/EmptyState'
import Table from '../components/Table'
import { formatDate, formatDateTime, formatPoints } from '../utils/format'

export default function TurmaDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turma, setTurma] = useState(null)
  const [alunos, setAlunos] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [periodoId, setPeriodoId] = useState('')
  const [pontuacao, setPontuacao] = useState(null)
  const [porCategoria, setPorCategoria] = useState(null)
  const [posicao, setPosicao] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [t, al, per, rank] = await Promise.all([
        turmaService.obter(id),
        alunoService.listar({ turmaId: id, ativo: true }),
        periodoService.listar(),
        calcularRanking({})
      ])
      setTurma(t)
      setAlunos(al)
      setPeriodos(per)
      const pos = rank.ranking.findIndex((r) => r.id === id)
      setPosicao(pos >= 0 ? pos + 1 : null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    async function loadPontuacao() {
      if (!turma) return
      const pid = periodoId || null
      const [p, cat] = await Promise.all([
        calcularPontuacaoTurma(id, { periodoId: pid }),
        resumoPorCategoria(id, pid)
      ])
      setPontuacao(p)
      setPorCategoria(cat)
    }
    if (turma) loadPontuacao()
  }, [turma, id, periodoId])

  if (loading) return <Loading fullPage label="Carregando turma..." />

  if (!turma) return <EmptyState icon="🏫" title="Turma não encontrada" />

  const categorias = ['Organização', 'Disciplina', 'Atividades', 'Relacionamento', 'Professor', 'Avaliações']

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <button className="link-btn" onClick={() => navigate('/turmas')}>← Voltar para turmas</button>
          <h1 className="page-title">{turma.nome}</h1>
          <p className="page-subtitle">
            {turma.serie} · Turno {turma.turno} · Sala {turma.sala || '-'} · Ano {turma.ano_letivo}
          </p>
        </div>
        <Badge color={turma.ativo ? 'success' : 'danger'}>{turma.ativo ? 'Ativa' : 'Inativa'}</Badge>
      </div>

      <div className="dash-grid">
        <div className="stat-mini"><span className="stat-icon">👨‍🎓</span><div><strong>{alunos.length}</strong><small>Alunos</small></div></div>
        <div className="stat-mini"><span className="stat-icon">⭐</span><div><strong>{formatPoints(pontuacao?.totalPositivos || 0)}</strong><small>Pontos Positivos</small></div></div>
        <div className="stat-mini"><span className="stat-icon">⚠️</span><div><strong>{formatPoints(pontuacao?.totalPenais || 0)}</strong><small>Penalidades</small></div></div>
        <div className="stat-mini"><span className="stat-icon">🏆</span><div><strong>{posicao ? `${posicao}º` : '-'}</strong><small>Posição no ranking</small></div></div>
      </div>

      <div className="toolbar">
        <Select
          label="Período"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          placeholder="Todos os períodos"
          options={periodos.map((p) => ({ value: p.id, label: p.nome }))}
          className="width-200"
        />
        <div className="spacer" />
        <strong className="total-geral">
          TOTAL: {formatPoints(pontuacao?.total || 0)} pontos
        </strong>
      </div>

      <div className="dash-grid-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">📊 Pontuação por Categoria</h2></div>
          <table className="table">
            <thead><tr><th>Critério</th><th>Pontos</th></tr></thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td>{formatPoints(porCategoria?.[cat] || 0)}</td>
                </tr>
              ))}
              <tr>
                <td><strong>Penalidades</strong></td>
                <td className={pontuacao?.totalPenais < 0 ? 'text-negative' : ''}>{formatPoints(pontuacao?.totalPenais || 0)}</td>
              </tr>
              <tr className="total-row">
                <td><strong>TOTAL</strong></td>
                <td><strong>{formatPoints(pontuacao?.total || 0)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">👨‍🎓 Alunos ({alunos.length})</h2></div>
          {alunos.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>#</th><th>Nome</th><th>Matrícula</th><th>Status</th></tr></thead>
                <tbody>
                  {alunos.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td>{a.nome}</td>
                      <td>{a.matricula}</td>
                      <td><Badge>{a.ativo}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="👨‍🎓" title="Nenhum aluno nesta turma" />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📜 Lançamentos Recentes</h2>
        </div>
        {pontuacao && (pontuacao.positivos.length > 0 || pontuacao.penais.length > 0) ? (
          <Table
            columns={[
              { header: 'Data', key: 'data', render: (r) => formatDateTime(r.created_at) },
              { header: 'Tipo', key: 'tipo', render: (r) => <Badge color={r.tipo === 'positivo' ? 'success' : 'danger'}>{r.tipo === 'positivo' ? 'Positivo' : 'Penalidade'}</Badge> },
              { header: 'Item', key: 'item', render: (r) => r.criterios?.nome || r.penalidades?.nome || '-' },
              { header: 'Pontos', key: 'pontos', render: (r) => <span className={r.pontos < 0 ? 'text-negative' : 'text-positive'}>{r.pontos > 0 ? `+${r.pontos}` : r.pontos}</span> },
              { header: 'Professor', key: 'prof', render: (r) => r.perf?.nome || '-' }
            ]}
            data={[...(pontuacao.penais || []), ...(pontuacao.positivos || [])].slice(0, 10)}
          />
        ) : (
          <EmptyState icon="📜" title="Nenhum lançamento registrado" description="Registre pontos para esta turma no menu Pontuações." />
        )}
      </div>
    </div>
  )
}
