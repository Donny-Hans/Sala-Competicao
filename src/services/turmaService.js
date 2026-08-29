import { supabase } from './supabase'

export const turmaService = {
  async listar() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async listarAtivas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    if (error) throw error
    return data
  },

  async obter(id) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async criar(turma) {
    const { data, error } = await supabase
      .from('turmas')
      .insert([turma])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id, turma) {
    const { data, error } = await supabase
      .from('turmas')
      .update(turma)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase.from('turmas').delete().eq('id', id)
    if (error) throw error
  },

  async contarAlunos(turmaId) {
    const { count, error } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('turma_id', turmaId)
      .eq('ativo', true)
    if (error) throw error
    return count
  }
}
