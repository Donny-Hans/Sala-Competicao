import { supabase } from './supabase'

export const alunoService = {
  async listar(opts = {}) {
    let query = supabase
      .from('alunos')
      .select('*, turmas(nome, serie)')
      .order('nome', { ascending: true })

    if (opts.turmaId) query = query.eq('turma_id', opts.turmaId)
    if (opts.search) query = query.ilike('nome', `%${opts.search}%`)
    if (opts.ativo !== undefined) query = query.eq('ativo', opts.ativo)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async obter(id) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async criar(aluno) {
    const { data, error } = await supabase
      .from('alunos')
      .insert([aluno])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async atualizar(id, aluno) {
    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async excluir(id) {
    const { error } = await supabase.from('alunos').delete().eq('id', id)
    if (error) throw error
  },

  async transferir(id, turmaId) {
    const { data, error } = await supabase
      .from('alunos')
      .update({ turma_id: turmaId })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async contarPorTurma() {
    const { data, error } = await supabase
      .from('alunos')
      .select('turma_id, ativo')
    if (error) throw error

    const contagem = {}
    data.forEach((a) => {
      if (a.ativo) {
        contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1
      }
    })
    return contagem
  }
}
