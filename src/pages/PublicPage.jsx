import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import FilterPill from '../components/FilterPill.jsx'
import Reveal from '../components/Reveal.jsx'
import { ArrowDown, MessageCircle } from 'lucide-react'
import { getProjects, getSettings } from '../api/client.js'
import { MOCK_PROJECTS } from '../data/projects.js'
import { STATUS_ORDER, STATUS_CONFIG } from '../utils/statusConfig.js'

// Fallback kalau API settings belum tersedia.
const FALLBACK_WA = import.meta.env.VITE_WHATSAPP_NUMBER || '628123456789'

const HIGHLIGHTS = [
  {
    no: '01',
    title: 'Transparan',
    text: 'Progress project ditampilkan apa adanya, real-time.',
  },
  {
    no: '02',
    title: 'Terstruktur',
    text: 'Setiap project punya PIC yang jelas dan bertanggung jawab.',
  },
  {
    no: '03',
    title: 'Aktif',
    text: 'Bukan portofolio lama — ini yang sedang berjalan sekarang.',
  },
]

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* cahaya lembut di latar */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-olive/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-64 h-80 w-80 rounded-full bg-sand/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <Reveal>
          <p className="eyebrow">Software Development Studio</p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
            Tim developer yang bekerja nyata,{' '}
            <span className="italic text-olive">progress yang bisa kamu pantau.</span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft">
            Kami tidak hanya menjanjikan — kami menunjukkan. Setiap project yang sedang dikerjakan
            bisa kamu lihat langsung di sini.
          </p>
        </Reveal>

        <Reveal delay={300} className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#project" className="btn-solid">
            Lihat project
            <ArrowDown size={16} />
          </a>
          <a href="#kontak" className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Diskusi project
          </a>
        </Reveal>

        <div className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-sand-light bg-sand-light sm:grid-cols-3">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={i * 100} className="bg-paper p-7">
              <span className="font-mono text-xs text-sand">{h.no}</span>
              <h3 className="mt-6 font-display text-3xl font-medium">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{h.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA({ waNumber }) {
  const waLink = `https://wa.me/${waNumber || FALLBACK_WA}`
  return (
    <section id="kontak" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <Reveal className="rounded-3xl border border-sand-light bg-gradient-to-br from-paper to-sand-light/60 px-6 py-16 text-center sm:px-12 sm:py-24">
        <p className="eyebrow">Tertarik bekerja sama?</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
          Mari diskusikan <span className="italic text-olive">project</span> kamu
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-ink-soft">
          Ceritakan kebutuhan bisnis kamu, kami bantu carikan solusi yang tepat.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-solid mt-9"
        >
          <MessageCircle size={16} />
          Chat di WhatsApp
        </a>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-sand-light">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:px-8">
        <p className="font-display text-xl font-semibold text-ink">
          Link<span className="italic text-olive">Code</span>
        </p>
        <p>© {new Date().getFullYear()} LinkCode. Software Development Studio.</p>
      </div>
    </footer>
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
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />

      <section id="project" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24 sm:px-8">
        <Reveal className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">{activeCount} project aktif saat ini</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Project yang <span className="italic text-olive">sedang dikerjakan</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </Reveal>

        {loading ? (
          <p className="py-16 text-center text-ink-soft">Memuat project…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">Belum ada project pada kategori ini.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.id ?? p.name} delay={(i % 3) * 80} className="h-full">
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <CTA waNumber={waNumber} />
      <Footer />
    </div>
  )
}
