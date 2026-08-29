import React from 'react'

export default function Loading({ fullPage = false, label = 'Carregando...', skeleton = false }) {
  if (skeleton) {
    return (
      <div className="skeleton-container">
        <div className="skeleton skeleton-line w-40" />
        <div className="skeleton skeleton-line w-80" />
        <div className="skeleton skeleton-line w-60" />
        <div className="skeleton skeleton-line w-70" />
      </div>
    )
  }

  return (
    <div className={`loading-wrap ${fullPage ? 'loading-full' : ''}`}>
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}
