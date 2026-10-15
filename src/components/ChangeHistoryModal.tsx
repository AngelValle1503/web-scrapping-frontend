import React, { useEffect, useState } from 'react'
import {
  X,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Code,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import type { TrackedElement, TrackedElementLog } from '../types'

interface ChangeHistoryModalProps {
  element: TrackedElement
  onClose: () => void
  onRefreshNow: (id: number) => Promise<void>
}

export const ChangeHistoryModal: React.FC<ChangeHistoryModalProps> = ({
  element,
  onClose,
  onRefreshNow,
}) => {
  const [logs, setLogs] = useState<TrackedElementLog[]>(element.logs || [])
  const [loading, setLoading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tracked-elements/${element.id}/logs`)
      const data = await res.json()
      if (data.success && data.data) {
        setLogs(data.data.data || data.data)
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [element.id])

  const handleManualCheck = async () => {
    setRefreshing(true)
    try {
      await onRefreshNow(element.id)
      await fetchLogs()
    } finally {
      setRefreshing(false)
    }
  }

  const changesCount = logs.filter((l) => l.has_changed).length

  return (
    <div className="modal-backdrop">
      <div className="history-modal-container">
        {/* Modal Header */}
        <div className="history-header">
          <div className="flex items-center gap-3">
            <div className="history-icon-badge">
              <History size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="history-title">{element.name}</h3>
                <span className={`status-pill ${element.status}`}>
                  {element.status === 'active' ? 'Monitoreando' : 'Pausado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Code size={12} className="text-emerald-400" />
                <span className="font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                  {element.selector}
                </span>
                <span>•</span>
                <a
                  href={element.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span className="truncate max-w-[240px]">{element.url}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={refreshing}
              className="refresh-history-btn"
              title="Consultar en vivo ahora"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Consultando...' : 'Consultar ahora'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="close-history-btn"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Resumen de cambios y valor actual */}
        <div className="history-summary-strip">
          <div className="summary-card">
            <span className="summary-label">Valor actual en vivo</span>
            <span className="summary-value highlight truncate">
              {element.current_value || 'Sin valor'}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total de consultas</span>
            <span className="summary-value">{logs.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Cambios detectados</span>
            <span className="summary-value text-amber-400">{changesCount}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Frecuencia programada</span>
            <span className="summary-value text-sky-400">Cada {element.check_interval_minutes} min</span>
          </div>
        </div>

        {/* Bitácora de Consultas / Timeline */}
        <div className="history-body">
          <h4 className="timeline-title">Bitácora de Consultas y Cambios</h4>

          {loading ? (
            <div className="history-loading">
              <RefreshCw size={24} className="animate-spin text-amber-400 mb-2" />
              <span>Cargando bitácora de cambios...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="history-empty">
              <Clock size={32} className="text-slate-600 mb-2" />
              <p>Aún no se han registrado consultas para este elemento.</p>
            </div>
          ) : (
            <div className="timeline-list">
              {logs.map((log, index) => {
                const dateObj = new Date(log.checked_at)
                const formattedDate = dateObj.toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })

                return (
                  <div
                    key={log.id || index}
                    className={`timeline-item ${log.has_changed ? 'has-changed' : ''}`}
                  >
                    <div className="timeline-indicator">
                      {log.status === 'error' ? (
                        <div className="indicator-dot error">
                          <AlertCircle size={12} />
                        </div>
                      ) : log.has_changed ? (
                        <div className="indicator-dot changed animate-pulse">
                          <TrendingUp size={12} />
                        </div>
                      ) : (
                        <div className="indicator-dot ok">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                      {index < logs.length - 1 && <div className="timeline-line" />}
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-header-row">
                        <span className="timeline-timestamp">{formattedDate}</span>
                        {log.has_changed && (
                          <span className="change-badge">
                            ¡Cambio detectado!
                          </span>
                        )}
                        {!log.has_changed && log.status === 'success' && (
                          <span className="no-change-badge">Sin cambio</span>
                        )}
                        {log.status === 'error' && (
                          <span className="error-badge">Error</span>
                        )}
                      </div>

                      {/* Before and After values */}
                      <div className="timeline-values-box">
                        {log.old_value !== null && log.has_changed ? (
                          <div className="diff-comparison">
                            <div className="diff-pane before">
                              <span className="diff-label">Antes:</span>
                              <span className="diff-val old line-through">{log.old_value}</span>
                            </div>
                            <ArrowRight size={14} className="text-amber-400 shrink-0 mx-1" />
                            <div className="diff-pane after">
                              <span className="diff-label">Ahora:</span>
                              <span className="diff-val new font-semibold text-emerald-400">
                                {log.new_value}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="single-val-row">
                            <span className="diff-label">Valor registrado:</span>
                            <span className="font-mono text-slate-200">
                              {log.new_value ?? log.error_message ?? 'Sin valor'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
