import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import LoginModal from '../components/LoginModal.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import ProjectForm from '../components/ProjectForm.jsx'
import StatCard from '../components/StatCard.jsx'
import AdminSettings from '../components/AdminSettings.jsx'
import { useAuth } from '../hooks/useAuth.js'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../api/client.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
]

function Sidebar({ active, onChange, username, onLogout }) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r-2 border-sky-blue/30 bg-navy">
      <div className="border-b-2 border-sky-blue/20 px-4 py-5">
        <p className="font-pixel text-[9px] uppercase tracking-widest text-light-blue/40">
          logged in as
        </p>
        <p className="mt-1 font-pixel text-[11px] text-neon-green">
          {username || 'admin'}
          <span className="animate-blink">_</span>
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left font-pixel text-[10px] uppercase tracking-wider transition-all ${
              active === item.id
                ? 'border-sky-blue bg-sky-blue/15 text-sky-blue'
                : 'border-transparent text-light-blue/50 hover:border-sky-blue/30 hover:bg-white/5 hover:text-light-blue'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t-2 border-sky-blue/20 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="btn-pixel w-full border-sky-blue/50 px-3 py-2.5 text-light-blue/70 hover:border-sky-blue hover:text-sky-blue"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

function SectionHeader({ title, sub, inline = false }) {
  if (inline) {
    return (
      <div>
        <h2 className="font-display text-xl leading-relaxed text-navy">{title}</h2>
        {sub && (
          <p className="font-pixel text-[10px] uppercase tracking-wide text-navy/50">{sub}</p>
        )}
      </div>
    )
  }
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl leading-relaxed text-navy">
        <span className="text-sky-blue">{'>'}</span> {title}
      </h2>
      {sub && (
        <p className="mt-0.5 font-pixel text-[10px] uppercase tracking-wide text-navy/50">{sub}</p>
      )}
    </div>
  )
}

function DashboardPanel({ projects }) {
  const total = projects.length
  const active = projects.filter((p) => p.status === 'active').length
  const done = projects.filter((p) => p.status === 'done').length
  const avg =
    total === 0
      ? 0
      : Math.round(projects.reduce((sum, p) => sum + (p.percentage || 0), 0) / total)

  return (
    <div>
      <SectionHeader title="Dashboard" sub="Ringkasan project LinkCode" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Project" value={total} icon="📁" accent="#1E5FA8" />
        <StatCard label="Active" value={active} icon="🚀" accent="#FF4D9D" />
        <StatCard label="Rata-rata Progress" value={`${avg}%`} icon="📈" accent="#16A34A" />
        <StatCard label="Completed" value={done} icon="✅" accent="#0D2B4E" />
      </div>
    </div>
  )
}

function ProjectsPanel({ projects, loading, error, onEdit, onDelete, onCreate }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader title="Projects" sub="Kelola semua project" inline />
        <button
          type="button"
          onClick={onCreate}
          className="btn-pixel border-navy bg-sky-blue px-5 py-3 text-white shadow hover:bg-sky-blue/90 active:shadow-none"
        >
          + Tambah
        </button>
      </div>

      {error && (
        <p className="mb-4 border-2 border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-navy/50">Memuat project…</p>
      ) : projects.length === 0 ? (
        <p className="py-12 text-center text-navy/50">
          Belum ada project. Klik "+ Tambah" untuk mulai.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              actions={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="btn-pixel flex-1 border-brand-blue px-3 py-2 text-brand-blue hover:bg-off-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="btn-pixel flex-1 border-red-400 px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { isAdmin, username, signIn, logout } = useAuth()
  const [page, setPage] = useState('dashboard')

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const loadProjects = () => {
    setLoading(true)
    setError('')
    getProjects()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat project dari server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAdmin) loadProjects()
  }, [isAdmin])

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p) => { setEditing(p); setFormOpen(true) }

  const handleSave = async (payload) => {
    if (editing) await updateProject(editing.id, payload)
    else await createProject(payload)
    setFormOpen(false)
    setEditing(null)
    loadProjects()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteProject(deleting.id)
    setDeleting(null)
    loadProjects()
  }

  if (!isAdmin) return <LoginModal onSubmit={signIn} />

  return (
    <div className="flex min-h-screen flex-col bg-off-white">
      <Navbar admin username={username} onLogout={logout} />

      <div className="flex flex-1">
        <Sidebar active={page} onChange={setPage} username={username} onLogout={logout} />

        <main className="flex-1 overflow-auto px-6 py-8 sm:px-8">
          {page === 'dashboard' && <DashboardPanel projects={projects} />}
          {page === 'projects' && (
            <ProjectsPanel
              projects={projects}
              loading={loading}
              error={error}
              onEdit={openEdit}
              onDelete={setDeleting}
              onCreate={openCreate}
            />
          )}
          {page === 'settings' && <AdminSettings />}
        </main>
      </div>

      {formOpen && (
        <ProjectForm
          initial={editing}
          onSubmit={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4">
          <div className="w-full max-w-sm border-2 border-navy bg-white p-6 shadow-lg">
            <h3 className="font-pixel text-sm text-navy">Hapus Project?</h3>
            <p className="mt-3 text-lg leading-snug text-navy/70">
              Project <span className="text-navy">{deleting.name}</span> akan dihapus permanen
              beserta data PIC-nya. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="btn-pixel border-navy px-4 py-3 text-navy hover:bg-off-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-pixel border-red-700 bg-red-600 px-5 py-3 text-white shadow-[4px_4px_0_0_#7f1d1d] hover:bg-red-700 active:shadow-none"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
