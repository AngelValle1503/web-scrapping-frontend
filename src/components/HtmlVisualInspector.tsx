import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Crosshair,
  Search,
  ExternalLink,
  Laptop,
  Smartphone,
  Monitor,
  Code,
  Tag,
  Sparkles,
  Info,
} from 'lucide-react'
import type { HtmlPreviewData, SelectedElementData } from '../types'
import { apiFetch } from '../api'

interface HtmlVisualInspectorProps {
  previewData: HtmlPreviewData
  onClose: () => void
  onAddElement: (element: {
    name: string
    url: string
    selector: string
    attribute: string
    initial_value: string
    check_interval_minutes: number
  }) => Promise<void>
}

export const HtmlVisualInspector: React.FC<HtmlVisualInspectorProps> = ({
  previewData,
  onClose,
  onAddElement,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isInspectorActive, setIsInspectorActive] = useState<boolean>(true)
  const [selected, setSelected] = useState<SelectedElementData | null>(null)
  const [elementName, setElementName] = useState<string>('')
  const [selectedAttribute, setSelectedAttribute] = useState<string>('text')
  const [customSelector, setCustomSelector] = useState<string>('')
  const [testedValue, setTestedValue] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Escuchar selecciones de elementos emitidas desde el script inyectado en el iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === '__ANTIGRAVITY_ELEMENT_SELECTED__') {
        const { selector, tagName, text, htmlSnippet, attribute } = e.data
        setSelected({
          selector,
          tagName,
          text: text || '',
          htmlSnippet: htmlSnippet || '',
          attribute: attribute || 'text',
        })
        setCustomSelector(selector)
        setSelectedAttribute(attribute || 'text')
        setTestedValue(text || '')

        // Sugerir nombre descriptivo inteligente
        if (!elementName) {
          if (text && (text.includes('$') || /precio|price/i.test(selector))) {
            setElementName('Precio')
          } else if (tagName.startsWith('H') || /title|nombre|name/i.test(selector)) {
            setElementName('Título del Producto')
          } else if (/stock|disponib/i.test(selector)) {
            setElementName('Disponibilidad / Stock')
          } else {
            setElementName(`Elemento <${tagName.toLowerCase()}>`)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [elementName])

  // Notificar al iframe si se activa o pausa el modo selección
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: '__TOGGLE_INSPECTOR__', active: isInspectorActive },
      '*'
    )
  }, [isInspectorActive])

  // Actualizar prueba del selector
  const handleTestSelector = async () => {
    if (!customSelector.trim()) return
    setIsTesting(true)
    setFeedbackMsg(null)

    try {
      const response = await apiFetch('/api/inspector/test-selector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          selector: customSelector.trim(),
          html: previewData.html,
          attribute: selectedAttribute,
        }),
      })

      const data = await response.json()
      if (data.success && data.value !== null) {
        setTestedValue(data.value)
        setFeedbackMsg({ type: 'success', text: '¡Selector válido! Valor encontrado.' })
      } else {
        setTestedValue(null)
        setFeedbackMsg({
          type: 'error',
          text: 'No se encontró ningún elemento con este selector.',
        })
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Error al evaluar el selector.' })
    } finally {
      setIsTesting(false)
    }
  }

  // Guardar elemento en la tabla
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!elementName.trim() || !customSelector.trim()) return

    setIsSaving(true)
    setFeedbackMsg(null)

    try {
      await onAddElement({
        name: elementName.trim(),
        url: previewData.url,
        selector: customSelector.trim(),
        attribute: selectedAttribute,
        initial_value: testedValue ?? selected?.text ?? '',
        check_interval_minutes: 5,
      })

      setFeedbackMsg({
        type: 'success',
        text: '¡Elemento agregado exitosamente a la tabla de monitoreo!',
      })
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Error al guardar el elemento.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="inspector-modal-backdrop">
      <div className="inspector-modal-container">
        {/* Header superior del Inspector */}
        <div className="inspector-header">
          <div className="inspector-header-left">
            <div className="inspector-badge">
              <Crosshair size={15} className="animate-pulse" />
              <span>Inspector Visual HTML</span>
            </div>
            <h2 className="inspector-title" title={previewData.title}>
              {previewData.title || previewData.url}
            </h2>
            <a
              href={previewData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inspector-url-link"
              title="Abrir enlace original en pestaña nueva"
            >
              <span>{previewData.url}</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="inspector-header-right">
            {/* Selector de modo viewport */}
            <div className="viewport-toggle-group">
              <button
                type="button"
                className={`viewport-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewportMode('desktop')}
                title="Vista Escritorio (100%)"
              >
                <Monitor size={15} />
              </button>
              <button
                type="button"
                className={`viewport-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
                onClick={() => setViewportMode('tablet')}
                title="Vista Tablet (768px)"
              >
                <Laptop size={15} />
              </button>
              <button
                type="button"
                className={`viewport-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewportMode('mobile')}
                title="Vista Móvil (420px)"
              >
                <Smartphone size={15} />
              </button>
            </div>

            {/* Toggle de modo selección */}
            <button
              type="button"
              className={`mode-toggle-btn ${isInspectorActive ? 'active' : ''}`}
              onClick={() => setIsInspectorActive(!isInspectorActive)}
            >
              <Crosshair size={14} />
              <span>{isInspectorActive ? 'Selección Activada' : 'Selección Pausada'}</span>
            </button>

            {/* Cerrar modal */}
            <button
              type="button"
              className="inspector-close-btn"
              onClick={onClose}
              aria-label="Cerrar inspector"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo principal con preview a la izquierda y panel de configuración a la derecha */}
        <div className="inspector-body">
          {/* Contenedor del Iframe sandboxed */}
          <div className={`inspector-preview-wrapper viewport-${viewportMode}`}>
            <iframe
              ref={iframeRef}
              srcDoc={previewData.html}
              title="Previsualización HTML"
              className="inspector-iframe"
            />

            {!selected && isInspectorActive && (
              <div className="inspector-instruction-banner">
                <Crosshair size={16} className="text-cyan-400 animate-spin-slow" />
                <span>Pasa el cursor sobre la página y haz clic en cualquier <strong>div</strong>, precio o título que quieras monitorear</span>
              </div>
            )}
          </div>

          {/* Panel Lateral: Elemento Seleccionado & Configuración */}
          <div className="inspector-sidebar">
            <div className="inspector-sidebar-header">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-sky-400" />
                <h3 className="sidebar-title">Elemento Seleccionado</h3>
              </div>
              {selected && (
                <span className="tag-pill-highlight">&lt;{selected.tagName}&gt;</span>
              )}
            </div>

            {selected ? (
              <form onSubmit={handleSave} className="sidebar-form">
                {/* Nombre / Etiqueta */}
                <div className="form-group">
                  <label htmlFor="elem-name" className="form-label">
                    Nombre o etiqueta del campo
                  </label>
                  <input
                    id="elem-name"
                    type="text"
                    required
                    value={elementName}
                    onChange={(e) => setElementName(e.target.value)}
                    placeholder="ej. Precio actual, Stock disponible, etc."
                    className="form-input"
                  />
                </div>

                {/* Selector CSS editable */}
                <div className="form-group">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="elem-selector" className="form-label flex items-center gap-1">
                      <Code size={13} className="text-emerald-400" />
                      <span>Selector CSS</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleTestSelector}
                      disabled={isTesting}
                      className="test-selector-btn"
                    >
                      <Search size={11} />
                      <span>{isTesting ? 'Probando...' : 'Verificar'}</span>
                    </button>
                  </div>
                  <input
                    id="elem-selector"
                    type="text"
                    required
                    value={customSelector}
                    onChange={(e) => setCustomSelector(e.target.value)}
                    className="form-input code-font"
                  />
                </div>

                {/* Tipo de atributo a extraer */}
                <div className="form-group">
                  <label htmlFor="elem-attr" className="form-label">
                    Extraer contenido como
                  </label>
                  <select
                    id="elem-attr"
                    value={selectedAttribute}
                    onChange={(e) => {
                      setSelectedAttribute(e.target.value)
                      setTestedValue(null)
                    }}
                    className="form-select"
                  >
                    <option value="text">Texto visible (innerText)</option>
                    <option value="src">Atributo src (imágenes)</option>
                    <option value="href">Atributo href (enlaces)</option>
                    <option value="innerHTML">Código HTML interior</option>
                  </select>
                </div>

                {/* Vista previa del valor extraído */}
                <div className="form-group">
                  <label className="form-label flex items-center justify-between">
                    <span>Valor actual detectado:</span>
                    <span className="text-xs text-slate-400">En tiempo real</span>
                  </label>
                  <div className="extracted-value-box">
                    {testedValue || selected.text ? (
                      <span className="value-highlight">{testedValue ?? selected.text}</span>
                    ) : (
                      <span className="text-slate-500 italic">Sin texto detectable en este elemento</span>
                    )}
                  </div>
                </div>

                {/* Intervalo de consulta */}
                <div className="interval-notice-box">
                  <Info size={14} className="text-amber-400 shrink-0" />
                  <p>
                    Se consultará automáticamente <strong>cada 5 minutos</strong> y registrará una bitácora con cada cambio detectado.
                  </p>
                </div>

                {/* Feedback */}
                {feedbackMsg && (
                  <div className={`feedback-alert ${feedbackMsg.type}`}>
                    {feedbackMsg.text}
                  </div>
                )}

                {/* Botón de acción */}
                <button
                  type="submit"
                  disabled={isSaving || !elementName.trim()}
                  className="add-target-btn"
                >
                  {isSaving ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Agregar al Monitoreo (Cada 5 min)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="sidebar-empty-state">
                <div className="empty-icon-circle">
                  <Crosshair size={28} className="text-slate-500" />
                </div>
                <h4 className="empty-title">Ningún elemento seleccionado</h4>
                <p className="empty-desc">
                  Haz clic en cualquier <code>&lt;div&gt;</code>, precio, botón o texto dentro de la vista previa para seleccionarlo y guardarlo en la tabla.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
