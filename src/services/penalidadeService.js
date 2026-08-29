import { supabase } from './supabase'

export const penalidadeService = {
  async listarCatalogo() {
    const { data, error } = await supabase
      .from('penalidades')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    if (error) throw error
    return data
  },

  async listarCatalogoTudo() {
    const { data, error } = await supabase
      .from('penalidades')
      .select('*')
      .order('nome', { ascending: true })
    if (error) throw error
    return data
  },

  async criarCatalogo(p) {
    const { data, error } = await supabase
      .from('penalidades')
      .insert([p])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizarCatalogo(id, p) {
    const { data, error } = await supabase
      .from('penalidades')
      .update(p)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async excluirCatalogo(id) {
    const { error } = await supabase.from('penalidades').delete().eq('id', id)
    if (error) throw error
  },

  async aplicar(aplicacao) {
    const { data, error } = await supabase
      .from('aplicacoes_penalidades')
      .insert([aplicacao])
      .select('*, turmas(nome), penalidades(nome)')
      .single()
    if (error) throw error
    return data
  },

  async listarAplicacoes() {
    const { data, error } = await supabase
      .from('aplicacoes_penalidades')
      .select('*, turmas(nome, serie), periodos(nome), penalidades(nome), profiles(nome)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase
      .from('aplicacoes_penalidades')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async totalPenalidadesAplicadas() {
    const { data, error } = await supabase
      .from('aplicacoes_penalidades')
      .select('pontos, turma_id, periodo_id, penalidade_id')
    if (error) throw error
    return data
  }
}
