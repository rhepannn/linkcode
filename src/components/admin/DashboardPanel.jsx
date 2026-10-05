import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FolderKanban, PauseCircle, Rocket, TrendingUp } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import HealthBadge from './HealthBadge.jsx'
import MiniBar from './MiniBar.jsx'
import StatCard from '../StatCard.jsx'
import StatusBadge from '../StatusBadge.jsx'
import Avatar from '../Avatar.jsx'
import { getStatusConfig } from '../../utils/statusConfig.js'
import { daysFromNow, fmtDate, relativeDays, timeAgo } from '../../utils/trackingConfig.js'

const FILTERS = [
  ['all', 'Semua'],
  ['running', 'Berjalan'],
  ['hold', 'Ditahan'],
  ['done', 'Selesai'],
]

// Alasan sebuah project perlu perhatian (untuk panel "Perlu perhatian").
function attentionReasons(p) {
  const reasons = []
  if (p.health === 'overdue') reasons.push(`Lewat target ${relativeDays(p.targetDate)} (${p.percentage}%)`)
  if (p.health === 'at_risk' && p.highBlockers === 0) reasons.push('Progres tertinggal dari jadwal')
  if (p.highBlockers > 0) reasons.push(`${p.highBlockers} kendala tingkat tinggi`)
  else if (p.openBlockers > 0 && p.health === 'at_risk') reasons.push(`${p.openBlockers} kendala terbuka`)
  return reasons
}

