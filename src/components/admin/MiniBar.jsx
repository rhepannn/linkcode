// Bar progres kecil untuk tabel/kartu admin.
export default function MiniBar({ value = 0, color = '#5C6E21', className = '' }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-neutral-200 ${className}`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, backgroundColor: color }} />
    </div>
  )
}
