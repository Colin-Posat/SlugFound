'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ImageOverlayProps {
  src: string
  alt: string
  trigger: ReactNode
}

export default function ImageOverlay({ src, alt, trigger }: ImageOverlayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const overlay = isOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* Clicking the image itself does not close the overlay */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close image"
          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink shadow-md transition hover:bg-surface-2"
        >
          ×
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block w-full cursor-pointer focus:outline-none"
        aria-label={`View ${alt} fullscreen`}
      >
        {trigger}
      </button>
      {mounted && overlay && createPortal(overlay, document.body)}
    </>
  )
}
