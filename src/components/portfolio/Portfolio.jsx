import { useCallback, useEffect, useMemo, useState } from 'react'
import FilterPill from '../FilterPill.jsx'
import Reveal from '../Reveal.jsx'
import FeaturedWork from './FeaturedWork.jsx'
import WorkCard from './WorkCard.jsx'
import WorkModal from './WorkModal.jsx'
import { getShowcases } from '../../api/client.js'
import { SECTORS, SECTOR_ORDER } from '../../utils/sectorConfig.js'

const PAGE_SIZE = 9

// Bagian portofolio: karya unggulan, filter sektor, grid, dan modal pratinjau.
// Disembunyikan jika data belum ada / API tidak tersedia.
export default function Portfolio() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let mounted = true
    getShowcases()
      .then((data) => mounted && setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const closeModal = useCallback(() => setSelected(null), [])

  const featured = useMemo(() => items.filter((w) => w.featured), [items])
  const counts = useMemo(() => {
    const c = { all: items.length }
    for (const s of SECTOR_ORDER) c[s] = items.filter((w) => w.sector === s).length
    return c
  }, [items])

  // Filter "Semua": grid berisi karya non-unggulan (unggulan sudah tampil di atas).
  // Filter sektor: grid berisi semua karya sektor itu.
  const gridItems = useMemo(
    () =>
      filter === 'all' ? items.filter((w) => !w.featured) : items.filter((w) => w.sector === filter),
    [items, filter],
  )
  const visible = showAll ? gridItems : gridItems.slice(0, PAGE_SIZE)
  const sectorCount = SECTOR_ORDER.filter((s) => counts[s] > 0).length

  if (items.length === 0) return null

  const changeFilter = (f) => {
    setFilter(f)
    setShowAll(false)
  }

  return (
    <section id="portofolio" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-28 sm:px-8">
      <Reveal className="mb-14 max-w-3xl">
        <p className="eyebrow">
          {items.length} website · {sectorCount} sektor
        </p>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-6xl">
          Karya yang sudah <span className="italic text-olive">kami bangun</span>
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
          Dari dashboard industri hingga platform komunitas. Arahkan kursor untuk melihat halamannya
          bergulir, atau klik untuk menjelajahinya.
        </p>
      </Reveal>

      {filter === 'all' && featured.length > 0 && (
        <div className="space-y-20 sm:space-y-28">
          {featured.map((w, i) => (
            <FeaturedWork key={w.id} work={w} index={i} onOpen={setSelected} />
          ))}
        </div>
      )}

      <Reveal className={`${filter === 'all' ? 'mt-24' : ''} mb-8 flex flex-wrap items-center gap-2`}>
        <FilterPill label="Semua" count={counts.all} active={filter === 'all'} onClick={() => changeFilter('all')} />
        {SECTOR_ORDER.filter((s) => counts[s] > 0).map((s) => (
          <FilterPill
            key={s}
            label={SECTORS[s]}
            count={counts[s]}
            active={filter === s}
            onClick={() => changeFilter(s)}
          />
        ))}
      </Reveal>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((w, i) => (
          <Reveal key={w.id} delay={(i % 3) * 80}>
            <WorkCard work={w} onOpen={setSelected} />
          </Reveal>
        ))}
      </div>

      {!showAll && gridItems.length > PAGE_SIZE && (
        <div className="mt-12 text-center">
          <button type="button" onClick={() => setShowAll(true)} className="btn-solid">
            Lihat semua ({gridItems.length})
          </button>
        </div>
      )}

      {selected && <WorkModal work={selected} onClose={closeModal} />}
    </section>
  )
}
