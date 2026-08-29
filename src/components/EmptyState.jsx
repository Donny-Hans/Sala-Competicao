import React from 'react'

export default function EmptyState({ icon = '📭', title = 'Nenhum registro encontrado', description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {action}
    </div>
  )
}
