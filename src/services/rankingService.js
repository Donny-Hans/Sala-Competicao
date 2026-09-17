import { supabase } from './supabase'

async function getTurmas() {
  const { data, error } = await supabase.from('turmas').select('*')
  if (error) throw error
  return data
}

async function getPeriodos() {
  const { data, error } = await supabase.from('periodos').select('*')
  if (error) throw error
  return data
}

async function getPontuacoes() {
  const { data, error } = await supabase.from('pontuacoes').select('turma_id, periodo_id, pontos')
  if (error) throw error
  return data
}

async function getPenalidades() {
  const { data, error } = await supabase
    .from('aplicacoes_penalidades')
    .select('turma_id, periodo_id, pontos')
  if (error) throw error
  return data
}

export async function calcularRanking({ periodoId, anoLetivo } = {}) {
  const [turmas, periodos, pontuacoes, penalidades] = await Promise.all([
    getTurmas(),
    getPeriodos(),
    getPontuacoes(),
    getPenalidades()
  ])

  const ano = anoLetivo ? parseInt(anoLetivo, 10) : null
  const turmasFiltradas = ano ? turmas.filter((t) => t.ano_letivo === ano) : turmas

  const resultado = turmasFiltradas.map((turma) => {
    let positivos = 0
    let penais = 0

    pontuacoes.forEach((p) => {
      if (p.turma_id === turma.id) {
        if (!periodoId || p.periodo_id === periodoId) {
          positivos += p.pontos
        }
      }
    })

    penalidades.forEach((p) => {
      if (p.turma_id === turma.id) {
        if (!periodoId || p.periodo_id === periodoId) {
          penais += p.pontos
        }
      }
    })

    const total = positivos + penais

    return {
      ...turma,
      pontos_positivos: positivos,
      penalidades: penais,
      total,
      periodo_id: periodoId || null
    }
  })

  resultado.sort((a, b) => b.total - a.total)

  resultado.forEach((t, i) => {
    t.posicao = i + 1
    t.medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
  })

  return { ranking: resultado, periodos }
}

export async function calcularPontuacaoTurma(turmaId, { periodoId } = {}) {
  let queryP = supabase
    .from('pontuacoes')
    .select('pontos, criterios(nome, categoria), periodo_id, created_at, professor_id, perf:profiles(nome)')
    .eq('turma_id', turmaId)
  let queryPe = supabase
    .from('aplicacoes_penalidades')
    .select('pontos, penalidades(nome), periodo_id, data_aplicacao, created_at, observacao, perf:profiles(nome)')
    .eq('turma_id', turmaId)

  if (periodoId) {
    queryP = queryP.eq('periodo_id', periodoId)
    queryPe = queryPe.eq('periodo_id', periodoId)
  }

  const [resP, resPe] = await Promise.all([queryP, queryPe])
  if (resP.error) throw resP.error
  if (resPe.error) throw resPe.error

  const positivos = resP.data || []
  const penais = resPe.data || []

  const totalPositivos = positivos.reduce((s, p) => s + p.pontos, 0)
  const totalPenais = penais.reduce((s, p) => s + p.pontos, 0)

  return {
    positivos: positivos.map((p) => ({ ...p, tipo: 'positivo' })),
    penais: penais.map((p) => ({ ...p, tipo: 'penalidade' })),
    totalPositivos,
    totalPenais,
    total: totalPositivos + totalPenais
  }
}

export async function resumoPorCategoria(turmaId, periodoId) {
  const { positivos } = await calcularPontuacaoTurma(turmaId, { periodoId })

  const porCategoria = {}
  const categorias = ['Organização', 'Disciplina', 'Atividades', 'Relacionamento', 'Professor', 'Avaliações']

  categorias.forEach((c) => {
    porCategoria[c] = 0
  })

  positivos.forEach((p) => {
    const cat = p.criterios?.categoria
    if (cat && porCategoria[cat] !== undefined) {
      porCategoria[cat] += p.pontos
    }
  })

  return porCategoria
}