export default function DashboardPanel({ overview, loading, error, onOpenProject }) {
  const [filter, setFilter] = useState('running')

  const stats = useMemo(() => {
    const running = overview.filter((p) => p.status === 'active' || p.status === 'review').length
    const avg = overview.length ? Math.round(overview.reduce((s, p) => s + p.percentage, 0) / overview.length) : 0
    return {
      total: overview.length,
      running,
      done: overview.filter((p) => p.status === 'done').length,
      hold: overview.filter((p) => p.status === 'hold').length,
      avg,
      attention: overview.filter((p) => p.health === 'overdue' || p.health === 'at_risk').length,
    }
  }, [overview])

  const attention = useMemo(
    () => overview.filter((p) => p.health === 'overdue' || p.health === 'at_risk'),
    [overview],
  )

  const rows = useMemo(
    () =>
      overview.filter((p) => {
        if (filter === 'running') return p.status === 'active' || p.status === 'review'
        if (filter === 'hold') return p.status === 'hold'
        if (filter === 'done') return p.status === 'done'
        return true
      }),
    [overview, filter],
  )

  return (
    <div>
      <PageHeader title="Dashboard" sub="Pantau perkembangan seluruh project" />

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total project" value={stats.total} icon={FolderKanban} />
        <StatCard label="Sedang berjalan" value={stats.running} icon={Rocket} />
        <StatCard label="Selesai" value={stats.done} icon={CheckCircle2} />
        <StatCard label="Ditahan" value={stats.hold} icon={PauseCircle} />
        <StatCard label="Rata-rata progres" value={`${stats.avg}%`} icon={TrendingUp} />
        <StatCard label="Perlu perhatian" value={stats.attention} icon={AlertTriangle} />
      </div>

      {attention.length > 0 && (
        <section className="mt-8" aria-labelledby="attn-title">
          <h3 id="attn-title" className="mb-3 text-sm font-semibold text-neutral-900">
            Perlu perhatian
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {attention.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenProject(p.id)}
                className="a-card flex items-start gap-3 border-l-4 p-4 text-left transition-colors hover:bg-neutral-50"
                style={{ borderLeftColor: p.health === 'overdue' ? '#BD3D44' : '#D99100' }}
              >
                <span className="text-2xl">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-neutral-900">{p.name}</p>
                    <HealthBadge health={p.health} />
                  </div>
                  <ul className="mt-1 space-y-0.5 text-sm text-neutral-600">
                    {attentionReasons(p).map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                </div>
                <span className="text-sm font-semibold tabular-nums text-neutral-700">{p.percentage}%</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="list-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 id="list-title" className="text-sm font-semibold text-neutral-900">
            Semua project
          </h3>
          <div className="flex gap-1 rounded-md border border-neutral-200 bg-white p-0.5">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  filter === id ? 'bg-olive text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-neutral-500">Memuat project…</p>
        ) : rows.length === 0 ? (
          <p className="a-card py-12 text-center text-sm text-neutral-500">Tidak ada project pada kategori ini.</p>
        ) : (
          <>
<div className="a-card hidden overflow-x-auto xl:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progres</th>
                  <th className="px-4 py-3 font-medium">Tenggat</th>
                  <th className="px-4 py-3 font-medium">PIC</th>
                  <th className="px-4 py-3 font-medium">Kendala</th>
                  <th className="px-4 py-3 font-medium">Diperbarui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((p) => {
                  const left = daysFromNow(p.targetDate)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className="cursor-pointer hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenProject(p.id)
                          }}
                          className="flex items-center gap-3 text-left"
                        >
                          <span className="text-xl">{p.icon}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-neutral-900">{p.name}</span>
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
                        <div className="w-36">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-medium tabular-nums text-neutral-800">{p.percentage}%</span>
                            <span className="text-neutral-500">
                              {p.features.total ? `${p.features.done}/${p.features.total} fitur` : 'manual'}
                            </span>
                          </div>
                          <MiniBar value={p.percentage} color={getStatusConfig(p.status).barColor} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        <span className="block">{fmtDate(p.targetDate)}</span>
                        {p.targetDate && p.status !== 'done' && (
                          <span className={`block text-xs ${left < 0 ? 'text-clay' : 'text-neutral-500'}`}>
                            {relativeDays(p.targetDate)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.lead ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={p.lead.name} color={p.lead.avatarColor} size={26} ring={false} />
                            <div className="min-w-0">
                              <span className="block truncate text-neutral-800">{p.lead.name}</span>
                              <span className="block text-xs text-neutral-500">{p.teamCount} anggota</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">Belum ada PIC</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.openBlockers > 0 ? (
                          <span className={`text-sm font-medium ${p.highBlockers > 0 ? 'text-clay' : 'text-amber-700'}`}>
                            {p.openBlockers} terbuka
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{timeAgo(p.updatedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
<ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:hidden">
  {rows.map((p) => (
    <li key={p.id}>
      <button
        type="button"
        onClick={() => onOpenProject(p.id)}
        className="a-card block w-full p-4 text-left transition-colors active:bg-neutral-50"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">{p.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-neutral-900">{p.name}</p>
            <p className="truncate text-xs text-neutral-500">{p.client || 'Tanpa klien'}</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-neutral-800">{p.percentage}%</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={p.status} />
          <HealthBadge health={p.health} />
        </div>
        <MiniBar value={p.percentage} color={getStatusConfig(p.status).barColor} className="mt-3" />
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <dt className="text-neutral-500">Tenggat</dt>
            <dd className="text-neutral-800">
              {fmtDate(p.targetDate)}
              {p.targetDate && p.status !== 'done' && (
                <span className={`block ${daysFromNow(p.targetDate) < 0 ? 'text-clay' : 'text-neutral-500'}`}>
                  {relativeDays(p.targetDate)}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">PIC</dt>
            <dd className="flex items-center gap-1.5 text-neutral-800">
              {p.lead ? (
                <>
                  <Avatar name={p.lead.name} color={p.lead.avatarColor} size={20} ring={false} />
                  <span className="truncate">{p.lead.name}</span>
                </>
              ) : (
                <span className="text-neutral-400">Belum ada PIC</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Fitur</dt>
            <dd className="text-neutral-800">
              {p.features.total ? `${p.features.done}/${p.features.total} selesai` : 'Manual'}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Kendala</dt>
            <dd className={p.openBlockers > 0 ? (p.highBlockers > 0 ? 'font-medium text-clay' : 'font-medium text-amber-700') : 'text-neutral-400'}>
              {p.openBlockers > 0 ? `${p.openBlockers} terbuka` : '—'}
            </dd>
          </div>
        </dl>
      </button>
    </li>
  ))}
</ul>
</>
        )}
      </section>
    </div>
  )
}
