// Progress bar tipis dengan warna mengikuti status.
export default function ProgressBar({ percentage = 0, color = '#5C6E21' }) {
  const safe = Math.max(0, Math.min(100, percentage))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-light/70">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${safe}%`, backgroundColor: color }}
      />
    </div>
  )
}
