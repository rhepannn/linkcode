'use client'

import { useMemo, useState } from 'react'
import ProjectCard from '../ProjectCard.jsx'
import FilterPill from '../FilterPill.jsx'
import Reveal from '../Reveal.jsx'
import { STATUS_ORDER, STATUS_CONFIG } from '../../utils/statusConfig.js'

// Bagian "Project yang sedang dikerjakan". Data dari server; filter status di sisi klien.
export default function ProjectsSection({ projects = [] }) {
  const [filter, setFilter] = useState('all')

  const counts = useMemo(() => {
    const c = { all: projects.length }
    for (const s of STATUS_ORDER) c[s] = projects.filter((p) => p.status === s).length
    return c
  }, [projects])

  const filtered = useMemo(
    () => (filter === 'all' ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  )

  return (
    <section id="project" aria-labelledby="project-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24 sm:px-8">
      <Reveal className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{counts.active || 0} project aktif saat ini</p>
          <h2 id="project-title" className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Project yang <span className="italic text-olive">sedang dikerjakan</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterPill label="Semua" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
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

      {projects.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">Belum ada project yang ditampilkan.</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">Belum ada project pada kategori ini.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80} className="h-full">
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
