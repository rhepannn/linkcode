'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Avatar from '../Avatar.jsx'
import Switch from './Switch.jsx'

const SWATCHES = ['#5C6E21', '#8A7556', '#1E211D', '#A0522D', '#6B7F5E', '#7A6440', '#BD3D44', '#3F6C8A']

// Modal tambah/edit anggota tim global.
export default function MemberForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '',
    role: initial?.role ?? '',
    email: initial?.email ?? '',
    avatarColor: initial?.avatarColor ?? SWATCHES[0],
    active: initial?.active ?? true,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(initial)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({ ...form, name: form.name.trim(), role: form.role.trim(), email: form.email.trim() })
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan anggota.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-neutral-900/40 px-3 py-4 sm:px-4 sm:py-8">
      <div role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit anggota' : 'Tambah anggota'} className="a-card w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900">{isEdit ? 'Edit anggota' : 'Tambah anggota'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-4">
            <Avatar name={form.name || '?'} color={form.avatarColor} size={52} ring={false} />
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Warna avatar">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.avatarColor === c}
                  aria-label={`Warna ${c}`}
                  onClick={() => set('avatarColor', c)}
                  className={`h-6 w-6 rounded-full ${form.avatarColor === c ? 'ring-2 ring-neutral-900 ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="a-label" htmlFor="mb-name">Nama</label>
            <input id="mb-name" required autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className="a-input" />
          </div>
          <div>
            <label className="a-label" htmlFor="mb-role">Jabatan</label>
            <input id="mb-role" required value={form.role} onChange={(e) => set('role', e.target.value)} className="a-input" placeholder="mis. Frontend Dev" />
          </div>
          <div>
            <label className="a-label" htmlFor="mb-email">Email (opsional)</label>
            <input id="mb-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="a-input" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">Aktif</p>
              <p className="text-xs text-neutral-500">Anggota nonaktif tidak muncul sebagai pilihan baru.</p>
            </div>
            <Switch checked={form.active} onChange={(v) => set('active', v)} label="Aktif" />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <button type="button" onClick={onClose} className="a-btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="a-btn-primary">
              {saving ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
