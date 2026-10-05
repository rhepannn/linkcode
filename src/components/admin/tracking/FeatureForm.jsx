'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createSubtask, deleteSubtask, updateSubtask } from '../../../api/client.js'
import { FEATURE_COLUMNS, FEATURE_STATUS, toDateInput } from '../../../utils/trackingConfig.js'

// Modal tambah/edit fitur.
// - Mode tambah: sub-tugas awal diisi satu per baris.
// - Mode edit: sub-tugas langsung disimpan per aksi (tambah/centang/ubah/hapus) dan dibaca dari `feature`
//   (yang selalu diambil dari data project terbaru), sehingga tetap sinkron setelah reload.
export default function FeatureForm({ feature, defaultStatus = 'next', members, onSave, onDelete, onSubtaskChange, onClose }) {
  const isEdit = Boolean(feature)
  const [form, setForm] = useState({
    title: feature?.title ?? '',
    description: feature?.description ?? '',
    status: feature?.status ?? defaultStatus,
    assigneeId: feature?.assigneeId ?? '',
    dueDate: toDateInput(feature?.dueDate),
    newSubtasks: '',
  })
  const [newSub, setNewSub] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Status bisa berubah dari server saat sub-tugas dicentang; ikuti agar select tidak kedaluwarsa.
  useEffect(() => {
    if (feature?.status) setForm((f) => ({ ...f, status: feature.status }))
  }, [feature?.status])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        assigneeId: form.assigneeId === '' ? null : Number(form.assigneeId),
        dueDate: form.dueDate || null,
      }
      if (!isEdit) {
        payload.subtasks = form.newSubtasks.split('\n').map((l) => l.trim()).filter(Boolean)
      }
      await onSave(payload)
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan fitur.')
      setSaving(false)
    }
  }

  // Aksi sub-tugas (mode edit): jalankan lalu minta induk memuat ulang.
  const subAction = async (fn) => {
    setError('')
    try {
      await fn()
      await onSubtaskChange()
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memperbarui sub-tugas.')
    }
  }

  const addSub = async () => {
    const title = newSub.trim()
    if (!title) return
    setNewSub('')
    await subAction(() => createSubtask(feature.id, title))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-neutral-900/40 px-3 py-4 sm:px-4 sm:py-8">
      <div role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit fitur' : 'Tambah fitur'} className="a-card w-full max-w-xl shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900">{isEdit ? 'Edit fitur' : 'Tambah fitur'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <label className="a-label" htmlFor="ft-title">Judul fitur</label>
            <input id="ft-title" required autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} className="a-input" />
          </div>
          <div>
            <label className="a-label" htmlFor="ft-desc">Deskripsi (opsional)</label>
            <textarea id="ft-desc" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className="a-input resize-none" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="a-label" htmlFor="ft-status">Status</label>
              <select id="ft-status" value={form.status} onChange={(e) => set('status', e.target.value)} className="a-input">
                {FEATURE_COLUMNS.map((s) => (
                  <option key={s} value={s}>{FEATURE_STATUS[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="a-label" htmlFor="ft-assignee">Penanggung jawab</label>
              <select id="ft-assignee" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} className="a-input">
                <option value="">— Belum ditugaskan</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="a-label" htmlFor="ft-due">Tenggat</label>
              <input id="ft-due" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="a-input" />
            </div>
          </div>

          {isEdit ? (
            <div>
              <p className="a-label">Sub-tugas</p>
              <p className="mb-2 text-xs text-neutral-500">
                Progres fitur dihitung dari sub-tugas yang selesai. Status otomatis mengikuti: semua selesai → Selesai.
              </p>
              <ul className="space-y-1.5">
                {feature.subtasks.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={(e) => subAction(() => updateSubtask(s.id, { done: e.target.checked }))}
                      className="h-4 w-4 accent-olive"
                      aria-label={`Selesai: ${s.title}`}
                    />
                    <input
                      defaultValue={s.title}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v && v !== s.title) subAction(() => updateSubtask(s.id, { title: v }))
                        else e.target.value = s.title
                      }}
                      className={`a-input py-1.5 ${s.done ? 'text-neutral-400 line-through' : ''}`}
                      aria-label="Judul sub-tugas"
                    />
                    <button
                      type="button"
                      onClick={() => subAction(() => deleteSubtask(s.id))}
                      className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-clay"
                      aria-label={`Hapus sub-tugas ${s.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSub()
                    }
                  }}
                  placeholder="Tambah sub-tugas, tekan Enter"
                  className="a-input"
                />
                <button type="button" onClick={addSub} className="a-btn-secondary shrink-0">
                  <Plus size={15} /> Tambah
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="a-label" htmlFor="ft-subs">Sub-tugas awal (opsional, satu per baris)</label>
              <textarea id="ft-subs" rows={3} value={form.newSubtasks} onChange={(e) => set('newSubtasks', e.target.value)} className="a-input resize-none" placeholder={'Rancang tampilan\nBuat API\nUji coba'} />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
            {isEdit ? (
              <button type="button" onClick={onDelete} className="a-btn-secondary text-clay hover:bg-red-50">
                <Trash2 size={15} /> Hapus fitur
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="a-btn-secondary">Batal</button>
              <button type="submit" disabled={saving} className="a-btn-primary">
                {saving ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
