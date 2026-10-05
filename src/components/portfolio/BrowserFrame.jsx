import { hostnameOf } from '../../utils/sectorConfig.js'

// Bingkai jendela browser: tiga titik + bar alamat. `children` = isi halaman.
export default function BrowserFrame({ url, className = '', children }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-sand-light bg-paper shadow-soft ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-sand-light bg-cream/70 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-sand-light" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-light" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-light" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md bg-paper px-3 py-0.5 text-center font-mono text-[11px] text-ink-soft">
          {hostnameOf(url)}
        </div>
        <span className="w-10 shrink-0" aria-hidden="true" />
      </div>
      {children}
    </div>
  )
}
