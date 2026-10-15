import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageCarouselProps {
  images?: string[] | null
  primaryImage?: string | null
  alt: string
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  images,
  primaryImage,
  alt,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set())

  // Consolidar lista única de imágenes válidas
  const validImages = useMemo(() => {
    const list: string[] = []

    if (images && Array.isArray(images)) {
      images.forEach((img) => {
        if (typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim())
        }
      })
    }

    if (primaryImage && typeof primaryImage === 'string' && primaryImage.trim()) {
      const clean = primaryImage.trim()
      if (!list.includes(clean)) {
        list.unshift(clean)
      }
    }

    return list
  }, [images, primaryImage])

  const total = validImages.length
  const currentImg =
    total > 0 && !failedIndices.has(currentIndex)
      ? validImages[currentIndex]
      : primaryImage || FALLBACK_IMAGE

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1))
  }

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex(index)
  }

  const handleImageError = () => {
    setFailedIndices((prev) => new Set(prev).add(currentIndex))
  }

  // Si solo hay 1 imagen o ninguna, mostrar imagen fija sin controles de carrusel
  if (total <= 1) {
    return (
      <div className="carousel-container single-image">
        <img
          src={currentImg}
          alt={alt}
          className="product-thumb"
          loading="lazy"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE
          }}
        />
      </div>
    )
  }

  return (
    <div className="carousel-container has-carousel">
      {/* Imagen actual con animación de transición */}
      <img
        key={`${currentImg}-${currentIndex}`}
        src={currentImg}
        alt={`${alt} - Foto ${currentIndex + 1}`}
        className="product-thumb carousel-active-img"
        loading="lazy"
        onError={handleImageError}
      />

      {/* Botón Anterior */}
      <button
        type="button"
        className="carousel-arrow carousel-arrow-prev"
        onClick={handlePrev}
        aria-label="Imagen anterior"
        title="Imagen anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Botón Siguiente */}
      <button
        type="button"
        className="carousel-arrow carousel-arrow-next"
        onClick={handleNext}
        aria-label="Siguiente imagen"
        title="Siguiente imagen"
      >
        <ChevronRight size={16} />
      </button>

      {/* Contador de Fotos */}
      <div className="carousel-counter">
        <span>
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Indicadores / Dots */}
      <div className="carousel-dots-container">
        {validImages.slice(0, 8).map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={(e) => handleDotClick(e, idx)}
            aria-label={`Ver foto ${idx + 1}`}
            title={`Foto ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
