import { supabase } from './supabase'

export const pontuacaoService = {
  async registrar(pontuacao) {
    const { data, error } = await supabase
      .from('pontuacoes')
      .insert([pontuacao])
      .select('*, turmas(nome), periodos(nome), criterios(nome), profiles(nome)')
      .single()
    if (error) throw error
    return data
  },

  async listar() {
    const { data, error } = await supabase
      .from('pontuacoes')
      .select('*, turmas(nome, serie), periodos(nome), criterios(nome, categoria), profiles(nome)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async obter(id) {
    const { data, error } = await supabase
      .from('pontuacoes')
      .select('*, turmas(nome), periodos(nome), criterios(nome), profiles(nome)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase
      .from('pontuacoes')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async somaPorCriterio(turmaId, periodoId) {
    let query = supabase
      .from('pontuacoes')
      .select('criterio_id, criterios(nome, categoria, pontos_maximos), pontos')
      .eq('turma_id', turmaId)

    if (periodoId) query = query.eq('periodo_id', periodoId)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async totalPontosPositivos() {
    const { data, error } = await supabase
      .from('pontuacoes')
      .select('pontos, turma_id, periodo_id, criterio_id')
    if (error) throw error
    return data
  },

  async totalPontosPositivosPorTurmaPeriodo() {
    const { data, error } = await supabase
      .from('pontuacoes')
      .select('pontos, turma_id, periodo_id')
    if (error) throw error

    const mapa = {}
    data.forEach((p) => {
      if (!mapa[p.turma_id]) mapa[p.turma_id] = {}
      if (!mapa[p.turma_id][p.periodo_id]) mapa[p.turma_id][p.periodo_id] = 0
      mapa[p.turma_id][p.periodo_id] += p.pontos
    })
    return mapa
  }
}
