export const validators = {
  required(value, fieldName) {
    if (value === null || value === undefined || String(value).trim() === '') {
      return `${fieldName || 'Este campo'} é obrigatório.`
    }
    return null
  },

  email(value) {
    if (!value) return 'Informe o e-mail.'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(value)) return 'Informe um e-mail válido.'
    return null
  },

  usuario(value) {
    if (!value) return 'Informe o nome de usuário.'
    const re = /^[a-zA-Z0-9._-]+$/
    if (!re.test(value)) {
      return 'Usuário inválido. Use apenas letras, números, ponto, traço ou sublinhado.'
    }
    if (value.length < 3) return 'O usuário deve ter pelo menos 3 caracteres.'
    return null
  },

  password(value) {
    if (!value) return 'Informe a senha.'
    if (value.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    return null
  },

  number(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      return `${fieldName || 'Este campo'} é obrigatório.`
    }
    const n = Number(value)
    if (isNaN(n)) return `Informe um valor numérico válido para ${fieldName || 'este campo'}.`
    return null
  },

  withinRange(value, min, max, fieldName) {
    const n = Number(value)
    if (n < min) return `${fieldName || 'O valor'} não pode ser menor que ${min}.`
    if (n > max) return `${fieldName || 'O valor'} não pode ser maior que ${max}.`
    return null
  },

  pontuacao(value, pontosMaximos) {
    const n = Number(value)
    if (isNaN(n) || n <= 0) return 'Informe uma pontuação válida (maior que zero).'
    if (n > pontosMaximos) return `A pontuação não pode ultrapassar ${pontosMaximos} pontos para este critério.`
    return null
  }
}
