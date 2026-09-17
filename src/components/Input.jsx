import React from 'react'

export default function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}) {
  const inputId = id || props.name || label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      {label && <label className="field-label" htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        className={`input ${className}`}
        {...props}
      />
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-msg">{error}</small>}
    </div>
  )
}
