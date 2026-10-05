import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import HealthBadge from './HealthBadge.jsx'
import MiniBar from './MiniBar.jsx'
import StatusBadge from '../StatusBadge.jsx'
import Avatar from '../Avatar.jsx'
import { getStatusConfig } from '../../utils/statusConfig.js'
import { fmtDate } from '../../utils/trackingConfig.js'

// Daftar project untuk dikelola (buat, ubah info, hapus, buka detail).
export default function ProjectsPanel({ overview, loading, error, onOpen, onEdit, onDelete, onCreate }) {
  return (
    <div>
      <PageHeader title="Projects" sub={`${overview.length} project terdaftar`}>
        <button type="button" onClick={onCreate} className="a-btn-primary">
          <Plus size={16} /> Tambah project
        </button>
      </PageHeader>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Memuat project…</p>
      ) : overview.length === 0 ? (
        <p className="a-card py-12 text-center text-sm text-neutral-500">Belum ada project. Klik “Tambah project” untuk mulai.</p>
      ) : (
        <>
<div className="a-card hidden overflow-x-auto xl:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progres</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {overview.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onOpen(p.id)} className="flex items-center gap-3 text-left">
                      <span className="text-xl">{p.icon}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-neutral-900 hover:underline">{p.name}</span>
                        <span className="block truncate text-xs text-neutral-500">{p.client || 'Tanpa klien'}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={p.status} />
                      <HealthBadge health={p.health} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MiniBar value={p.percentage} color={getStatusConfig(p.status).barColor} className="w-24" />
                      <span className="w-9 text-xs tabular-nums text-neutral-600">{p.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{fmtDate(p.targetDate)}</td>
                  <td className="px-4 py-3">
                    {p.lead ? (
                      <span className="inline-flex items-center gap-2 text-neutral-700">
                        <Avatar name={p.lead.name} color={p.lead.avatarColor} size={22} ring={false} />
                        {p.lead.name}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => onOpen(p.id)} className="rounded p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" aria-label={`Buka ${p.name}`}>
                        <Eye size={16} />
                      </button>
                      <button type="button" onClick={() => onEdit(p.id)} className="rounded p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" aria-label={`Edit ${p.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => onDelete(p)} className="rounded p-2 text-neutral-500 hover:bg-red-50 hover:text-clay" aria-label={`Hapus ${p.name}`}>
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
  {overview.map((p) => (
    <li key={p.id} className="a-card p-4">
      <button type="button" onClick={() => onOpen(p.id)} className="flex w-full items-start gap-3 text-left">
        <span className="text-2xl leading-none">{p.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-neutral-900">{p.name}</span>
          <span className="block truncate text-xs text-neutral-500">{p.client || 'Tanpa klien'}</span>
        </span>
        <span className="text-sm font-semibold tabular-nums text-neutral-800">{p.percentage}%</span>
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={p.status} />
        <HealthBadge health={p.health} />
      </div>
      <MiniBar value={p.percentage} color={getStatusConfig(p.status).barColor} className="mt-3" />
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-600">
        <span>Target: {fmtDate(p.targetDate)}</span>
        {p.lead ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Avatar name={p.lead.name} color={p.lead.avatarColor} size={20} ring={false} />
            <span className="truncate">{p.lead.name}</span>
          </span>
        ) : (
          <span className="text-neutral-400">Belum ada PIC</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => onOpen(p.id)} className="a-btn-secondary text-xs">
          <Eye size={15} /> Buka
        </button>
        <button type="button" onClick={() => onEdit(p.id)} className="a-btn-secondary text-xs">
          <Pencil size={15} /> Edit
        </button>
        <button type="button" onClick={() => onDelete(p)} className="a-btn-secondary text-xs text-clay hover:bg-red-50">
          <Trash2 size={15} /> Hapus
        </button>
      </div>
    </li>
  ))}
</ul>
</>
      )}
    </div>
  )
}
