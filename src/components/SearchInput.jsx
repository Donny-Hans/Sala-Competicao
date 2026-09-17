import React from 'react'

export default function SearchInput({ value, onChange, placeholder = 'Pesquisar...', onClear }) {
  return (
    <div className="search-input">
      <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-field"
      />
      {value && (
        <button className="search-clear" onClick={() => { onChange(''); onClear?.() }}>×</button>
      )}
    </div>
  )
}
