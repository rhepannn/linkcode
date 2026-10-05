'use client'

// Pill filter status.
export default function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? 'border-ink bg-ink text-paper'
          : 'border-sand-light bg-paper text-ink-soft hover:border-sand hover:text-ink'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`font-mono text-[11px] ${active ? 'text-sand' : 'text-ink-soft/70'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
