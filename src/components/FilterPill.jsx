// Pill filter status. Aktif: brand-blue + teks putih.
// Tidak aktif: putih, border light-blue, teks brand-blue.
export default function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-2 px-4 py-2 font-pixel text-[10px] uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
        active
          ? 'border-navy bg-brand-blue text-white shadow-[3px_3px_0_0_#0D2B4E]'
          : 'border-light-blue bg-white text-brand-blue shadow-[3px_3px_0_0_#A8C8EE] hover:bg-off-white'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`px-1.5 py-0.5 text-[10px] ${
            active ? 'bg-white/20 text-white' : 'bg-light-blue/40 text-brand-blue'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
