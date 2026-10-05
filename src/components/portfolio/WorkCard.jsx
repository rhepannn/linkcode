import { ArrowUpRight } from 'lucide-react'
import BrowserFrame from './BrowserFrame.jsx'
import ScrollPreview from './ScrollPreview.jsx'
import { sectorLabel } from '../../utils/sectorConfig.js'

// Kartu karya di grid. Klik membuka modal pratinjau.
export default function WorkCard({ work, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(work)}
      aria-label={`Lihat pratinjau ${work.title}`}
      className="group block w-full text-left"
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

      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-olive">
            {sectorLabel(work.sector)}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-2xl font-medium leading-tight">
            {work.title}
          </h3>
        </div>
        <ArrowUpRight
          size={20}
          className="mt-5 shrink-0 text-ink-soft transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-olive"
        />
      </div>
    </button>
  )
}
