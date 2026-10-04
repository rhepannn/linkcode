// Progress bar tipis (5px) dengan warna mengikuti status.
export default function ProgressBar({ percentage = 0, color = '#4A90D9' }) {
  const safe = Math.max(0, Math.min(100, percentage))
  return (
    <div className="h-2.5 w-full overflow-hidden border-2 border-navy bg-light-blue/30">
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{ width: `${safe}%`, backgroundColor: color }}
      />
    </div>
  )
}
