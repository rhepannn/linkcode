'use client'

import { useState } from 'react'
import { CalendarClock, ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react'
import Avatar from '../../Avatar.jsx'
import MiniBar from '../MiniBar.jsx'
import ConfirmDialog from '../ConfirmDialog.jsx'
import FeatureForm from './FeatureForm.jsx'
import { createFeature, deleteFeature, updateFeature, updateSubtask } from '../../../api/client.js'
import { FEATURE_COLUMNS, FEATURE_STATUS, daysFromNow, fmtShort } from '../../../utils/trackingConfig.js'

// Tombol aksi cepat per status: [label, status tujuan]
// Ubah satu fitur secara lokal (untuk tampilan optimistis).
const patchFeature = (project, id, fn) => ({
  ...project,
  features: project.features.map((f) => (f.id === id ? fn(f) : f)),
})

const QUICK = {
  next: ['Mulai dikerjakan', 'in_progress'],
  in_progress: ['Tandai selesai', 'done'],
  done: ['Buka lagi', 'in_progress'],
}

function FeatureCard({ feature, onEdit, act }) {
  const [open, setOpen] = useState(false)
  const subs = feature.subtasks
  const doneCount = subs.filter((s) => s.done).length
  const left = daysFromNow(feature.dueDate)
  const overdue = feature.status !== 'done' && left !== null && left < 0
  const [quickLabel, quickTo] = QUICK[feature.status]

  return (
    <li className="a-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium ${feature.status === 'done' ? 'text-neutral-500' : 'text-neutral-900'}`}>
          {feature.title}
        </p>
        <button
          type="button"
          onClick={() => onEdit(feature)}
          className="-m-1.5 shrink-0 rounded p-2.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 lg:m-0 lg:p-1"
          aria-label={`Edit fitur ${feature.title}`}
        >
          <Pencil size={14} />
        </button>
      </div>

      {feature.description && <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{feature.description}</p>}

      {subs.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900"
          >
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Sub-tugas {doneCount}/{subs.length}
            <span className="ml-auto tabular-nums">{feature.progress}%</span>
          </button>
          <MiniBar value={feature.progress} className="mt-1.5" />
          {open && (
            <ul className="mt-2 space-y-1">
              {subs.map((s) => (
                <li key={s.id}>
                  <label className="flex min-h-[2.25rem] cursor-pointer items-start gap-2.5 py-1 text-sm text-neutral-700 lg:min-h-0 lg:gap-2 lg:py-0 lg:text-xs">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={(e) => {
                        const done = e.target.checked
                        act(
                          () => updateSubtask(s.id, { done }),
                          (p) =>
                            patchFeature(p, feature.id, (f) => {
                              const subtasks = f.subtasks.map((x) => (x.id === s.id ? { ...x, done } : x))
                              const n = subtasks.filter((x) => x.done).length
                              return { ...f, subtasks, progress: f.status === 'done' ? 100 : Math.round((n / subtasks.length) * 100) }
                            }),
                        )
                      }}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-olive lg:h-3.5 lg:w-3.5"
                    />
                    <span className={s.done ? 'text-neutral-400 line-through' : ''}>{s.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {feature.assignee ? (
          <span className="inline-flex items-center gap-1.5 text-neutral-600">
            <Avatar name={feature.assignee.name} color={feature.assignee.avatarColor} size={20} ring={false} />
            {feature.assignee.name.split(' ')[0]}
          </span>
        ) : (
          <span className="text-neutral-400">Belum ditugaskan</span>
        )}
        {feature.dueDate && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-clay' : 'text-neutral-500'}`}>
            <CalendarClock size={12} />
            {fmtShort(feature.dueDate)}
            {overdue && ' · lewat'}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          act(
            () => updateFeature(feature.id, { status: quickTo }),
            (p) => patchFeature(p, feature.id, (f) => ({ ...f, status: quickTo })),
          )
        }
        className="mt-3 min-h-[2.5rem] w-full rounded-md border border-neutral-200 py-1.5 text-xs font-medium lg:min-h-0 text-neutral-600 transition-colors hover:border-olive hover:text-olive-dark"
      >
        {quickLabel}
      </button>
    </li>
  )
}

export default function FeatureBoard({ project, members, act, reload }) {
  // form: null | { feature?: object, defaultStatus?: string }
  const [form, setForm] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const editing = form?.featureId ? project.features.find((f) => f.id === form.featureId) : null

  const save = async (payload) => {
    if (editing) await updateFeature(editing.id, payload)
    else await createFeature(project.id, payload)
    setForm(null)
    await reload()
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {project.features.length === 0
            ? 'Belum ada fitur. Tambahkan fitur agar progres dihitung otomatis.'
            : 'Progres project = rata-rata progres semua fitur (sub-tugas selesai ÷ total).'}
        </p>
        <button type="button" onClick={() => setForm({ defaultStatus: 'next' })} className="a-btn-primary">
          <Plus size={16} /> Tambah fitur
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {FEATURE_COLUMNS.map((status) => {
          const items = project.features.filter((f) => f.status === status)
          return (
            <section key={status} aria-label={FEATURE_STATUS[status].label} className="rounded-lg bg-neutral-100/70 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-neutral-800">{FEATURE_STATUS[status].label}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-neutral-600">
                  {items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-400">
                  Kosong
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((f) => (
                    <FeatureCard key={f.id} feature={f} act={act} onEdit={(x) => setForm({ featureId: x.id })} />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {form && (
        <FeatureForm
          feature={editing}
          defaultStatus={form.defaultStatus}
          members={members.filter((m) => m.active || m.id === editing?.assigneeId)}
          onSave={save}
          onSubtaskChange={reload}
          onDelete={() => setConfirmDelete(editing)}
          onClose={() => setForm(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Hapus fitur?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            const id = confirmDelete.id
            setConfirmDelete(null)
            setForm(null)
            await act(() => deleteFeature(id))
          }}
        >
          Fitur <span className="font-medium text-neutral-900">{confirmDelete.title}</span> beserta sub-tugasnya akan
          dihapus permanen dan persen progres project dihitung ulang.
        </ConfirmDialog>
      )}
    </div>
  )
}
