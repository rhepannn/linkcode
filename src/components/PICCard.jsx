import ProgressBar from './ProgressBar.jsx'

// Inisial dari nama, mis. "Andi Wijaya" -> "AW".
export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

// Avatar circle dengan inisial, warna dari data.
export function Avatar({ name, color = '#1E5FA8', size = 28, ring = true }) {
  return (
    <div
      title={name}
      className={`flex items-center justify-center rounded-full text-white font-semibold ${
        ring ? 'ring-2 ring-white' : ''
      }`}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

// Kartu detail PIC: avatar, nama, role, dan kontribusi.
export default function PICCard({ pic }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-light-blue/50 bg-off-white px-3 py-2.5">
      <Avatar name={pic.name} color={pic.avatarColor} size={36} ring={false} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-navy">{pic.name}</p>
          <span className="text-xs font-semibold text-brand-blue">{pic.contribution}%</span>
        </div>
        <p className="truncate text-xs text-navy/50">{pic.role}</p>
        <div className="mt-1.5">
          <ProgressBar percentage={pic.contribution} color={pic.avatarColor} />
        </div>
      </div>
    </div>
  )
}
