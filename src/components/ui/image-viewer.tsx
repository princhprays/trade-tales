import { useState, useRef, useEffect } from 'react'

interface Image {
  preview: string
  name: string
  data?: string
}

interface ImageViewerProps {
  images: Image[]
  isOpen: boolean
  onClose: () => void
  initialImageIndex?: number
}

export function ImageViewer({
  images,
  isOpen,
  onClose,
  initialImageIndex = 0
}: ImageViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(initialImageIndex)
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen, initialImageIndex])

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Mouse events for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }
  const handleMouseUp = () => setIsDragging(false)

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.5), 3)
    // Zoom towards mouse
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newPosition = {
      x: position.x - (x - position.x) * (delta - 1),
      y: position.y - (y - position.y) * (delta - 1)
    }
    setScale(newScale)
    setPosition(newPosition)
  }

  // Touch pinch zoom
  useEffect(() => {
    const container = imageContainerRef.current
    if (!container) return
    let lastDist: number | null = null
    let lastCenter: { x: number, y: number } | null = null
    function getTouchDist(e: TouchEvent) {
      const [a, b] = e.touches
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }
    function getTouchCenter(e: TouchEvent) {
      const [a, b] = e.touches
      if (!container) return { x: 0, y: 0 }
      return {
        x: (a.clientX + b.clientX) / 2 - container.getBoundingClientRect().left,
        y: (a.clientY + b.clientY) / 2 - container.getBoundingClientRect().top
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dist = getTouchDist(e)
        const center = getTouchCenter(e)
        if (lastDist !== null && lastCenter !== null) {
          const delta = dist / lastDist
          let newScale = Math.min(Math.max(scale * delta, 0.5), 3)
          setScale(newScale)
          setPosition(pos => ({
            x: pos.x - (center.x - pos.x) * (delta - 1),
            y: pos.y - (center.y - pos.y) * (delta - 1)
          }))
        }
        lastDist = dist
        lastCenter = center
      }
    }
    function onTouchEnd(e: TouchEvent) {
      lastDist = null
      lastCenter = null
    }
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    return () => {
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [scale])

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null
  const currentImage = images[currentImageIndex]
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative bg-neutral-900 rounded-xl shadow-2xl p-6 flex flex-col items-center max-w-[90vw] max-h-[90vh]">
        {/* Top right controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => {
              setScale(1)
              setPosition({ x: 0, y: 0 })
            }}
            className="bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-base hover:bg-black border border-white/10 shadow"
            title="Reset"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-black border border-white/10 shadow"
            title="Close"
          >
            ×
          </button>
        </div>
        {/* Image */}
        <div
          ref={imageContainerRef}
          className="flex items-center justify-center w-full h-full cursor-pointer relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ touchAction: 'none', maxWidth: '80vw', maxHeight: '70vh', minHeight: '200px', minWidth: '200px' }}
        >
          {currentImage && (
            <img
              src={currentImage.preview}
              alt={currentImage.name}
              className="max-w-full max-h-[60vh] object-contain select-none rounded-lg shadow-lg bg-neutral-800"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                willChange: 'transform',
                transformOrigin: 'center center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'all',
              }}
              draggable="false"
            />
          )}
        </div>
        {/* Bottom center navigation */}
        {images.length > 1 && (
          <div className="mt-6 flex items-center gap-4 z-10 bg-black/60 rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
              className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              title="Previous"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-white text-sm select-none">
              {currentImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
              className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              title="Next"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}