import React from 'react'

export default function Badge({ children, color = 'default', className = '' }) {
  if (children === true || children === 'true' || children === 'ativo' || children === 'Ativo' || children === 'active') {
    color = 'success'
  } else if (children === false || children === 'false' || children === 'inativo' || children === 'Inativo' || children === 'Desativado') {
    color = 'danger'
  }

  return <span className={`badge badge-${color} ${className}`}>{children}</span>
}
