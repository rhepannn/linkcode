import { useState } from 'react'
import { STATUS_ORDER, STATUS_CONFIG } from '../utils/statusConfig.js'

const PIC_COLORS = ['#1E5FA8', '#4A90D9', '#0D2B4E', '#A8C8EE', '#2E7D32', '#F9A825']

const emptyPIC = () => ({ name: '', role: '', contribution: 0, avatarColor: PIC_COLORS[0] })

function blankProject() {
  return {
    name: '',
    description: '',
    icon: '🚀',
    status: 'active',
    percentage: 0,
    pics: [emptyPIC()],
  }
}

// Modal form tambah/edit project. `initial` = project untuk mode edit.
export default function ProjectForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...initial,
          pics: initial.pics?.length ? initial.pics.map((p) => ({ ...p })) : [emptyPIC()],
        }
      : blankProject(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = Boolean(initial)

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const setPIC = (index, key, value) =>
    setForm((f) => ({
      ...f,
      pics: f.pics.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    }))

  const addPIC = () => setForm((f) => ({ ...f, pics: [...f.pics, emptyPIC()] }))
  const removePIC = (index) =>
    setForm((f) => ({ ...f, pics: f.pics.filter((_, i) => i !== index) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon.trim() || '🚀',
        status: form.status,
        percentage: Number(form.percentage) || 0,
        pics: form.pics
          .filter((p) => p.name.trim())
          .map((p) => ({
            ...(p.id ? { id: p.id } : {}),
            name: p.name.trim(),
            role: p.role.trim(),
            contribution: Number(p.contribution) || 0,
            avatarColor: p.avatarColor,
          })),
      }
      await onSubmit(payload)
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan project.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/60 px-4 py-8">
      <div className="w-full max-w-2xl border-2 border-navy bg-white shadow-lg">
        <div className="flex items-center justify-between border-b-2 border-light-blue bg-off-white px-6 py-4">
          <h2 className="font-pixel text-xs uppercase text-navy">
            {isEdit ? '✎ Edit Project' : '+ Tambah Project'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-navy/40 hover:text-navy"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block font-pixel text-[9px] uppercase text-navy">Nama Project</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full border-2 border-light-blue bg-off-white px-3 py-2.5 text-sm outline-none focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/30"
              />
            </div>
            <div>
              <label className="mb-1 block font-pixel text-[9px] uppercase text-navy">Emoji</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setField('icon', e.target.value)}
                className="w-20 border-2 border-light-blue bg-off-white px-3 py-2.5 text-center text-lg outline-none focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-pixel text-[9px] uppercase text-navy">Deskripsi</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full resize-none border-2 border-light-blue bg-off-white px-3 py-2.5 text-sm outline-none focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/30"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-pixel text-[9px] uppercase text-navy">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full border-2 border-light-blue bg-off-white px-3 py-2.5 text-sm outline-none focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/30"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-pixel text-[9px] uppercase text-navy">
                Progress: <span className="text-brand-blue">{form.percentage}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.percentage}
                onChange={(e) => setField('percentage', e.target.value)}
                className="w-full accent-sky-blue"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-pixel text-[9px] uppercase text-navy">PIC / Tim</label>
              <button
                type="button"
                onClick={addPIC}
                className="font-pixel text-[9px] uppercase text-sky-blue hover:underline"
              >
                + PIC
              </button>
            </div>

            <div className="space-y-3">
              {form.pics.map((pic, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-light-blue/60 bg-off-white p-3"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Nama"
                      value={pic.name}
                      onChange={(e) => setPIC(i, 'name', e.target.value)}
                      className="border-2 border-light-blue bg-white px-3 py-2 text-sm outline-none focus:border-sky-blue"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={pic.role}
                      onChange={(e) => setPIC(i, 'role', e.target.value)}
                      className="border-2 border-light-blue bg-white px-3 py-2 text-sm outline-none focus:border-sky-blue"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-xs text-navy/60">Kontribusi</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pic.contribution}
                      onChange={(e) => setPIC(i, 'contribution', e.target.value)}
                      className="w-20 border-2 border-light-blue bg-white px-2 py-1.5 text-sm outline-none focus:border-sky-blue"
                    />
                    <span className="text-xs text-navy/60">%</span>

                    <div className="ml-auto flex items-center gap-1.5">
                      {PIC_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPIC(i, 'avatarColor', c)}
                          className={`h-5 w-5 rounded-full ${
                            pic.avatarColor === c ? 'ring-2 ring-offset-1 ring-navy' : ''
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Warna ${c}`}
                        />
                      ))}
                    </div>

                    {form.pics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePIC(i)}
                        className="ml-2 text-sm text-red-500 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 border-t-2 border-light-blue pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-pixel border-navy px-4 py-3 text-navy hover:bg-off-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-pixel border-navy bg-sky-blue px-5 py-3 text-white shadow hover:bg-sky-blue/90 active:shadow-none disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
