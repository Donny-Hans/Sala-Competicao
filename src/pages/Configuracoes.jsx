import React, { useEffect, useState, useCallback } from 'react'
import { auditService } from '../services/auditService'
import { useToast } from '../contexts/ToastContext'
import Loading from '../components/Loading'
import Table from '../components/Table'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import { formatDateTime } from '../utils/format'

export default function Configuracoes() {
  const { error } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLogs(await auditService.listar())
    } catch (err) {
      error(err.message)
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { load() }, [load])

  const columns = [
    { header: 'Data', key: 'created_at', render: (l) => formatDateTime(l.created_at) },
    { header: 'Usuário', key: 'user', render: (l) => l.profiles?.nome || 'Sistema' },
    { header: 'Ação', key: 'acao' },
    { header: 'Tabela', key: 'tabela', render: (l) => <Badge color="info">{l.tabela}</Badge> },
    { header: 'Operação', key: 'tipo_operacao', render: (l) => (
      <Badge color={l.tipo_operacao === 'INSERT' ? 'success' : l.tipo_operacao === 'DELETE' ? 'danger' : 'warning'}>{l.tipo_operacao}</Badge>
    ) }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">⚙️ Configurações</h1>
        <p className="page-subtitle">Configurações administrativas e trilha de auditoria do sistema.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🛡️ Logs de Auditoria</h2>
        </div>
        <p className="page-subtitle margin-bottom">
          Todas as operações realizadas no sistema são rastreadas para garantir transparência e segurança.
        </p>
        {loading ? <Loading skeleton /> : (
          logs.length > 0 ? (
            <Table columns={columns} data={logs.slice(0, 100)} />
          ) : (
            <EmptyState icon="🛡️" title="Nenhum log de auditoria" />
          )
        )}
      </div>
    </div>
  )
}
