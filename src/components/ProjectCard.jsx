import ProgressBar from './ProgressBar.jsx'
import { Avatar } from './PICCard.jsx'
import { getStatusConfig } from '../utils/statusConfig.js'

// Badge status dengan warna dari statusConfig.
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status)
  return (
    <span
      className="border-2 px-2 py-1 font-pixel text-[8px] uppercase tracking-wider"
      style={{ backgroundColor: cfg.bgColor, color: cfg.textColor, borderColor: cfg.textColor }}
    >
      {cfg.label}
    </span>
  )
}

// Tumpukan avatar PIC dengan sedikit overlap + jumlah orang.
function PICStack({ pics = [] }) {
  const shown = pics.slice(0, 4)
  const extra = pics.length - shown.length
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((pic) => (
          <Avatar key={pic.id ?? pic.name} name={pic.name} color={pic.avatarColor} size={28} />
        ))}
        {extra > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-light-blue text-[10px] font-semibold text-navy ring-2 ring-white">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs text-navy/50">
        {pics.length} orang
      </span>
    </div>
  )
}

// Kartu project untuk halaman publik & admin.
// `actions` (opsional) dirender di pojok bawah untuk tombol Edit/Delete admin.
export default function ProjectCard({ project, actions = null }) {
  const cfg = getStatusConfig(project.status)
  return (
    <div className="flex h-full flex-col border-2 border-navy bg-white p-5 shadow transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:border-neon-pink hover:shadow-[6px_6px_0_0_#FF4D9D]">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center border-2 border-light-blue bg-off-white text-2xl">
          {project.icon}
        </span>
        <StatusBadge status={project.status} />
      </div>

      <h3 className="mt-4 text-xl leading-tight text-navy">{project.name}</h3>
      <p className="mt-1 text-base leading-snug text-navy/60 line-clamp-2">{project.description}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-pixel text-[9px] uppercase tracking-wide text-navy/60">Progress</span>
          <span className="font-pixel text-[11px] text-brand-blue">{project.percentage}%</span>
        </div>
        <ProgressBar percentage={project.percentage} color={cfg.barColor} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <PICStack pics={project.pics} />
      </div>

      {actions && <div className="mt-4 border-t border-light-blue/50 pt-3">{actions}</div>}
    </div>
  )
}
