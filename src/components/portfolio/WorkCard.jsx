'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import BrowserFrame from './BrowserFrame.jsx'
import ScrollPreview from './ScrollPreview.jsx'
import { sectorLabel } from '../../utils/sectorConfig.js'

// Kartu karya di grid. Pratinjau membuka modal; judul menuju halaman detail (/karya/[slug]) agar
// setiap karya punya tautan yang bisa dirayapi mesin pencari.
export default function WorkCard({ work, onOpen }) {
  return (
    <article className="group">
      <button
        type="button"
        onClick={() => onOpen(work)}
        aria-label={`Lihat pratinjau ${work.title}`}
        className="block w-full text-left"
      >
        <BrowserFrame
          url={work.url}
          className="transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift"
        >
          <ScrollPreview
            src={work.previewUrl}
            fallbackSrc={work.thumbnailUrl}
            alt={`Tampilan website ${work.title}`}
            title={work.title}
          />
        </BrowserFrame>
      </button>

      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-olive">{sectorLabel(work.sector)}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-2xl font-medium leading-tight">
            <Link href={`/karya/${work.slug}`} className="transition-colors hover:text-olive">
              {work.title}
            </Link>
          </h3>
        </div>
        <Link
          href={`/karya/${work.slug}`}
          aria-label={`Detail ${work.title}`}
          className="mt-5 shrink-0 text-ink-soft transition-all duration-300 hover:-translate-y-0.5 hover:translate-x-0.5 hover:text-olive"
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </article>
  )
}
