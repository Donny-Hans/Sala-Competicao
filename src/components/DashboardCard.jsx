import React from 'react'
import { classNames } from '../utils/format'

export default function DashboardCard({ title, value, icon, color = 'blue', subtitle, footer }) {
  return (
    <div className={`dash-card dash-${color}`}>
      <div className="dash-card-top">
        <div className="dash-card-icon">{icon}</div>
        <div className="dash-card-info">
          <span className="dash-card-value">{value}</span>
          <span className="dash-card-title">{title}</span>
        </div>
      </div>
      {subtitle && <p className="dash-card-subtitle">{subtitle}</p>}
      {footer && <div className="dash-card-footer">{footer}</div>}
    </div>
  )
}
