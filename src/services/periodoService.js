import { supabase } from './supabase'

export const periodoService = {
  async listar() {
    const { data, error } = await supabase
      .from('periodos')
      .select('*')
      .order('data_inicio', { ascending: true })
    if (error) throw error
    return data
  },

  async listarAtivos() {
    const { data, error } = await supabase
      .from('periodos')
      .select('*')
      .eq('status', 'ativo')
      .order('data_inicio', { ascending: true })
    if (error) throw error
    return data
  },

  async obter(id) {
    const { data, error } = await supabase
      .from('periodos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async criar(periodo) {
    const { data, error } = await supabase
      .from('periodos')
      .insert([periodo])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id, periodo) {
    const { data, error } = await supabase
      .from('periodos')
      .update(periodo)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase.from('periodos').delete().eq('id', id)
    if (error) throw error
  },

  async periodoAtual() {
    const hoje = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('periodos')
      .select('*')
      .eq('status', 'ativo')
      .lte('data_inicio', hoje)
      .gte('data_fim', hoje)
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  }
}
