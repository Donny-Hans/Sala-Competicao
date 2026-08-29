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
import Loading from '../components/Loading'
import Badge from '../components/Badge'
import { formatPoints } from '../utils/format'
import { validators } from '../utils/validators'

export default function Pontuacoes() {
  const { profile } = useAuth()
  const { success, error } = useToast()

  const [turmas, setTurmas] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [criterios, setCriterios] = useState([])
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tm, pe, cr] = await Promise.all([
        turmaService.listarAtivas(),
        periodoService.listarAtivos(),
        criterioService.listarAtivos()
      ])
      setTurmas(tm)
      setPeriodos(pe)
      setCriterios(cr)
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
        acao: `${profile.nome} adicionou +${form.pontos} pontos para ${criterioSelecionado.nome}`,
        tabela: 'pontuacoes',
        registroId: criado.id,
        tipoOperacao: 'INSERT',
        dadosNovos: pontuacao
      })

      success(`Pontuação registrada com sucesso! +${form.pontos} pontos.`)
      setForm({ periodo_id: '', turma_id: '', criterio_id: '', pontos: '', observacao: '' })
      setSomaCriterio(0)
      setAcumulado(0)
    } catch (err) {
      error(err.message || 'Erro ao registrar pontuação.')
    } finally {
      setSaving(false)
    }
  }

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
    </div>
  )
}
