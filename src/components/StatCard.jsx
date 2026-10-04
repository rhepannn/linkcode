// Kartu statistik ringkas untuk dashboard admin.
export default function StatCard({ label, value, icon, accent = '#4A90D9' }) {
  return (
    <div className="border-2 border-navy bg-white p-5 shadow">
      <div className="flex items-center justify-between">
        <p className="font-pixel text-[9px] uppercase leading-relaxed tracking-wide text-navy/60">
          {label}
        </p>
        {icon && (
          <span
            className="flex h-9 w-9 items-center justify-center border-2 text-lg"
            style={{ backgroundColor: `${accent}1A`, borderColor: accent }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-pixel text-2xl text-navy" style={{ color: accent }}>
        {value}
      </p>
    </div>
  )
}
