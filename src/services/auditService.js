import { supabase } from './supabase'

export const auditService = {
  async registrar({ acao, tabela, registroId = null, tipoOperacao, dadosAnteriores = null, dadosNovos = null }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: profileData?.id || null,
        acao,
        tabela,
        registro_id: registroId,
        tipo_operacao: tipoOperacao,
        dados_anteriores: dadosAnteriores,
        dados_novos: dadosNovos
      }])
    
    if (error) {
      console.error('Erro ao registrar auditoria:', error.message)
    }
  },

  async listar() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(nome, email)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async listarMeus(userId) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}
