import { useCallback, useEffect, useState } from 'react'
import { Crown, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import MemberForm from './MemberForm.jsx'
import Avatar from '../Avatar.jsx'
import { createMember, deleteMember, getMembers, updateMember } from '../../api/client.js'

// Halaman Tim: anggota global yang bisa ditugaskan ke banyak project.
export default function MembersPanel({ onChanged }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setError('')
    return getMembers()
      .then(setMembers)
      .catch(() => setError('Gagal memuat anggota tim.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (payload) => {
    if (editing) await updateMember(editing.id, payload)
    else await createMember(payload)
    setFormOpen(false)
    setEditing(null)
    await load()
    onChanged?.()
  }

  const remove = async () => {
    setBusy(true)
    setDeleteError('')
    try {
      await deleteMember(deleting.id)
      setDeleting(null)
      await load()
      onChanged?.()
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Gagal menghapus anggota.')
    } finally {
      setBusy(false)
    }
  }

  const activeCount = members.filter((m) => m.active).length

  return (
    <div>
      <PageHeader title="Tim" sub={`${members.length} anggota · ${activeCount} aktif`}>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="a-btn-primary"
        >
          <Plus size={16} /> Tambah anggota
        </button>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Memuat anggota…</p>
      ) : members.length === 0 ? (
        <p className="a-card py-12 text-center text-sm text-neutral-500">Belum ada anggota. Klik “Tambah anggota” untuk mulai.</p>
      ) : (
        <>
<div className="a-card hidden overflow-x-auto xl:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Anggota</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Fitur terbuka</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {members.map((m) => (
                <tr key={m.id} className={`hover:bg-neutral-50 ${m.active ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} color={m.avatarColor} size={34} ring={false} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">{m.name}</p>
                        <p className="truncate text-xs text-neutral-500">{m.role}{m.email ? ` · ${m.email}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.projects.length === 0 ? (
                      <span className="text-xs text-neutral-400">Belum ditugaskan</span>
                    ) : (
                      <ul className="flex flex-wrap gap-1.5">
                        {m.projects.map((p) => (
                          <li key={p.id} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
                            {p.role === 'lead' && <Crown size={11} className="text-amber-600" aria-label="PIC utama" />}
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-600">{m.openFeatures}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{m.active ? 'Aktif' : 'Nonaktif'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(m)
                          setFormOpen(true)
                        }}
                        className="rounded p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        aria-label={`Edit ${m.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('')
                          setDeleting(m)
                        }}
                        className="rounded p-2 text-neutral-500 hover:bg-red-50 hover:text-clay"
                        aria-label={`Hapus ${m.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
<ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:hidden">
  {members.map((m) => (
    <li key={m.id} className={`a-card p-4 ${m.active ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-3">
        <Avatar name={m.name} color={m.avatarColor} size={40} ring={false} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{m.name}</p>
          <p className="truncate text-xs text-neutral-500">{m.role}{m.email ? ` · ${m.email}` : ''}</p>
        </div>
        <span className="text-xs text-neutral-500">{m.active ? 'Aktif' : 'Nonaktif'}</span>
      </div>
      <div className="mt-3">
        {m.projects.length === 0 ? (
          <span className="text-xs text-neutral-400">Belum ditugaskan ke project</span>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {m.projects.map((p) => (
              <li key={p.id} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
                {p.role === 'lead' && <Crown size={11} className="text-amber-600" aria-label="PIC utama" />}
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Fitur terbuka: <span className="font-medium tabular-nums text-neutral-800">{m.openFeatures}</span>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(m)
            setFormOpen(true)
          }}
          className="a-btn-secondary text-xs"
        >
          <Pencil size={15} /> Edit
        </button>
        <button
          type="button"
          onClick={() => {
            setDeleteError('')
            setDeleting(m)
          }}
          className="a-btn-secondary text-xs text-clay hover:bg-red-50"
        >
          <Trash2 size={15} /> Hapus
        </button>
      </div>
    </li>
  ))}
</ul>
</>
      )}

      {formOpen && (
        <MemberForm
          initial={editing}
          onSubmit={save}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog title="Hapus anggota?" busy={busy} error={deleteError} onConfirm={remove} onCancel={() => setDeleting(null)}>
          <span className="font-medium text-neutral-900">{deleting.name}</span> akan dikeluarkan dari{' '}
          {deleting.projects.length} project
          {deleting.openFeatures > 0 && ` dan ${deleting.openFeatures} fitur yang ditugaskan menjadi tanpa penanggung jawab`}.
          Untuk menyimpan riwayat tanpa menghapus, ubah menjadi <span className="font-medium">Nonaktif</span>.
        </ConfirmDialog>
      )}
    </div>
  )
}
