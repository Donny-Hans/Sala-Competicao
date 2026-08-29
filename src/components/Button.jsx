import React from 'react'
import { classNames } from '../utils/format'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = classNames(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading ? 'is-loading' : '',
    className
  )

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <span className="spinner-btn" /> : null}
      {children}
    </button>
  )
}
