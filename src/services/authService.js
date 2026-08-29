import { supabase } from './supabase'

export const authService = {
  async signUp(email, password, userData = {}) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
  },

  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    return supabase.auth.signOut()
  },

  async getSession() {
    return supabase.auth.getSession()
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  async resetPassword(email) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login'
    })
  },

  async updatePassword(newPassword) {
    return supabase.auth.updateUser({ password: newPassword })
  },

  async getProfile(userId) {
    return supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
  },

  async listProfessores() {
    return supabase
      .from('profiles')
      .select('*')
      .order('nome', { ascending: true })
  },

  async createProfile(userId, data) {
    return supabase
      .from('profiles')
      .insert([{ user_id: userId, ...data }])
      .select()
      .single()
  },

  async updateProfile(id, data) {
    return supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  },

  async toggleProfAtivo(id, ativo) {
    return supabase
      .from('profiles')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single()
  },

  async deleteProfile(id) {
    return supabase.from('profiles').delete().eq('id', id)
  }
}
