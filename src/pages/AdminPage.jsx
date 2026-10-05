import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Images, Users, Settings, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import LoginModal from '../components/LoginModal.jsx'
import AdminSettings from '../components/AdminSettings.jsx'
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx'
import DashboardPanel from '../components/admin/DashboardPanel.jsx'
import ProjectsPanel from '../components/admin/ProjectsPanel.jsx'
import ProjectForm from '../components/admin/ProjectForm.jsx'
import MembersPanel from '../components/admin/MembersPanel.jsx'
import ShowcasesPanel from '../components/admin/ShowcasesPanel.jsx'
import ProjectDetail from '../components/admin/tracking/ProjectDetail.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { createProject, deleteProject, getOverview, getProject, updateProject } from '../api/client.js'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'members', label: 'Tim', icon: Users },
  { id: 'showcases', label: 'Portofolio', icon: Images },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

// Sidebar: kolom tetap di layar ≥ md; drawer geser dari kiri di layar kecil.
function Sidebar({ active, onChange, username, onLogout, open, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden' // kunci scroll halaman di belakang drawer
    closeRef.current?.focus() // saat membuka, visibility langsung 'visible' (lihat kelas aside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-neutral-900/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        id="admin-sidebar"
        aria-label="Menu admin"
        // Buka: visibility langsung 'visible' (fokus bisa langsung masuk). Tutup: visibility baru
        // 'hidden' setelah animasi geser selesai, supaya item menu tidak bisa difokus saat tersembunyi.
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white duration-200 lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-56 lg:shrink-0 lg:self-start lg:translate-x-0 ${
          open
            ? 'visible translate-x-0 shadow-xl transition-transform'
            : 'invisible -translate-x-full transition-[transform,visibility]'
        }`}
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <p className="font-display text-2xl font-semibold">
              Link<span className="italic text-olive">Code</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">Admin panel</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="-mr-2 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors lg:py-2 ${
                active === id
                  ? 'bg-olive/10 font-medium text-olive-dark'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 lg:py-2"
          >
            <ExternalLink size={18} />
            Lihat situs
          </Link>
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <p className="truncate px-3 pb-2 text-xs text-neutral-500">
            Masuk sebagai <span className="font-medium text-neutral-800">{username || 'admin'}</span>
          </p>
          <button type="button" onClick={onLogout} className="a-btn-secondary w-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default function AdminPage() {
  const { isAdmin, username, signIn, logout } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [openProjectId, setOpenProjectId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const [detailKey, setDetailKey] = useState(0) // naik → detail memuat ulang (setelah info dasar diedit)

  const [overview, setOverview] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // form: null | { project?: object }   (project = mode edit)
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [busy, setBusy] = useState(false)

  // Muat ringkasan; `silent` = tanpa menampilkan status loading (pembaruan latar belakang).
  const loadOverview = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    return getOverview()
      .then((data) => setOverview(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat project dari server.'))
      .finally(() => setLoading(false))
  }, [])
  const refreshQuietly = useCallback(() => loadOverview(true), [loadOverview])

  useEffect(() => {
    if (isAdmin) loadOverview()
  }, [isAdmin, loadOverview])

  const go = (id) => {
    setPage(id)
    setOpenProjectId(null)
    setMenuOpen(false)
    window.scrollTo({ top: 0 })
  }
  const openProject = (id) => {
    setOpenProjectId(id)
    if (page !== 'dashboard' && page !== 'projects') setPage('projects')
  }

  const openEdit = async (idOrProject) => {
    try {
      const project = typeof idOrProject === 'object' ? idOrProject : await getProject(idOrProject)
      setForm({ project })
    } catch {
      setError('Gagal memuat data project.')
    }
  }

  const handleSave = async (payload) => {
    if (form?.project) {
      await updateProject(form.project.id, payload)
      setForm(null)
      setDetailKey((k) => k + 1)
      await loadOverview(true)
    } else {
      const created = await createProject(payload)
      setForm(null)
      await loadOverview(true)
      setPage('projects')
      setOpenProjectId(created.id) // langsung ke detail untuk mengisi fitur & tim
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setDeleteError('')
    try {
      await deleteProject(deleting.id)
      if (openProjectId === deleting.id) setOpenProjectId(null)
      setDeleting(null)
      await loadOverview(true)
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Gagal menghapus project.')
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) return <LoginModal onSubmit={signIn} />

  const showingDetail = openProjectId !== null && (page === 'dashboard' || page === 'projects')

  const pageTitle = NAV_ITEMS.find((n) => n.id === page)?.label

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar
        active={page}
        onChange={go}
        username={username}
        onLogout={logout}
        open={menuOpen}
        onClose={closeMenu}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: hanya di layar kecil */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            className="rounded-md p-2.5 text-neutral-700 hover:bg-neutral-100"
          >
            <Menu size={22} />
          </button>
          <p className="font-display text-xl font-semibold">
            Link<span className="italic text-olive">Code</span>
          </p>
          <span className="ml-auto truncate text-sm text-neutral-500">{pageTitle}</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-6xl">
            {showingDetail ? (
              <ProjectDetail
                projectId={openProjectId}
                refreshKey={detailKey}
                onBack={() => setOpenProjectId(null)}
                onEdit={openEdit}
                onChanged={refreshQuietly}
              />
            ) : (
              <>
                {page === 'dashboard' && (
                  <DashboardPanel overview={overview} loading={loading} error={error} onOpenProject={openProject} />
                )}
                {page === 'projects' && (
                  <ProjectsPanel
                    overview={overview}
                    loading={loading}
                    error={error}
                    onOpen={openProject}
                    onEdit={openEdit}
                    onDelete={(p) => {
                      setDeleteError('')
                      setDeleting(p)
                    }}
                    onCreate={() => setForm({})}
                  />
                )}
                {page === 'members' && <MembersPanel onChanged={refreshQuietly} />}
                {page === 'showcases' && <ShowcasesPanel />}
                {page === 'settings' && <AdminSettings />}
              </>
            )}
          </div>
        </main>
      </div>

      {form && <ProjectForm initial={form.project} onSubmit={handleSave} onClose={() => setForm(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Hapus project?"
          busy={busy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        >
          Project <span className="font-medium text-neutral-900">{deleting.name}</span> akan dihapus permanen beserta
          fitur, tim, catatan, dan kendalanya. Tindakan ini tidak bisa dibatalkan.
        </ConfirmDialog>
      )}
    </div>
  )
}
