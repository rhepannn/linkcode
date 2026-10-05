import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createUpdate, deleteUpdate } from '../../../api/client.js'
import { fmtDate, timeAgo } from '../../../utils/trackingConfig.js'

// Catatan perkembangan berkala (linimasa, terbaru di atas).
export default function UpdatesTab({ project, act }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const text = note.trim()
    if (!text) return
    setBusy(true)
    await act(() => createUpdate(project.id, text))
    setNote('')
    setBusy(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ol className="space-y-0">
        {project.updates.length === 0 ? (
          <li className="a-card py-10 text-center text-sm text-neutral-500">Belum ada catatan perkembangan.</li>
        ) : (
          project.updates.map((u, i) => (
            <li key={u.id} className="relative flex gap-4 pb-6">
              {i < project.updates.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-neutral-200" aria-hidden="true" />}
              <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-olive bg-white" aria-hidden="true" />
              <div className="a-card min-w-0 flex-1 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">{u.note}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                  <span title={fmtDate(u.createdAt)}>
                    {u.author} · {timeAgo(u.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => act(() => deleteUpdate(u.id))}
                    className="-m-1.5 rounded p-2.5 text-neutral-400 hover:bg-red-50 hover:text-clay lg:m-0 lg:p-1"
                    aria-label="Hapus catatan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ol>

      <form onSubmit={submit} className="a-card h-fit space-y-3 p-4 lg:sticky lg:top-6">
        <label className="a-label" htmlFor="upd-note">Catatan baru</label>
        <textarea
          id="upd-note"
          rows={5}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="a-input resize-none"
          placeholder="Progres minggu ini, keputusan, atau hal yang perlu diketahui tim…"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">{note.length}/2000</span>
          <button type="submit" disabled={busy || !note.trim()} className="a-btn-primary">
            Simpan catatan
          </button>
        </div>
      </form>
    </div>
  )
}
