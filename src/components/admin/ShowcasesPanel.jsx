'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import ShowcaseForm from './ShowcaseForm.jsx'
import Switch from './Switch.jsx'
import {
  getAllShowcases,
  createShowcase,
  updateShowcase,
  deleteShowcase,
} from '../../api/client.js'
import { SECTORS, SECTOR_ORDER, hostnameOf } from '../../utils/sectorConfig.js'

// Field yang dikirim ke API (membuang id/createdAt/updatedAt).
const toPayload = (w) => ({
  slug: w.slug,
  title: w.title,
  url: w.url,
  sector: w.sector,
  description: w.description,
  year: w.year,
  techStack: w.techStack,
  thumbnailUrl: w.thumbnailUrl,
  previewUrl: w.previewUrl,
  videoUrl: w.videoUrl,
  featured: w.featured,
  embeddable: w.embeddable,
  published: w.published,
  sortOrder: w.sortOrder,
})

const errMsg = (err, fallback) => err?.response?.data?.message || fallback

export default function ShowcasesPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const load = () => {
    setError('')
    return getAllShowcases()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat portofolio dari server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtering = query.trim() !== '' || sector !== 'all'
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (w) =>
        (sector === 'all' || w.sector === sector) &&
        (!q || w.title.toLowerCase().includes(q) || hostnameOf(w.url).includes(q)),
    )
  }, [items, query, sector])

  const nextOrder = items.length ? Math.max(...items.map((w) => w.sortOrder)) + 1 : 0

  const replaceItem = (updated) => setItems((list) => list.map((w) => (w.id === updated.id ? updated : w)))

  // Ubah satu flag langsung dari tabel.
  const toggle = async (work, field, value) => {
    setError('')
    const previous = work
    replaceItem({ ...work, [field]: value }) // optimistis
    try {
      replaceItem(await updateShowcase(work.id, { ...toPayload(work), [field]: value }))
    } catch (err) {
      replaceItem(previous)
      setError(errMsg(err, 'Gagal menyimpan perubahan.'))
    }
  }

  // Tukar posisi dengan tetangga, lalu rapikan urutan jadi 0..n-1 agar tidak ada nilai kembar.
  const move = async (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    const before = new Map(items.map((w) => [w.id, w.sortOrder]))
    const changed = next
      .map((w, i) => ({ ...w, sortOrder: i }))
      .filter((w) => w.sortOrder !== before.get(w.id))

    setBusy(true)
    setError('')
    try {
      await Promise.all(changed.map((w) => updateShowcase(w.id, toPayload(w))))
      await load()
    } catch (err) {
      setError(errMsg(err, 'Gagal mengubah urutan.'))
      await load()
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async (payload) => {
    if (editing) await updateShowcase(editing.id, payload)
    else await createShowcase(payload)
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  const handleDelete = async () => {
    setBusy(true)
    setDeleteError('')
    try {
      await deleteShowcase(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setDeleteError(errMsg(err, 'Gagal menghapus karya.'))
    } finally {
      setBusy(false)
    }
  }

  const hiddenCount = items.filter((w) => !w.published).length

  return (
    <div>
      <PageHeader
        title="Portofolio"
        sub={`${items.length} karya${hiddenCount ? ` · ${hiddenCount} disembunyikan` : ''}`}
      >
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="a-btn-primary"
        >
          <Plus size={16} /> Tambah karya
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul atau domain…"
            className="a-input pl-9"
            aria-label="Cari karya"
          />
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="a-input w-auto" aria-label="Filter sektor">
          <option value="all">Semua sektor</option>
          {SECTOR_ORDER.map((s) => (
            <option key={s} value={s}>{SECTORS[s]}</option>
          ))}
        </select>
        {filtering && <p className="text-xs text-neutral-500">Pengurutan dinonaktifkan saat filter aktif.</p>}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Memuat portofolio…</p>
      ) : shown.length === 0 ? (
        <p className="a-card py-12 text-center text-sm text-neutral-500">
          {items.length === 0 ? 'Belum ada karya. Klik “Tambah karya” untuk mulai.' : 'Tidak ada karya yang cocok.'}
        </p>
      ) : (
        <>
<div className="a-card hidden overflow-x-auto xl:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Karya</th>
                <th className="px-4 py-3 font-medium">Sektor</th>
                <th className="px-4 py-3 text-center font-medium">Tayang</th>
                <th className="px-4 py-3 text-center font-medium">Unggulan</th>
                <th className="px-4 py-3 text-center font-medium">Iframe</th>
                <th className="px-4 py-3 font-medium">Urutan</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {shown.map((w) => {
                const index = items.findIndex((x) => x.id === w.id)
                return (
                  <tr key={w.id} className={`hover:bg-neutral-50 ${w.published ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {w.thumbnailUrl ? (
                          <img src={w.thumbnailUrl} alt="" loading="lazy" className="h-10 w-16 shrink-0 rounded border border-neutral-200 object-cover object-top" />
                        ) : (
                          <div className="h-10 w-16 shrink-0 rounded border border-dashed border-neutral-300 bg-neutral-50" title="Belum ada thumbnail" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900">{w.title}</p>
                          <a href={w.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-olive hover:underline">
                            {hostnameOf(w.url)} <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{SECTORS[w.sector]}</td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={w.published} onChange={(v) => toggle(w, 'published', v)} label={`Tayang: ${w.title}`} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={w.featured} onChange={(v) => toggle(w, 'featured', v)} label={`Unggulan: ${w.title}`} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={w.embeddable} onChange={(v) => toggle(w, 'embeddable', v)} label={`Boleh di-iframe: ${w.title}`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={filtering || busy || index === 0}
                          className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label={`Naikkan ${w.title}`}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={filtering || busy || index === items.length - 1}
                          className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label={`Turunkan ${w.title}`}
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(w)
                            setFormOpen(true)
                          }}
                          className="rounded p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          aria-label={`Edit ${w.title}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('')
                            setDeleting(w)
                          }}
                          className="rounded p-2 text-neutral-500 hover:bg-red-50 hover:text-clay"
                          aria-label={`Hapus ${w.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
<ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:hidden">
  {shown.map((w) => {
    const index = items.findIndex((x) => x.id === w.id)
    return (
      <li key={w.id} className={`a-card p-4 ${w.published ? '' : 'opacity-70'}`}>
        <div className="flex items-start gap-3">
          {w.thumbnailUrl ? (
            <img src={w.thumbnailUrl} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded border border-neutral-200 object-cover object-top" />
          ) : (
            <div className="h-12 w-20 shrink-0 rounded border border-dashed border-neutral-300 bg-neutral-50" title="Belum ada thumbnail" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-neutral-900">{w.title}</p>
            <a href={w.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-neutral-500 hover:text-olive hover:underline">
              <span className="truncate">{hostnameOf(w.url)}</span> <ExternalLink size={11} className="shrink-0" />
            </a>
            <p className="mt-0.5 text-xs text-neutral-500">{SECTORS[w.sector]}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['published', 'Tayang'],
            ['featured', 'Unggulan'],
            ['embeddable', 'Iframe'],
          ].map(([field, label]) => (
            <div key={field} className="flex flex-col items-center gap-1.5 rounded-md bg-neutral-50 py-2">
              <span className="text-xs text-neutral-600">{label}</span>
              <Switch checked={w[field]} onChange={(v) => toggle(w, field, v)} label={`${label}: ${w.title}`} />
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => move(index, -1)}
            disabled={filtering || busy || index === 0}
            className="a-btn-secondary px-0 disabled:opacity-30"
            aria-label={`Naikkan ${w.title}`}
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => move(index, 1)}
            disabled={filtering || busy || index === items.length - 1}
            className="a-btn-secondary px-0 disabled:opacity-30"
            aria-label={`Turunkan ${w.title}`}
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(w)
              setFormOpen(true)
            }}
            className="a-btn-secondary px-0"
            aria-label={`Edit ${w.title}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError('')
              setDeleting(w)
            }}
            className="a-btn-secondary px-0 text-clay hover:bg-red-50"
            aria-label={`Hapus ${w.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </li>
    )
  })}
</ul>
</>
      )}

      {formOpen && (
        <ShowcaseForm
          initial={editing}
          nextOrder={nextOrder}
          onSubmit={handleSave}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus karya?"
          busy={busy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        >
          Karya <span className="font-medium text-neutral-900">{deleting.title}</span> akan dihapus permanen dari
          portofolio, termasuk gambar dan video yang tersimpan di penyimpanan. Untuk menyembunyikan sementara,
          matikan saklar “Tayang”.
        </ConfirmDialog>
      )}
    </div>
  )
}
