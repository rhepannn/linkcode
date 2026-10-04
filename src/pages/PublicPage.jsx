import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import FilterPill from '../components/FilterPill.jsx'
import WaveFooter from '../components/WaveFooter.jsx'
import PixelClouds from '../components/PixelClouds.jsx'
import PixelBird from '../components/PixelBird.jsx'
import { getProjects, getSettings } from '../api/client.js'
import { MOCK_PROJECTS } from '../data/projects.js'
import { STATUS_ORDER, STATUS_CONFIG } from '../utils/statusConfig.js'

// Fallback kalau API settings belum tersedia.
const FALLBACK_WA = import.meta.env.VITE_WHATSAPP_NUMBER || '628123456789'

const HIGHLIGHTS = [
  {
    no: '01',
    icon: '👁️',
    title: 'Transparan',
    text: 'Progress project ditampilkan apa adanya, real-time',
    tag: 'REAL-TIME',
    dot: '#3DF06F',
    stat: 'TRUST',
    power: 6,
  },
  {
    no: '02',
    icon: '👥',
    title: 'Terstruktur',
    text: 'Setiap project punya PIC yang jelas & bertanggung jawab',
    tag: 'PIC JELAS',
    dot: '#2DE2E6',
    stat: 'TEAM',
    power: 5,
  },
  {
    no: '03',
    icon: '🚀',
    title: 'Aktif',
    text: 'Bukan portofolio lama — ini yang sedang berjalan sekarang',
    tag: 'LIVE NOW',
    dot: '#FFD23F',
    stat: 'SPEED',
    power: 6,
  },
]

function Hero() {
  return (
    <section className="scanlines relative overflow-hidden bg-gradient-to-br from-navy to-brand-blue text-white">
      <PixelClouds />
      <PixelBird />
      <div className="pixel-grid relative z-10">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-2 border-2 border-neon-green/50 px-3 py-1.5 font-pixel text-[10px] uppercase tracking-wider text-neon-green">
            <span className="h-2 w-2 animate-blink bg-neon-green" />
            Software Development Studio
          </span>

          <h1 className="mx-auto mt-7 max-w-3xl font-display text-pixel-shadow text-3xl leading-relaxed sm:text-5xl sm:leading-relaxed">
            Tim developer yang bekerja nyata,{' '}
            <span className="text-sky-blue">progress yang bisa kamu pantau</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-xl text-light-blue/90">
            Kami tidak hanya menjanjikan — kami menunjukkan. Setiap project yang sedang dikerjakan
            bisa kamu lihat langsung di sini.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="group relative border-2 border-light-blue/30 bg-white/5 p-5 text-left shadow-[4px_4px_0_0_rgba(74,144,217,0.5)] transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#3DF06F]"
                style={{ '--accent': h.dot }}
              >
                {/* nomor index pojok kanan atas */}
                <span className="absolute right-3 top-3 font-pixel text-[9px]" style={{ color: h.dot }}>
                  {h.no}
                </span>

                {/* ikon dalam box pixel */}
                <span
                  className="flex h-12 w-12 items-center justify-center border-2 bg-navy text-2xl"
                  style={{ borderColor: h.dot }}
                >
                  {h.icon}
                </span>

                {/* tag status + dot berkedip */}
                <div className="mt-3 inline-flex items-center gap-1.5 border border-light-blue/30 px-2 py-1">
                  <span
                    className="h-2 w-2 animate-blink"
                    style={{ backgroundColor: h.dot }}
                  />
                  <span className="font-pixel text-[7px] uppercase tracking-wider text-light-blue/70">
                    {h.tag}
                  </span>
                </div>

                <p className="mt-3 font-pixel text-xs text-sky-blue">{h.title}</p>
                <p className="mt-2 text-lg leading-snug text-light-blue/80">{h.text}</p>

                {/* power bar segmen ala level karakter */}
                <div className="mt-4 flex items-center justify-between border-t border-light-blue/15 pt-3">
                  <span className="font-pixel text-[7px] uppercase tracking-wider text-light-blue/40">
                    {h.stat}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2.5 w-1.5 ${i < h.power ? '' : 'bg-white/15'}`}
                        style={i < h.power ? { backgroundColor: h.dot } : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CTA({ waNumber }) {
  const waLink = `https://wa.me/${waNumber || FALLBACK_WA}`
  return (
    <section className="scanlines bg-navy text-white">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-20 text-center sm:px-6">
        <p className="font-pixel text-[10px] uppercase tracking-widest text-neon-green">
          // Tertarik bekerja sama?
        </p>
        <h2 className="mt-4 font-display text-2xl leading-relaxed sm:text-3xl sm:leading-relaxed">
          Mari diskusikan project kamu
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-xl text-light-blue/80">
          Ceritakan kebutuhan bisnis kamu, kami bantu carikan solusi yang tepat
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-pixel mt-8 border-sky-blue bg-sky-blue px-7 py-4 text-white shadow-[5px_5px_0_0_#A8C8EE] hover:bg-sky-blue/90 active:shadow-none"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.515zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          Chat di WhatsApp
        </a>
      </div>
    </section>
  )
}

export default function PublicPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [waNumber, setWaNumber] = useState(FALLBACK_WA)

  useEffect(() => {
    let mounted = true
    getProjects()
      .then((data) => {
        if (mounted) setProjects(Array.isArray(data) ? data : MOCK_PROJECTS)
      })
      .catch(() => {
        // Fallback ke data mock jika API error — halaman publik tetap jalan.
        if (mounted) setProjects(MOCK_PROJECTS)
      })
      .finally(() => mounted && setLoading(false))

    // Ambil nomor WhatsApp dari pengaturan (fallback ke env jika gagal).
    getSettings()
      .then((s) => {
        if (mounted && s?.whatsappNumber) setWaNumber(s.whatsappNumber)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const counts = useMemo(() => {
    const c = { all: projects.length }
    for (const s of STATUS_ORDER) c[s] = projects.filter((p) => p.status === s).length
    return c
  }, [projects])

  const filtered = useMemo(
    () => (filter === 'all' ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  )

  const activeCount = counts.active || 0

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar />
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-xl leading-relaxed text-navy sm:text-2xl sm:leading-relaxed">
            <span className="text-sky-blue">{'>'}</span> Project yang sedang dikerjakan
          </h2>
          <p className="mt-1 font-pixel text-[10px] uppercase tracking-wide text-navy/60">
            {activeCount} project aktif saat ini
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <FilterPill
            label="Semua"
            count={counts.all}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {STATUS_ORDER.map((s) => (
            <FilterPill
              key={s}
              label={STATUS_CONFIG[s].label}
              count={counts[s]}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>

        {loading ? (
          <p className="py-12 text-center text-navy/50">Memuat project…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-navy/50">Belum ada project pada kategori ini.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      <CTA waNumber={waNumber} />
      <WaveFooter />
    </div>
  )
}
