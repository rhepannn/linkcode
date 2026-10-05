import ProgressBar from './ProgressBar.jsx'
import Avatar from './Avatar.jsx'
import StatusBadge from './StatusBadge.jsx'
import { getStatusConfig } from '../utils/statusConfig.js'

// Tumpukan avatar PIC dengan sedikit overlap + jumlah orang.
function PICStack({ pics = [] }) {
  const shown = pics.slice(0, 4)
  const extra = pics.length - shown.length
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {shown.map((pic) => (
          <Avatar key={pic.id ?? pic.name} name={pic.name} size={28} />
        ))}
        {extra > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-light text-[10px] font-medium text-ink ring-2 ring-paper">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs text-ink-soft">{pics.length} orang</span>
    </div>
  )
}

// Kartu project untuk halaman publik.
export default function ProjectCard({ project }) {
  const cfg = getStatusConfig(project.status)
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-sand-light bg-paper p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream text-2xl">
          {project.icon}
        </span>
        <StatusBadge status={project.status} />
      </div>

      <h3 className="mt-6 font-display text-2xl font-medium leading-tight">{project.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {project.description}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
            Progress
          </span>
          <span className="font-mono text-xs">{project.percentage}%</span>
        </div>
        <ProgressBar percentage={project.percentage} color={cfg.barColor} />
      </div>

      <div className="mt-6 border-t border-sand-light pt-4">
        <PICStack pics={project.pics} />
      </div>
    </article>
  )
}
