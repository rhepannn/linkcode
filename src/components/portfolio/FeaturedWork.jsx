import { ArrowUpRight, Play } from 'lucide-react'
import BrowserFrame from './BrowserFrame.jsx'
import ScrollPreview from './ScrollPreview.jsx'
import Reveal from '../Reveal.jsx'
import { sectorLabel } from '../../utils/sectorConfig.js'

// Karya unggulan: layout besar, selang-seling kiri/kanan. Pratinjau bergulir sendiri saat terlihat.
export default function FeaturedWork({ work, index, onOpen }) {
  const flip = index % 2 === 1
  return (
    <Reveal className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
      <div className={`lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
        <button
          type="button"
          onClick={() => onOpen(work)}
          aria-label={`Lihat pratinjau ${work.title}`}
          className="group block w-full text-left"
        >
          <BrowserFrame
            url={work.url}
            className="transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lift"
          >
            <ScrollPreview
              src={work.previewUrl}
              fallbackSrc={work.thumbnailUrl}
              alt={`Tampilan website ${work.title}`}
              title={work.title}
              autoplay
            />
          </BrowserFrame>
        </button>
      </div>

      <div className={`lg:col-span-5 ${flip ? 'lg:order-1' : ''}`}>
        <p className="font-mono text-xs text-sand">{String(index + 1).padStart(2, '0')}</p>
        <p className="eyebrow mt-4">{sectorLabel(work.sector)}</p>
        <h3 className="mt-3 font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
          {work.title}
        </h3>
        <p className="mt-4 max-w-md leading-relaxed text-ink-soft">{work.description}</p>

        {work.techStack?.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {work.techStack.map((t) => (
              <li key={t} className="rounded-full border border-sand-light px-3 py-1 font-mono text-[11px] text-ink-soft">
                {t}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => onOpen(work)} className="btn-solid">
            <Play size={14} />
            Lihat pratinjau
          </button>
          <a
            href={work.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Kunjungi situs <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </Reveal>
  )
}
