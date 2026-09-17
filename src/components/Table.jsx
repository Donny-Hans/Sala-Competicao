import React from 'react'
import { classNames } from '../utils/format'

export default function Table({ columns = [], data = [], loading = false, empty, onRowClick }) {
  if (loading) {
    return <p className="table-loading">Carregando dados...</p>
  }

  if (!data || data.length === 0) {
    return empty || <p className="table-empty">Nenhum registro encontrado.</p>
  }

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col.header} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className={classNames(onRowClick ? 'clickable' : '')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key || col.header} data-label={col.header}>
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
