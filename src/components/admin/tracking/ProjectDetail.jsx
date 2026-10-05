import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, GitBranch, Globe, Pencil, TestTube2 } from 'lucide-react'
import HealthBadge from '../HealthBadge.jsx'
import MiniBar from '../MiniBar.jsx'
import StatusBadge from '../../StatusBadge.jsx'
import Avatar from '../../Avatar.jsx'
import FeatureBoard from './FeatureBoard.jsx'
import TeamTab from './TeamTab.jsx'
import UpdatesTab from './UpdatesTab.jsx'
import BlockersTab from './BlockersTab.jsx'
import { getMembers, getProject } from '../../../api/client.js'
import { getStatusConfig } from '../../../utils/statusConfig.js'
import { daysFromNow, fmtDate, relativeDays, timeAgo } from '../../../utils/trackingConfig.js'

const LINKS = [
  ['stagingUrl', 'Staging', TestTube2],
  ['liveUrl', 'Live', Globe],
  ['repoUrl', 'Repositori', GitBranch],
]

// Persentase waktu yang sudah terpakai antara tanggal mulai dan target (null bila tanggal belum lengkap).
function timeElapsedPct(p) {
  if (!p.startDate || !p.targetDate) return null
  const total = new Date(p.targetDate) - new Date(p.startDate)
  if (total <= 0) return null
  return Math.round(Math.min(Math.max((Date.now() - new Date(p.startDate)) / total, 0), 1) * 100)
}

function Metric({ label, value, sub }) {
  return (
    <div className="a-card px-4 py-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

export default function ProjectDetail({ projectId, onBack, onEdit, onChanged, refreshKey }) {
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState('features')
  const [pending, setPending] = useState(0)

  const reload = useCallback(async () => {
    const p = await getProject(projectId)
    setProject(p)
    onChanged?.()
  }, [projectId, onChanged])

  useEffect(() => {
    setProject(null)
    setError('')
    Promise.all([getProject(projectId), getMembers()])
      .then(([p, m]) => {
        setProject(p)
        setMembers(m)
      })
      .catch((err) =>
        setError(err?.response?.status === 404 ? 'Project tidak ditemukan.' : 'Gagal memuat detail project.'),
      )
    // refreshKey: dinaikkan induk setelah info dasar diedit
  }, [projectId, refreshKey])

  // Jalankan aksi lalu muat ulang; kesalahan ditampilkan di atas.
  // `optimistic` (opsional): fungsi (project) => project untuk menampilkan hasil seketika sebelum server selesai.
  const act = useCallback(
    async (fn, optimistic) => {
      setError('')
      if (optimistic) setProject((p) => (p ? optimistic(p) : p))
      setPending((n) => n + 1)
      try {
        await fn()
        await reload()
      } catch (err) {
        setError(err?.response?.data?.message || 'Terjadi kesalahan. Coba lagi.')
        await reload().catch(() => {}) // kembalikan tampilan ke data server
      } finally {
        setPending((n) => n - 1)
      }
    },
    [reload],
  )

  if (error && !project) {
    return (
      <div>
        <button type="button" onClick={onBack} className="a-btn-secondary mb-4">
          <ArrowLeft size={16} /> Kembali
        </button>
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      </div>
    )
  }
  if (!project) return <p className="py-12 text-center text-sm text-neutral-500">Memuat project…</p>

  const cfg = getStatusConfig(project.status)
  const counts = (s) => project.features.filter((f) => f.status === s).length
  const openBlockers = project.blockers.filter((b) => b.status === 'open')
  const elapsed = timeElapsedPct(project)
  const left = daysFromNow(project.targetDate)
  const lead = project.team.find((t) => t.role === 'lead')
  const links = LINKS.filter(([key]) => project[key])

  const tabs = [
    ['features', `Fitur (${project.features.length})`],
    ['team', `Tim (${project.team.length})`],
    ['updates', `Catatan (${project.updates.length})`],
    ['blockers', `Kendala${openBlockers.length ? ` (${openBlockers.length})` : ''}`],
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft size={16} /> Kembali
        </button>
        <span role="status" aria-live="polite" className="text-xs text-neutral-400">
          {pending > 0 ? 'Menyimpan…' : ''}
        </span>
      </div>

      {/* Header */}
      <header className="a-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-3xl">{project.icon}</span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-neutral-900">{project.name}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">{project.client || 'Tanpa klien'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                <HealthBadge health={project.health} />
              </div>
            </div>
          </div>
          <button type="button" onClick={() => onEdit(project)} className="a-btn-secondary">
            <Pencil size={15} /> Edit info
          </button>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-600">{project.description}</p>

        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-neutral-800">Progres {project.percentage}%</span>
              <span className="text-xs text-neutral-500">
                {project.autoProgress ? `dihitung otomatis dari ${project.features.length} fitur` : 'diisi manual (belum ada fitur)'}
              </span>
            </div>
            <MiniBar value={project.percentage} color={cfg.barColor} className="!h-2.5" />
            {elapsed !== null && (
              <>
                <div className="mb-1.5 mt-3 flex items-baseline justify-between">
                  <span className="text-sm text-neutral-600">Waktu terpakai {elapsed}%</span>
                  <span className="text-xs text-neutral-500">
                    {project.percentage >= elapsed ? 'progres di depan jadwal' : `tertinggal ${elapsed - project.percentage} poin dari jadwal`}
                  </span>
                </div>
                <MiniBar value={elapsed} color="#B8A58A" />
              </>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:min-w-[18rem]">
            <div>
              <dt className="text-xs text-neutral-500">Mulai</dt>
              <dd className="text-neutral-800">{fmtDate(project.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Target selesai</dt>
              <dd className={left !== null && left < 0 && project.status !== 'done' ? 'font-medium text-clay' : 'text-neutral-800'}>
                {fmtDate(project.targetDate)}
                {project.targetDate && project.status !== 'done' && (
                  <span className="block text-xs font-normal text-neutral-500">{relativeDays(project.targetDate)}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">PIC utama</dt>
              <dd className="flex items-center gap-2 text-neutral-800">
                {lead ? (
                  <>
                    <Avatar name={lead.name} color={lead.avatarColor} size={22} ring={false} />
                    {lead.name}
                  </>
                ) : (
                  <span className="text-neutral-400">Belum dipilih</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Diperbarui</dt>
              <dd className="text-neutral-800">{timeAgo(project.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            {links.map(([key, label, Icon]) => (
              <a
                key={key}
                href={project[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:border-olive hover:text-olive-dark"
              >
                <Icon size={14} /> {label} <ExternalLink size={12} className="text-neutral-400" />
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Ringkasan angka */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Fitur selesai" value={`${counts('done')}/${project.features.length}`} />
        <Metric label="Sedang dikerjakan" value={counts('in_progress')} />
        <Metric label="Berikutnya" value={counts('next')} />
        <Metric label="Kendala terbuka" value={openBlockers.length} sub={openBlockers.some((b) => b.severity === 'high') ? 'ada yang tingkat tinggi' : undefined} />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Tab */}
      <div role="tablist" aria-label="Bagian project" className="mt-6 flex gap-1 overflow-x-auto border-b border-neutral-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === id ? 'border-olive font-medium text-olive-dark' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="pt-5">
        {tab === 'features' && <FeatureBoard project={project} members={members} act={act} reload={reload} />}
        {tab === 'team' && <TeamTab project={project} members={members} act={act} />}
        {tab === 'updates' && <UpdatesTab project={project} act={act} />}
        {tab === 'blockers' && <BlockersTab project={project} act={act} />}
      </div>
    </div>
  )
}
