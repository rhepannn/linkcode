import { useState } from 'react'
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react'
import { createBlocker, deleteBlocker, updateBlocker } from '../../../api/client.js'
import { SEVERITY, fmtDate } from '../../../utils/trackingConfig.js'

function SeverityBadge({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.medium
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

// Kendala / risiko: yang terbuka di atas, yang teratasi di bawah.
export default function BlockersTab({ project, act }) {
  const [form, setForm] = useState({ title: '', detail: '', severity: 'medium' })
  const [busy, setBusy] = useState(false)

  const open = project.blockers.filter((b) => b.status === 'open')
  const resolved = project.blockers.filter((b) => b.status === 'resolved')

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setBusy(true)
    await act(() => createBlocker(project.id, { ...form, title: form.title.trim() }))
    setForm({ title: '', detail: '', severity: 'medium' })
    setBusy(false)
  }

  const Item = ({ b }) => (
    <li className={`a-card p-4 ${b.status === 'resolved' ? 'bg-neutral-50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium ${b.status === 'resolved' ? 'text-neutral-500 line-through' : 'text-neutral-900'}`}>
              {b.title}
            </p>
            <SeverityBadge severity={b.severity} />
          </div>
          {b.detail && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{b.detail}</p>}
          <p className="mt-2 text-xs text-neutral-500">
            Dicatat {fmtDate(b.createdAt)}
            {b.resolvedAt && ` · teratasi ${fmtDate(b.resolvedAt)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {b.status === 'open' ? (
            <button
              type="button"
              onClick={() => act(() => updateBlocker(b.id, { status: 'resolved' }))}
              className="inline-flex min-h-[2.25rem] items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:border-olive hover:text-olive-dark lg:min-h-0"
            >
              <CheckCircle2 size={13} /> Tandai teratasi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => act(() => updateBlocker(b.id, { status: 'open' }))}
              className="inline-flex min-h-[2.25rem] items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 lg:min-h-0"
            >
              <RotateCcw size={13} /> Buka lagi
            </button>
          )}
          <button
            type="button"
            onClick={() => act(() => deleteBlocker(b.id))}
            className="rounded p-2.5 text-neutral-400 hover:bg-red-50 hover:text-clay lg:p-1.5"
            aria-label={`Hapus kendala ${b.title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </li>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section aria-label="Kendala terbuka">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">Terbuka ({open.length})</h3>
          {open.length === 0 ? (
            <p className="a-card py-8 text-center text-sm text-neutral-500">Tidak ada kendala terbuka.</p>
          ) : (
            <ul className="space-y-3">{open.map((b) => <Item key={b.id} b={b} />)}</ul>
          )}
        </section>

        {resolved.length > 0 && (
          <section aria-label="Kendala teratasi">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Teratasi ({resolved.length})</h3>
            <ul className="space-y-3">{resolved.map((b) => <Item key={b.id} b={b} />)}</ul>
          </section>
        )}
      </div>

      <form onSubmit={submit} className="a-card h-fit space-y-3 p-4 lg:sticky lg:top-6">
        <h3 className="text-sm font-semibold text-neutral-900">Catat kendala</h3>
        <div>
          <label className="a-label" htmlFor="bl-title">Judul</label>
          <input id="bl-title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="a-input" />
        </div>
        <div>
          <label className="a-label" htmlFor="bl-detail">Detail (opsional)</label>
          <textarea id="bl-detail" rows={3} value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} className="a-input resize-none" />
        </div>
        <div>
          <label className="a-label" htmlFor="bl-sev">Tingkat keparahan</label>
          <select id="bl-sev" value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="a-input">
            {Object.entries(SEVERITY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">Kendala tingkat Tinggi yang masih terbuka menandai project sebagai At risk.</p>
        </div>
        <button type="submit" disabled={busy || !form.title.trim()} className="a-btn-primary w-full">
          Simpan kendala
        </button>
      </form>
    </div>
  )
}
