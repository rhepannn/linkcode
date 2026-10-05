'use client'

// Judul halaman admin + slot aksi di kanan (membungkus ke bawah di layar sempit).
export default function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 md:mb-6">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-neutral-500">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
