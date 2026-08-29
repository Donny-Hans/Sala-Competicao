import { supabase } from './supabase'

export const criterioService = {
  async listar() {
    const { data, error } = await supabase
      .from('criterios')
      .select('*')
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true })
    if (error) throw error
    return data
  },

  async listarAtivos() {
    const { data, error } = await supabase
      .from('criterios')
      .select('*')
      .eq('ativo', true)
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true })
    if (error) throw error
    return data
  },

  async criar(criterio) {
    const { data, error } = await supabase
      .from('criterios')
      .insert([criterio])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id, criterio) {
    const { data, error } = await supabase
      .from('criterios')
      .update(criterio)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase.from('criterios').delete().eq('id', id)
    if (error) throw error
  }
}
