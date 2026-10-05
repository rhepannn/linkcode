// Kartu statistik ringkas untuk dashboard admin.
export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="a-card p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-snug text-neutral-500 md:text-sm">{label}</p>
        {Icon && <Icon size={18} className="shrink-0 text-neutral-400" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 md:mt-3 md:text-3xl">{value}</p>
    </div>
  )
}
