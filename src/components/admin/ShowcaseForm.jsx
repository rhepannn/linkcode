import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { SECTORS, SECTOR_ORDER } from '../../utils/sectorConfig.js'
import { slugify } from '../../utils/slugify.js'
import Switch from './Switch.jsx'
import MediaField from './MediaField.jsx'
import { deleteUpload } from '../../api/client.js'

function blank(nextOrder) {
  return {
    title: '',
    slug: '',
    url: 'https://',
    sector: 'platform',
    description: '',
    year: '',
    techStack: '',
    thumbnailUrl: '',
    previewUrl: '',
    videoUrl: '',
    featured: false,
    embeddable: false,
    published: true,
    sortOrder: nextOrder,
  }
}

function fromItem(item) {
  return {
    ...item,
    year: item.year ?? '',
    techStack: (item.techStack || []).join(', '),
    thumbnailUrl: item.thumbnailUrl || '',
    previewUrl: item.previewUrl || '',
    videoUrl: item.videoUrl || '',
  }
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        <p className="text-xs text-neutral-500">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

// Modal form tambah/edit karya portofolio. `initial` = karya untuk mode edit.
export default function ShowcaseForm({ initial, nextOrder = 0, onSubmit, onClose }) {
  const [form, setForm] = useState(() => (initial ? fromItem(initial) : blank(nextOrder)))
  // Slug mengikuti judul sampai pengguna mengubahnya sendiri (hanya saat membuat baru).
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // URL hasil unggah selama form terbuka; yang akhirnya tidak dipakai dibuang dari Storage.
  const uploaded = useRef(new Set())

  const isEdit = Boolean(initial)
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const setTitle = (title) =>
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))

  // Buang unggahan sesi ini yang tidak termasuk `keep` (best-effort; server menolak bila masih dipakai karya).
  const discardUnused = (keep = []) => {
    for (const url of uploaded.current) {
      if (!keep.includes(url)) deleteUpload(url).catch(() => {})
    }
    uploaded.current.clear()
  }

  const handleClose = () => {
    discardUnused() // ditutup tanpa menyimpan: semua unggahan sesi ini yatim
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        url: form.url.trim(),
        sector: form.sector,
        description: form.description.trim(),
        year: form.year === '' ? null : Number(form.year),
        techStack: form.techStack
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        thumbnailUrl: form.thumbnailUrl.trim(),
        previewUrl: form.previewUrl.trim(),
        videoUrl: form.videoUrl.trim(),
        featured: form.featured,
        embeddable: form.embeddable,
        published: form.published,
        sortOrder: Number(form.sortOrder) || 0,
      }
      await onSubmit(payload)
      discardUnused([payload.thumbnailUrl, payload.previewUrl, payload.videoUrl])
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal menyimpan karya.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-neutral-900/40 px-3 py-4 sm:px-4 sm:py-8">
      <div className="a-card w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? 'Edit karya' : 'Tambah karya'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="a-label" htmlFor="sc-title">Judul</label>
              <input id="sc-title" type="text" required value={form.title} onChange={(e) => setTitle(e.target.value)} className="a-input" />
            </div>
            <div>
              <label className="a-label" htmlFor="sc-slug">Slug</label>
              <input
                id="sc-slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value)
                }}
                className="a-input font-mono"
                placeholder="otomatis dari judul"
              />
            </div>
          </div>

          <div>
            <label className="a-label" htmlFor="sc-url">URL website</label>
            <input id="sc-url" type="url" required value={form.url} onChange={(e) => set('url', e.target.value)} className="a-input" placeholder="https://contoh.com" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_7rem]">
            <div>
              <label className="a-label" htmlFor="sc-sector">Sektor</label>
              <select id="sc-sector" value={form.sector} onChange={(e) => set('sector', e.target.value)} className="a-input">
                {SECTOR_ORDER.map((s) => (
                  <option key={s} value={s}>{SECTORS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="a-label" htmlFor="sc-year">Tahun</label>
              <input id="sc-year" type="number" min={2000} max={2100} value={form.year} onChange={(e) => set('year', e.target.value)} className="a-input" placeholder="2026" />
            </div>
          </div>

          <div>
            <label className="a-label" htmlFor="sc-desc">Deskripsi</label>
            <textarea id="sc-desc" required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="a-input resize-none" />
          </div>

          <div>
            <label className="a-label" htmlFor="sc-tech">Tech stack</label>
            <input id="sc-tech" type="text" value={form.techStack} onChange={(e) => set('techStack', e.target.value)} className="a-input" placeholder="React, Node.js, PostgreSQL (pisahkan dengan koma)" />
          </div>

          <fieldset className="space-y-4 rounded-lg border border-neutral-200 p-4">
            <legend className="px-1 text-xs font-medium text-neutral-600">Media pratinjau</legend>
            <p className="text-xs text-neutral-500">
              Unggah langsung ke penyimpanan, atau isi URL/path secara manual. Bisa juga dibuat otomatis oleh{' '}
              <span className="font-mono">npm run capture</span> di folder backend.
            </p>
            {[
              ['thumbnailUrl', 'thumbnail', 'Thumbnail', '/showcases/slug-thumb.jpg'],
              ['previewUrl', 'preview', 'Screenshot halaman penuh', '/showcases/slug.jpg'],
              ['videoUrl', 'video', 'Video rekaman scroll', '/showcases/slug.webm'],
            ].map(([key, kind, label, ph]) => (
              <MediaField
                key={key}
                id={`sc-${key}`}
                kind={kind}
                label={label}
                placeholder={ph}
                value={form[key]}
                onChange={(v) => set(key, v)}
                slug={form.slug.trim() || slugify(form.title)}
                onUploaded={(url) => uploaded.current.add(url)}
              />
            ))}
          </fieldset>

          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 px-4">
            <Toggle label="Tayang di situs" hint="Jika mati, karya disembunyikan dari halaman publik." checked={form.published} onChange={(v) => set('published', v)} />
            <Toggle label="Karya unggulan" hint="Ditampilkan besar di bagian atas portofolio." checked={form.featured} onChange={(v) => set('featured', v)} />
            <Toggle label="Boleh di-iframe" hint="Nyalakan hanya jika situs mengizinkan; jika tidak, pratinjau memakai video." checked={form.embeddable} onChange={(v) => set('embeddable', v)} />
          </div>

          <div className="w-32">
            <label className="a-label" htmlFor="sc-order">Urutan</label>
            <input id="sc-order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className="a-input" />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <button type="button" onClick={handleClose} className="a-btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={saving} className="a-btn-primary">
              {saving ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
