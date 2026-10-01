export const ROLES = ['admin', 'coordenador', 'professor']

const LABELS = {
  admin: 'Administrador',
  coordenador: 'Coordenador Pedagógico',
  professor: 'Professor'
}

const BADGE_COLORS = {
  admin: 'primary',
  coordenador: 'warning',
  professor: 'info'
}

export function roleLabel(role) {
  return LABELS[role] || 'Professor'
}

export function roleBadgeColor(role) {
  return BADGE_COLORS[role] || 'info'
}

export const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: roleLabel(value) }))
