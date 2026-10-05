'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const isTouch = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches

// Menampilkan screenshot halaman penuh yang "ter-scroll" otomatis dari atas ke bawah.
// - Desktop: bergeser saat kursor di atas kartu.
// - Layar sentuh / `autoplay`: bergeser sekali saat kartu terlihat di layar.
// Jika tinggi gambar tidak melebihi kotak, gambar diam.
export default function ScrollPreview({ src, fallbackSrc, alt, title, autoplay = false, className = '' }) {
  const box = useRef(null)
  const img = useRef(null)
  const [shift, setShift] = useState(0)
  const [hover, setHover] = useState(false)
  const [inView, setInView] = useState(false)
  const [failed, setFailed] = useState(false)

  const measure = useCallback(() => {
    if (!box.current || !img.current) return
    setShift(Math.max(0, img.current.offsetHeight - box.current.offsetHeight))
  }, [])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.6), {
      threshold: [0, 0.6],
    })
    io.observe(el)
    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [measure])

  const source = src || fallbackSrc
  const active = !prefersReducedMotion() && shift > 0 && (hover || ((autoplay || isTouch()) && inView))
  const seconds = Math.min(18, Math.max(4, shift / 110)) // ±110px per detik

  return (
    <div
      ref={box}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative aspect-[16/10] overflow-hidden bg-sand-light/60 ${className}`}
    >
      {source && !failed ? (
        <img
          ref={img}
          src={source}
          alt={alt}
          loading="lazy"
          draggable={false}
          onLoad={measure}
          onError={() => setFailed(true)}
          className="block w-full select-none will-change-transform"
          style={{
            transform: `translateY(${active ? -shift : 0}px)`,
            transition: active
              ? `transform ${seconds}s cubic-bezier(0.45, 0.05, 0.35, 1)`
              : 'transform 0.8s ease',
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-sand-light to-cream p-6 text-center font-display text-3xl italic text-olive/70">
          {title}
        </div>
      )}
    </div>
  )
}
