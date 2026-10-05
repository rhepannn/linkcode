import { getStatusConfig } from '../utils/statusConfig.js'

// Badge status dengan warna dari statusConfig. Dipakai di halaman publik & admin.
export default function StatusBadge({ status }) {
  const cfg = getStatusConfig(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
      style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.barColor }} />
      {cfg.label}
    </span>
  )
}
