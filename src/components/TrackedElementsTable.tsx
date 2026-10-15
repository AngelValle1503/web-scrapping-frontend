import React from 'react'
import {
  RefreshCw,
  History,
  Trash2,
  ExternalLink,
  Code,
  AlertCircle,
  Play,
  Pause,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
} from 'lucide-react'
import type { TrackedElement } from '../types'

interface TrackedElementsTableProps {
  elements: TrackedElement[]
  countdownSeconds: number
  isAutoChecking: boolean
  isCheckingAll: boolean
  checkingId: number | null
  onOpenInspector: () => void
  onCheckSingle: (id: number) => Promise<void>
  onCheckAll: () => Promise<void>
  onOpenHistory: (element: TrackedElement) => void
  onToggleStatus: (id: number) => Promise<void>
  onDeleteElement: (id: number) => Promise<void>
  onToggleAutoCheck: () => void
}

export const TrackedElementsTable: React.FC<TrackedElementsTableProps> = ({
  elements,
  countdownSeconds,
  isAutoChecking,
  isCheckingAll,
  checkingId,
  onOpenInspector,
  onCheckSingle,
  onCheckAll,
  onOpenHistory,
  onToggleStatus,
  onDeleteElement,
  onToggleAutoCheck,
}) => {
  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Nunca'
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
    if (diff < 5) return 'Hace un momento'
    if (diff < 60) return `Hace ${diff}s`
    const mins = Math.floor(diff / 60)
    if (mins < 60) return `Hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    return new Date(isoString).toLocaleDateString('es-MX')
  }

  return (
    <div className="tracked-table-wrapper">
      {/* Barra superior de control del monitoreo */}
      <div className="tracked-table-header">
        <div className="table-header-left">
          <div className="flex items-center gap-2">
            <h3 className="table-title">Elementos Monitoreados en Vivo</h3>
            <span className="count-badge">{elements.length}</span>
          </div>
          <p className="table-subtitle">
            Elementos HTML seleccionados para consulta automática cada 5 minutos con registro de cambios.
          </p>
        </div>

        <div className="table-header-actions">
          {/* Contador y Switch de Auto-Check de 5 minutos */}
          <div className="countdown-pill" title="Intervalo automático de 5 minutos">
            <Clock size={14} className={isAutoChecking ? 'text-amber-400' : 'text-slate-500'} />
            <span className="countdown-label">
              {isAutoChecking ? 'Próxima consulta en:' : 'Auto-consulta:'}
            </span>
            <span className="countdown-time font-mono">
              {isAutoChecking ? formatCountdown(countdownSeconds) : 'Pausada'}
            </span>
            <button
              type="button"
              onClick={onToggleAutoCheck}
              className="auto-toggle-btn"
              title={isAutoChecking ? 'Pausar temporizador' : 'Reanudar temporizador'}
            >
              {isAutoChecking ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>

          {/* Botón Consultar Todos */}
          <button
            type="button"
            onClick={onCheckAll}
            disabled={isCheckingAll || elements.length === 0}
            className="check-all-btn"
            title="Consultar todos los enlaces ahora mismo"
          >
            <RefreshCw size={14} className={isCheckingAll ? 'animate-spin' : ''} />
            <span>{isCheckingAll ? 'Consultando...' : 'Consultar todo ahora'}</span>
          </button>

          {/* Botón Inspeccionar Nueva URL */}
          <button
            type="button"
            onClick={onOpenInspector}
            className="open-inspector-btn"
          >
            <Search size={15} />
            <span>Inspeccionar y Agregar Elemento</span>
          </button>
        </div>
      </div>

      {/* Contenido de la Tabla */}
      {elements.length === 0 ? (
        <div className="table-empty-state">
          <div className="empty-sparkle-circle">
            <Sparkles size={36} className="text-amber-400 animate-pulse" />
          </div>
          <h4 className="empty-heading">No tienes elementos en monitoreo aún</h4>
          <p className="empty-paragraph">
            Pega el enlace de cualquier tienda o página web, previsualiza su HTML en vivo y haz clic sobre cualquier <strong>div</strong> o texto para agregarlo aquí.
          </p>
          <button
            type="button"
            onClick={onOpenInspector}
            className="empty-cta-btn"
          >
            <Search size={16} />
            <span>Previsualizar enlace e inspeccionar HTML</span>
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th className="th-status">Estado</th>
                <th className="th-name">Elemento / Campo</th>
                <th className="th-value">Valor Actual</th>
                <th className="th-selector">Selector CSS</th>
                <th className="th-url">URL Origen</th>
                <th className="th-changes">Cambios</th>
                <th className="th-last">Última Consulta</th>
                <th className="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((item) => {
                const isCurrentlyChecking = checkingId === item.id || isCheckingAll
                const domain = (() => {
                  try {
                    return new URL(item.url).hostname.replace(/^www\./, '')
                  } catch {
                    return 'Enlace'
                  }
                })()

                const changesCount = item.logs?.filter((l) => l.has_changed).length ?? 0

                return (
                  <tr
                    key={item.id}
                    className={`table-row ${item.status === 'paused' ? 'row-paused' : ''}`}
                  >
                    {/* Estado */}
                    <td className="td-status">
                      {item.status === 'active' ? (
                        <div className="status-indicator active" title="Monitoreo activo">
                          <span className="pulse-dot" />
                          <span className="status-text">Activo</span>
                        </div>
                      ) : item.status === 'error' ? (
                        <div className="status-indicator error" title={item.error_message || 'Error en selector'}>
                          <AlertCircle size={13} />
                          <span className="status-text">Error</span>
                        </div>
                      ) : (
                        <div className="status-indicator paused" title="Monitoreo pausado">
                          <span className="paused-dot" />
                          <span className="status-text">Pausado</span>
                        </div>
                      )}
                    </td>

                    {/* Nombre y etiqueta */}
                    <td className="td-name">
                      <div className="name-cell">
                        <span className="item-name font-semibold">{item.name}</span>
                        <span className="item-domain-badge">{domain}</span>
                      </div>
                    </td>

                    {/* Valor Actual en vivo */}
                    <td className="td-value">
                      <div className="value-pill-wrapper">
                        {item.current_value ? (
                          <span className="value-pill truncate font-mono" title={item.current_value}>
                            {item.current_value}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Sin valor capturado</span>
                        )}
                      </div>
                    </td>

                    {/* Selector CSS */}
                    <td className="td-selector">
                      <div className="selector-badge-wrapper" title={item.selector}>
                        <Code size={12} className="text-emerald-400 shrink-0" />
                        <span className="font-mono text-xs truncate max-w-[150px]">
                          {item.selector}
                        </span>
                      </div>
                    </td>

                    {/* URL */}
                    <td className="td-url">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-link flex items-center gap-1 text-xs text-sky-400 hover:underline"
                        title={item.url}
                      >
                        <span className="truncate max-w-[160px]">{item.url}</span>
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </td>

                    {/* Cambios */}
                    <td className="td-changes">
                      <button
                        type="button"
                        onClick={() => onOpenHistory(item)}
                        className={`changes-btn ${changesCount > 0 ? 'has-changes' : ''}`}
                        title="Ver bitácora de cambios"
                      >
                        <TrendingUp size={12} />
                        <span>{changesCount} {changesCount === 1 ? 'cambio' : 'cambios'}</span>
                      </button>
                    </td>

                    {/* Última consulta */}
                    <td className="td-last">
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(item.last_checked_at)}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="td-actions">
                      <div className="actions-cluster">
                        {/* Consultar ahora */}
                        <button
                          type="button"
                          onClick={() => onCheckSingle(item.id)}
                          disabled={isCurrentlyChecking}
                          className="action-btn check-now"
                          title="Consultar precio / contenido ahora"
                        >
                          <RefreshCw size={13} className={isCurrentlyChecking ? 'animate-spin' : ''} />
                        </button>

                        {/* Ver Historial */}
                        <button
                          type="button"
                          onClick={() => onOpenHistory(item)}
                          className="action-btn history"
                          title="Ver historial de cambios"
                        >
                          <History size={13} />
                        </button>

                        {/* Pausar / Reanudar */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item.id)}
                          className="action-btn toggle"
                          title={item.status === 'active' ? 'Pausar monitoreo' : 'Reanudar monitoreo'}
                        >
                          {item.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                        </button>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => onDeleteElement(item.id)}
                          className="action-btn delete"
                          title="Eliminar de la tabla"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
