import React, { useEffect, useState, useMemo } from 'react'
import {
  Sparkles,
  Link2,
  Search,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ClipboardPaste,
  Code2,
  ArrowUpRight,
  ShieldAlert,
  Crosshair,
  TrendingUp,
} from 'lucide-react'
import './App.css'
import type { Product, ScrapePayload, TrackedElement, HtmlPreviewData } from './types'
import { ProductImageCarousel } from './components/ProductImageCarousel'
import { HtmlVisualInspector } from './components/HtmlVisualInspector'
import { TrackedElementsTable } from './components/TrackedElementsTable'
import { ChangeHistoryModal } from './components/ChangeHistoryModal'

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'tracked_elements' | 'products'>('tracked_elements')

  // Products State
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [scraping, setScraping] = useState<boolean>(false)
  const [refreshingOfferId, setRefreshingOfferId] = useState<number | null>(null)

  // Tracked Elements State
  const [trackedElements, setTrackedElements] = useState<TrackedElement[]>([])
  const [previewModalData, setPreviewModalData] = useState<HtmlPreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [historyModalElement, setHistoryModalElement] = useState<TrackedElement | null>(null)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(300)
  const [isAutoChecking, setIsAutoChecking] = useState<boolean>(true)
  const [isCheckingAll, setIsCheckingAll] = useState<boolean>(false)
  const [checkingElementId, setCheckingElementId] = useState<number | null>(null)

  // Inputs & Mode
  const [inputUrl, setInputUrl] = useState<string>('')
  const [inputMode, setInputMode] = useState<'url' | 'json'>('url')
  const [jsonPayload, setJsonPayload] = useState<string>('')

  // Search & Filters for Products
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedStore, setSelectedStore] = useState<string>('all')

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Manual fallback modal when extraction is blocked
  const [showManualModal, setShowManualModal] = useState<boolean>(false)
  const [manualForm, setManualForm] = useState<ScrapePayload>({
    name: '',
    price: 0,
    old_price: 0,
    url: '',
    store_name: '',
    brand: '',
    image_url: '',
  })

  // Load products & tracked elements on mount
  useEffect(() => {
    fetchProducts()
    fetchTrackedElements()
  }, [])

  // 5-minute auto check interval countdown
  useEffect(() => {
    if (!isAutoChecking) return

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          handleCheckAllTracked(true)
          return 300 // Reset to 5 min (300 seconds)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isAutoChecking])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data)
      }
    } catch {
      showToast('No se pudo conectar con el backend de Laravel', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrackedElements = async () => {
    try {
      const res = await fetch('/api/tracked-elements')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setTrackedElements(json.data)
      }
    } catch {
      // Ignorar fallo de conexión inicial
    }
  }

  // Detect Store from URL
  const detectedStore = useMemo(() => {
    const url = inputUrl.toLowerCase()
    if (url.includes('walmart')) return { name: 'Walmart México', color: '#0071dc', bg: 'rgba(0, 113, 220, 0.15)' }
    if (url.includes('cyberpuerta')) return { name: 'Cyberpuerta', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
    if (url.includes('mercadolibre')) return { name: 'Mercado Libre', color: '#ffe600', bg: 'rgba(255, 230, 0, 0.15)' }
    if (url.includes('amazon')) return { name: 'Amazon México', color: '#ff9900', bg: 'rgba(255, 153, 0, 0.15)' }
    if (url.includes('ddtech')) return { name: 'DDTech', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' }
    if (url.includes('coppel')) return { name: 'Coppel', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' }
    if (url.includes('doto')) return { name: 'Doto', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }
    return null
  }, [inputUrl])

  // Handle URL Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setInputUrl(text)
        showToast('Enlace pegado del portapapeles')
      }
    } catch {
      showToast('Pega directamente con Ctrl+V en el campo', 'error')
    }
  }

  // Abrir el Inspector Visual HTML para previsualizar y seleccionar cualquier div
  const handleOpenInspector = async (urlOverride?: string) => {
    const targetUrl = (urlOverride || inputUrl).trim()
    if (!targetUrl) {
      showToast('Pega un enlace en el campo superior para previsualizarlo', 'error')
      return
    }

    try {
      setPreviewLoading(true)
      const res = await fetch('/api/inspector/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.data) {
        setPreviewModalData(data.data)
      } else {
        showToast(data.message || 'No se pudo obtener la vista previa del HTML', 'error')
      }
    } catch {
      showToast('Error de red al cargar la vista previa', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Guardar elemento seleccionado en el inspector
  const handleAddTrackedElement = async (payload: {
    name: string
    url: string
    selector: string
    attribute: string
    initial_value: string
    check_interval_minutes: number
  }) => {
    const res = await fetch('/api/tracked-elements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error al guardar el elemento.')
    }

    showToast(`¡"${payload.name}" agregado a la tabla de monitoreo!`)
    fetchTrackedElements()
    setActiveTab('tracked_elements')
  }

  // Consultar manualmente un solo elemento
  const handleCheckSingleTracked = async (id: number) => {
    try {
      setCheckingElementId(id)
      const res = await fetch(`/api/tracked-elements/${id}/check`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast(data.message)
        fetchTrackedElements()
      } else {
        showToast(data.message || 'Error al consultar el elemento', 'error')
      }
    } catch {
      showToast('Error de red al consultar el elemento', 'error')
    } finally {
      setCheckingElementId(null)
    }
  }

  // Consultar todos los elementos en lote (cada 5 min o forzado)
  const handleCheckAllTracked = async (silent = false) => {
    try {
      setIsCheckingAll(true)
      const res = await fetch('/api/tracked-elements/check-all', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (!silent || (data.changed_count && data.changed_count > 0)) {
          showToast(data.message)
        }
        fetchTrackedElements()
      }
    } catch {
      if (!silent) {
        showToast('Error de red en consulta masiva', 'error')
      }
    } finally {
      setIsCheckingAll(false)
    }
  }

  // Pausar / Reactivar elemento
  const handleToggleStatusTracked = async (id: number) => {
    try {
      const res = await fetch(`/api/tracked-elements/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast(data.message)
        fetchTrackedElements()
      }
    } catch {
      showToast('Error al cambiar estado', 'error')
    }
  }

  // Eliminar elemento de la tabla
  const handleDeleteTracked = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este elemento del monitoreo?')) return
    try {
      const res = await fetch(`/api/tracked-elements/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setTrackedElements((prev) => prev.filter((item) => item.id !== id))
        showToast('Elemento eliminado correctamente')
      }
    } catch {
      showToast('Error al eliminar elemento', 'error')
    }
  }

  // Handle Auto Scrape Submit (Modo tradicional de producto)
  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    let rawUrl = inputUrl.trim()
    if (!rawUrl) return

    rawUrl = rawUrl.replace(/^(https?:\/\/)?(www\.)?ddtech\.com\.mx/i, '$1$2ddtech.mx')

    try {
      setScraping(true)
      const res = await fetch('/api/products/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        showToast('¡Producto extraído y guardado con éxito!')
        setInputUrl('')
        fetchProducts()
        setActiveTab('products')
      } else {
        const preview = data.extracted_preview || {}
        setManualForm({
          name: preview.name || '',
          price: preview.price || 0,
          old_price: preview.old_price || 0,
          url: rawUrl,
          store_name: preview.store_name || detectedStore?.name || 'Tienda Online',
          brand: preview.brand || '',
          image_url: preview.image_url || '',
        })
        setShowManualModal(true)
      }
    } catch {
      showToast('Error de red al procesar el enlace', 'error')
    } finally {
      setScraping(false)
    }
  }

  // Handle JSON Scrape Submit
  const handleJsonSubmit = async () => {
    if (!jsonPayload.trim()) return
    try {
      setScraping(true)
      const parsed = JSON.parse(jsonPayload)
      const res = await fetch('/api/scraper/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('¡Datos de Maxun/JSON importados con éxito!')
        setJsonPayload('')
        fetchProducts()
        setActiveTab('products')
      } else {
        showToast(data.message || 'Error de validación al importar JSON', 'error')
      }
    } catch {
      showToast('Formato JSON inválido. Revisa la sintaxis.', 'error')
    } finally {
      setScraping(false)
    }
  }

  // Save manual / fallback modal form
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setScraping(true)
      const res = await fetch('/api/scraper/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(manualForm),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('¡Producto guardado exitosamente en MySQL!')
        setShowManualModal(false)
        setInputUrl('')
        fetchProducts()
        setActiveTab('products')
      } else {
        showToast(data.message || 'Error al guardar producto', 'error')
      }
    } catch {
      showToast('Error al conectar con la API', 'error')
    } finally {
      setScraping(false)
    }
  }

  // Refresh Price of a catalog offer
  const handleRefreshPrice = async (offerId: number) => {
    try {
      setRefreshingOfferId(offerId)
      const res = await fetch(`/api/offers/${offerId}/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('¡Precio verificado y actualizado!')
        fetchProducts()
      } else {
        showToast(data.message || 'No se pudo refrescar el precio en este momento', 'error')
      }
    } catch {
      showToast('Error de red al actualizar precio', 'error')
    } finally {
      setRefreshingOfferId(null)
    }
  }

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto monitoreado?')) return
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
        showToast('Producto eliminado')
      }
    } catch {
      showToast('Error al eliminar producto', 'error')
    }
  }

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStore =
        selectedStore === 'all' ||
        p.offers?.some((o) => o.store?.slug === selectedStore)

      return matchesSearch && matchesStore
    })
  }, [products, searchQuery, selectedStore])

  // Extract unique stores for filters
  const uniqueStores = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) => {
      p.offers?.forEach((o) => {
        if (o.store?.slug && o.store?.name) {
          map.set(o.store.slug, o.store.name)
        }
      })
    })
    return Array.from(map.entries())
  }, [products])

  // Stats
  const totalTrackedChanges = trackedElements.reduce(
    (acc, item) => acc + (item.logs?.filter((l) => l.has_changed).length || 0),
    0
  )

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="brand-title">Web Scraper & Tracker Inteligente</h1>
            <p className="brand-subtitle">Inspector Visual HTML + Monitoreo Automático cada 5 minutos</p>
          </div>
        </div>

        <div className="header-status">
          <div className="status-dot"></div>
          <span>API Laravel & MySQL 8.4 En Línea</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Crosshair size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{trackedElements.length}</div>
            <div className="stat-label">Elementos en Monitoreo</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalTrackedChanges}</div>
            <div className="stat-label">Cambios Registrados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">5 min</div>
            <div className="stat-label">Frecuencia Programada</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Productos en Catálogo</div>
          </div>
        </div>
      </section>

      {/* Main Scraper Input Box */}
      <section className="scraper-box">
        <div className="scraper-header">
          <div className="scraper-title-group">
            <h2>Previsualizar HTML e Inspeccionar Elementos</h2>
            <p>Pega cualquier enlace para renderizar su HTML en vivo, seleccionar cualquier <code>&lt;div&gt;</code> o texto y agregarlo a la tabla.</p>
          </div>

          <div className="scraper-mode-toggle">
            <button
              className={`mode-tab ${inputMode === 'url' ? 'active' : ''}`}
              onClick={() => setInputMode('url')}
            >
              <Link2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Pegar Enlace
            </button>
            <button
              className={`mode-tab ${inputMode === 'json' ? 'active' : ''}`}
              onClick={() => setInputMode('json')}
            >
              <Code2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Maxun / JSON
            </button>
          </div>
        </div>

        {inputMode === 'url' ? (
          <div>
            <form onSubmit={handleScrapeUrl} className="url-input-container">
              <div className="input-with-icon">
                <div className="input-icon-left">
                  <Link2 size={18} />
                </div>
                <input
                  type="url"
                  className="main-url-input"
                  placeholder="Pega aquí la URL: https://ddtech.mx/... o https://www.coppel.com/... o cualquier sitio web"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                />

                {detectedStore && (
                  <span
                    className="store-detected-badge"
                    style={{ background: detectedStore.bg, color: detectedStore.color }}
                  >
                    {detectedStore.name}
                  </span>
                )}

                <button
                  type="button"
                  className="paste-quick-btn"
                  onClick={handlePasteClipboard}
                  title="Pegar del portapapeles"
                >
                  <ClipboardPaste size={14} />
                  Pegar
                </button>
              </div>

              {/* Botón Principal: Previsualizar e Inspeccionar HTML */}
              <button
                type="button"
                onClick={() => handleOpenInspector()}
                disabled={previewLoading || !inputUrl.trim()}
                className="open-inspector-btn"
                style={{ padding: '0.85rem 1.4rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
              >
                {previewLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    Cargando HTML...
                  </>
                ) : (
                  <>
                    <Crosshair size={18} />
                    Previsualizar e Inspeccionar HTML
                  </>
                )}
              </button>

              {/* Botón Secundario: Extracción Automática */}
              <button
                type="submit"
                className="submit-scrape-btn"
                disabled={scraping || !inputUrl.trim()}
                title="Extraer automáticamente producto completo"
              >
                {scraping ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    Extrayendo...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Extracción Rápida
                  </>
                )}
              </button>
            </form>

          </div>
        ) : (
          <div className="json-input-container">
            <textarea
              className="json-textarea"
              rows={5}
              placeholder='Pega aquí el payload JSON de Maxun o del scraper: {"name": "...", "price": 12999, "url": "..."}'
              value={jsonPayload}
              onChange={(e) => setJsonPayload(e.target.value)}
            />
            <button
              className="submit-scrape-btn"
              onClick={handleJsonSubmit}
              disabled={scraping || !jsonPayload.trim()}
            >
              {scraping ? <RefreshCw size={18} className="spin" /> : <Code2 size={18} />}
              Importar JSON
            </button>
          </div>
        )}
      </section>

      {/* Tabs de Navegación Principal */}
      <div className="app-nav-tabs">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'tracked_elements' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracked_elements')}
        >
          <Crosshair size={16} />
          <span>Elementos Monitoreados (Cada 5 min)</span>
          <span className="tab-badge">{trackedElements.length}</span>
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <ShoppingBag size={16} />
          <span>Catálogo de Productos Completo</span>
          <span className="tab-badge">{products.length}</span>
        </button>
      </div>

      {/* Vista 1: Tabla de Elementos Monitoreados con selector visual y consulta periódica */}
      {activeTab === 'tracked_elements' && (
        <TrackedElementsTable
          elements={trackedElements}
          countdownSeconds={countdownSeconds}
          isAutoChecking={isAutoChecking}
          isCheckingAll={isCheckingAll}
          checkingId={checkingElementId}
          onOpenInspector={() => handleOpenInspector()}
          onCheckSingle={handleCheckSingleTracked}
          onCheckAll={() => handleCheckAllTracked(false)}
          onOpenHistory={(el) => setHistoryModalElement(el)}
          onToggleStatus={handleToggleStatusTracked}
          onDeleteElement={handleDeleteTracked}
          onToggleAutoCheck={() => setIsAutoChecking(!isAutoChecking)}
        />
      )}

      {/* Vista 2: Catálogo de Productos Completo (con carruseles de fotos) */}
      {activeTab === 'products' && (
        <div>
          {/* Filters Bar */}
          <div className="catalog-header">
            <div className="search-filter-group">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por producto, marca o modelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="store-select"
              >
                <option value="all">Todas las tiendas</option>
                {uniqueStores.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={36} className="spin text-cyan-400 mb-3" />
              <p>Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} className="text-slate-600 mb-3" />
              <h3>No se encontraron productos</h3>
              <p>Pega un enlace en el campo superior para extraer un producto o inspeccionar sus elementos.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const primaryOffer = product.offers?.[0]
                const allHistories = product.offers?.flatMap((o) => o.price_histories || []) || []
                allHistories.sort(
                  (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
                )

                const currentPrice = primaryOffer ? parseFloat(String(primaryOffer.price)) : 0
                const oldPrice = primaryOffer?.old_price ? parseFloat(String(primaryOffer.old_price)) : 0
                const discount =
                  oldPrice > currentPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0

                const storeSlug = primaryOffer?.store?.slug || 'generic'
                const storeName = primaryOffer?.store?.name || 'Tienda'

                return (
                  <div key={product.id} className="product-card">
                    {/* Media Gallery / Interactive Carousel */}
                    <div className="card-media">
                      <div className="card-badges-top">
                        <span className={`store-tag store-${storeSlug}`}>{storeName}</span>
                        {discount > 0 && <span className="discount-tag">-{discount}%</span>}
                      </div>

                      <ProductImageCarousel
                        images={product.images}
                        primaryImage={product.image_url}
                        alt={product.name}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="card-content">
                      <div className="card-meta">
                        {product.brand && <span className="brand-badge">{product.brand}</span>}
                        {product.sku && <span className="sku-badge">SKU: {product.sku}</span>}
                      </div>

                      <h3 className="product-title" title={product.name}>
                        {product.name}
                      </h3>

                      {/* Pricing Box */}
                      <div className="price-container">
                        <div className="current-price-row">
                          <span className="current-price">
                            ${currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="currency-badge">{primaryOffer?.currency || 'MXN'}</span>
                        </div>

                        {oldPrice > currentPrice && (
                          <div className="old-price-row">
                            <span className="old-price-label">Antes:</span>
                            <span className="old-price-value">
                              ${oldPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="save-badge">
                              Ahorro: ${(oldPrice - currentPrice).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mini Price History Sparkline / Dots */}
                      {allHistories.length > 1 && (
                        <div className="history-preview">
                          <div className="history-header">
                            <span className="history-label">Historial de variaciones</span>
                            <span className="history-count">{allHistories.length} registros</span>
                          </div>
                          <div className="history-dots">
                            {allHistories.slice(0, 8).map((h, i) => (
                              <div
                                key={h.id || i}
                                className={`history-dot ${i === 0 ? 'dot-latest' : ''}`}
                                title={`$${parseFloat(String(h.price)).toLocaleString('es-MX')} (${new Date(h.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="card-footer">
                        {primaryOffer?.url && (
                          <a
                            href={primaryOffer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-action btn-visit"
                          >
                            <span>Ir a tienda</span>
                            <ArrowUpRight size={14} />
                          </a>
                        )}

                        {primaryOffer && (
                          <button
                            type="button"
                            className="btn-action btn-refresh"
                            onClick={() => handleRefreshPrice(primaryOffer.id)}
                            disabled={refreshingOfferId === primaryOffer.id}
                            title="Re-consultar precio en vivo"
                          >
                            <RefreshCw
                              size={14}
                              className={refreshingOfferId === primaryOffer.id ? 'spin' : ''}
                            />
                            <span>{refreshingOfferId === primaryOffer.id ? 'Actualizando...' : 'Actualizar'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Eliminar del catálogo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal del Inspector Visual HTML (Previsualiza y selecciona cualquier div) */}
      {previewModalData && (
        <HtmlVisualInspector
          previewData={previewModalData}
          onClose={() => setPreviewModalData(null)}
          onAddElement={handleAddTrackedElement}
        />
      )}

      {/* Modal de Historial de Cambios y Bitácora Cronológica */}
      {historyModalElement && (
        <ChangeHistoryModal
          element={historyModalElement}
          onClose={() => setHistoryModalElement(null)}
          onRefreshNow={handleCheckSingleTracked}
        />
      )}

      {/* Manual Entry Fallback Modal */}
      {showManualModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-400" />
                <h3 className="modal-title">Completar Datos del Producto</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowManualModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="modal-form">
              <p className="modal-desc">
                La página fue accedida, pero puedes verificar y afinar los detalles antes de guardarlo en MySQL:
              </p>

              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="Ej: Samsung Galaxy S25 Ultra 256GB"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Precio Actual (MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    value={manualForm.price || ''}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="24999.00"
                  />
                </div>

                <div className="form-group">
                  <label>Precio Anterior (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={manualForm.old_price || ''}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        old_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="26999.00"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Tienda</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualForm.store_name || ''}
                    onChange={(e) => setManualForm({ ...manualForm, store_name: e.target.value })}
                    placeholder="Walmart México / Cyberpuerta"
                  />
                </div>

                <div className="form-group">
                  <label>Marca (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={manualForm.brand || ''}
                    onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                    placeholder="Samsung, Apple, Asus..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>URL de Imagen (Opcional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={manualForm.image_url || ''}
                  onChange={(e) => setManualForm({ ...manualForm, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-action btn-refresh"
                  onClick={() => setShowManualModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="submit-scrape-btn" disabled={scraping}>
                  {scraping ? 'Guardando...' : 'Guardar en MySQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
