import React from 'react'

export default function Select({
  label,
  error,
  options = [],
  placeholder,
  id,
  className = '',
  children,
  ...props
}) {
  const inputId = id || props.name || label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      {label && <label className="field-label" htmlFor={inputId}>{label}</label>}
      <select id={inputId} className={`input select ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, i) => {
          if (typeof opt === 'string') {
            return <option key={i} value={opt}>{opt}</option>
          }
          return <option key={opt.value ?? opt.id ?? i} value={opt.value ?? opt.id}>{opt.label ?? opt.nome}</option>
        })}
        {children}
      </select>
      {error && <small className="field-msg">{error}</small>}
    </div>
  )
}
