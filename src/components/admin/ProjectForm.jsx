import { useState } from 'react'
import { X } from 'lucide-react'
import { STATUS_ORDER, STATUS_CONFIG } from '../../utils/statusConfig.js'
import { toDateInput } from '../../utils/trackingConfig.js'

function blank() {
  return {
    name: '',
    icon: '🚀',
    description: '',
    status: 'active',
    percentage: 0,
    client: '',
    startDate: '',
    targetDate: '',
    stagingUrl: '',
    liveUrl: '',
    repoUrl: '',
  }
}

function fromProject(p) {
  return {
    name: p.name,
    icon: p.icon,
    description: p.description,
    status: p.status,
    percentage: p.percentage,
    client: p.client || '',
    startDate: toDateInput(p.startDate),
    targetDate: toDateInput(p.targetDate),
    stagingUrl: p.stagingUrl || '',
    liveUrl: p.liveUrl || '',
    repoUrl: p.repoUrl || '',
  }
}

// Modal tambah/edit info dasar project. Tim dan fitur dikelola di halaman detail project.
// `autoProgress`: progres dihitung otomatis dari fitur → slider manual dinonaktifkan.
export default function ProjectForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(() => (initial ? fromProject(initial) : blank()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = Boolean(initial)
  const autoProgress = Boolean(initial?.autoProgress)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        icon: form.icon.trim() || '🚀',
        description: form.description.trim(),
        status: form.status,
        percentage: Number(form.percentage) || 0,
        client: form.client.trim(),
        startDate: form.startDate || null,
        targetDate: form.targetDate || null,
        stagingUrl: form.stagingUrl.trim(),
        liveUrl: form.liveUrl.trim(),
        repoUrl: form.repoUrl.trim(),
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan project.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-neutral-900/40 px-3 py-4 sm:px-4 sm:py-8">
      <div role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit project' : 'Tambah project'} className="a-card w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900">{isEdit ? 'Edit info project' : 'Tambah project'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_5rem]">
            <div>
              <label className="a-label" htmlFor="pf-name">Nama project</label>
              <input id="pf-name" required value={form.name} onChange={(e) => set('name', e.target.value)} className="a-input" />
            </div>
            <div>
              <label className="a-label" htmlFor="pf-icon">Emoji</label>
              <input id="pf-icon" value={form.icon} onChange={(e) => set('icon', e.target.value)} className="a-input text-center text-lg" />
            </div>
          </div>

          <div>
            <label className="a-label" htmlFor="pf-desc">Deskripsi</label>
            <textarea id="pf-desc" required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="a-input resize-none" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="a-label" htmlFor="pf-status">Status</label>
              <select id="pf-status" value={form.status} onChange={(e) => set('status', e.target.value)} className="a-input">
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="a-label" htmlFor="pf-client">Klien</label>
              <input id="pf-client" value={form.client} onChange={(e) => set('client', e.target.value)} className="a-input" placeholder="Nama klien / divisi" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="a-label" htmlFor="pf-start">Tanggal mulai</label>
              <input id="pf-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="a-input" />
            </div>
            <div>
              <label className="a-label" htmlFor="pf-target">Target selesai</label>
              <input id="pf-target" type="date" value={form.targetDate} min={form.startDate || undefined} onChange={(e) => set('targetDate', e.target.value)} className="a-input" />
            </div>
          </div>

          <div>
            <label className="a-label" htmlFor="pf-progress">
              Progres: {form.percentage}%{' '}
              {autoProgress && <span className="font-normal text-neutral-500">— dihitung otomatis dari fitur</span>}
            </label>
            <input
              id="pf-progress"
              type="range"
              min={0}
              max={100}
              value={form.percentage}
              disabled={autoProgress}
              onChange={(e) => set('percentage', e.target.value)}
              className="w-full accent-olive disabled:opacity-40"
            />
            {!autoProgress && (
              <p className="text-xs text-neutral-500">Berlaku sampai project punya fitur; setelah itu progres dihitung otomatis.</p>
            )}
          </div>

          <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
            <legend className="px-1 text-xs font-medium text-neutral-600">Tautan (opsional)</legend>
            {[
              ['stagingUrl', 'Staging', 'https://staging.contoh.com'],
              ['liveUrl', 'Live', 'https://contoh.com'],
              ['repoUrl', 'Repositori', 'https://github.com/org/repo'],
            ].map(([key, label, ph]) => (
              <div key={key}>
                <label className="a-label" htmlFor={`pf-${key}`}>{label}</label>
                <input id={`pf-${key}`} type="url" value={form[key]} onChange={(e) => set(key, e.target.value)} className="a-input" placeholder={ph} />
              </div>
            ))}
          </fieldset>

          {!isEdit && (
            <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              Setelah dibuat, tambahkan fitur, tim, dan PIC dari halaman detail project.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <button type="button" onClick={onClose} className="a-btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="a-btn-primary">
              {saving ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Buat project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
