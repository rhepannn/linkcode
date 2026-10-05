'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Monitor, Smartphone, X } from 'lucide-react'
import BrowserFrame from './BrowserFrame.jsx'
import { sectorLabel } from '../../utils/sectorConfig.js'

// Modal pratinjau layar penuh.
// - embeddable  → iframe live (pengunjung bisa scroll halaman asli)
// - ada video   → rekaman scroll
// - lainnya     → screenshot halaman penuh yang bisa di-scroll
export default function WorkModal({ work, onClose }) {
  const closeRef = useRef(null)
  const [device, setDevice] = useState('desktop')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const mode = work.embeddable ? 'iframe' : work.videoUrl ? 'video' : work.previewUrl ? 'image' : 'none'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${work.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`flex w-full max-w-6xl flex-col rounded-2xl bg-cream p-3 shadow-lift sm:h-full sm:max-h-[920px] sm:p-4 ${
          mode === 'video' ? 'h-auto' : 'h-full max-h-[920px]'
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-olive">
              {sectorLabel(work.sector)}
            </p>
            <h3 className="truncate font-display text-2xl font-medium leading-tight">{work.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'iframe' && (
              <div className="hidden rounded-full border border-sand-light bg-paper p-0.5 sm:flex">
                {[
                  ['desktop', Monitor, 'Tampilan desktop'],
                  ['mobile', Smartphone, 'Tampilan mobile'],
                ].map(([id, Icon, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDevice(id)}
                    aria-label={label}
                    aria-pressed={device === id}
                    className={`rounded-full p-1.5 transition-colors ${
                      device === id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            )}
            <a
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-sand-light bg-paper px-4 py-2 text-sm transition-colors hover:border-ink"
            >
              Buka situs <ExternalLink size={14} />
            </a>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="rounded-full bg-ink p-2 text-paper transition-colors hover:bg-olive"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <BrowserFrame url={work.url} className={`min-h-0 ${mode === 'video' ? 'sm:flex-1' : 'flex-1'}`}>
          <div className={`relative min-h-0 bg-sand-light/40 ${mode === 'video' ? 'sm:flex-1' : 'flex-1'}`}>
            {mode === 'iframe' && (
              <>
                {/* Tetap terlihat di belakang iframe: situs bisa butuh beberapa detik untuk tampil. */}
                <p className="absolute inset-0 flex items-center justify-center text-sm text-ink-soft">
                  Memuat halaman…
                </p>
                <iframe
                  src={work.url}
                  title={`Pratinjau ${work.title}`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className={`relative mx-auto h-full transition-[width] duration-300 ${
                    device === 'mobile' ? 'w-[390px] max-w-full border-x border-sand-light' : 'w-full'
                  }`}
                />
              </>
            )}

            {mode === 'video' && (
              <video
                src={work.videoUrl}
                poster={work.thumbnailUrl || undefined}
                className="aspect-video w-full object-contain object-top sm:aspect-auto sm:h-full"
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            )}

            {mode === 'image' && (
              <div className="h-full overflow-y-auto">
                <img src={work.previewUrl} alt={`Tampilan website ${work.title}`} className="block w-full" />
              </div>
            )}

            {mode === 'none' && (
              <p className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-soft">
                Pratinjau belum tersedia. Silakan buka situsnya langsung.
              </p>
            )}
          </div>
        </BrowserFrame>

        <p className="mt-3 px-1 text-xs text-ink-soft">
          {mode === 'iframe'
            ? 'Halaman asli, bisa di-scroll dan diklik. Jika tidak tampil, gunakan “Buka situs”.'
            : 'Pratinjau berupa rekaman halaman. Untuk menjelajahinya secara penuh, gunakan “Buka situs”.'}
        </p>
      </div>
    </div>
  )
}
