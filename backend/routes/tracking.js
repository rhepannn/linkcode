import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import { parseId } from '../lib/util.js'

// Catatan perkembangan & kendala per project. Dipasang di /api; auth per-rute.
const router = Router()

const SEVERITIES = ['low', 'medium', 'high']
const BLOCKER_STATUS = ['open', 'resolved']

function handleError(res, err, fallback) {
  if (err.code === 'P2025') return res.status(404).json({ message: 'Data tidak ditemukan.' })
  if (err.code === 'P2003') return res.status(404).json({ message: 'Project tidak ditemukan.' })
  console.error(fallback, err)
  return res.status(500).json({ message: fallback })
}

// ---------- Catatan perkembangan ----------

// POST /api/projects/:projectId/updates — [AUTH] { note }
router.post('/projects/:projectId/updates', authMiddleware, async (req, res) => {
  const projectId = parseId(req.params.projectId)
  if (!projectId) return res.status(400).json({ message: 'ID tidak valid.' })
  const note = String(req.body?.note || '').trim()
  if (!note) return res.status(400).json({ message: 'Isi catatan wajib diisi.' })
  if (note.length > 2000) return res.status(400).json({ message: 'Catatan maksimal 2000 karakter.' })

  try {
    const update = await prisma.projectUpdate.create({
      data: { projectId, note, author: req.admin?.username || 'admin' },
    })
    // Catatan baru dianggap aktivitas project → perbarui updatedAt.
    await prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } })
    res.status(201).json(update)
  } catch (err) {
    return handleError(res, err, 'Gagal menyimpan catatan.')
  }
})

// DELETE /api/updates/:id — [AUTH]
router.delete('/updates/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })
  try {
    await prisma.projectUpdate.delete({ where: { id } })
    res.json({ message: 'Catatan berhasil dihapus.' })
  } catch (err) {
    return handleError(res, err, 'Gagal menghapus catatan.')
  }
})

// ---------- Kendala / risiko ----------

// POST /api/projects/:projectId/blockers — [AUTH] { title, detail?, severity? }
router.post('/projects/:projectId/blockers', authMiddleware, async (req, res) => {
  const projectId = parseId(req.params.projectId)
  if (!projectId) return res.status(400).json({ message: 'ID tidak valid.' })
  const title = String(req.body?.title || '').trim()
  if (!title) return res.status(400).json({ message: 'Judul kendala wajib diisi.' })
  const severity = req.body?.severity ?? 'medium'
  if (!SEVERITIES.includes(severity)) return res.status(400).json({ message: 'Tingkat keparahan tidak valid.' })

  try {
    const blocker = await prisma.blocker.create({
      data: { projectId, title, detail: String(req.body?.detail || '').trim(), severity },
    })
    res.status(201).json(blocker)
  } catch (err) {
    return handleError(res, err, 'Gagal menyimpan kendala.')
  }
})

// PUT /api/blockers/:id — [AUTH] { title?, detail?, severity?, status? }
router.put('/blockers/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  const b = req.body || {}
  const data = {}
  if (b.title !== undefined) {
    const title = String(b.title).trim()
    if (!title) return res.status(400).json({ message: 'Judul kendala wajib diisi.' })
    data.title = title
  }
  if (b.detail !== undefined) data.detail = String(b.detail).trim()
  if (b.severity !== undefined) {
    if (!SEVERITIES.includes(b.severity)) return res.status(400).json({ message: 'Tingkat keparahan tidak valid.' })
    data.severity = b.severity
  }
  if (b.status !== undefined) {
    if (!BLOCKER_STATUS.includes(b.status)) return res.status(400).json({ message: 'Status kendala tidak valid.' })
    data.status = b.status
    data.resolvedAt = b.status === 'resolved' ? new Date() : null
  }

  try {
    res.json(await prisma.blocker.update({ where: { id }, data }))
  } catch (err) {
    return handleError(res, err, 'Gagal memperbarui kendala.')
  }
})

// DELETE /api/blockers/:id — [AUTH]
router.delete('/blockers/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })
  try {
    await prisma.blocker.delete({ where: { id } })
    res.json({ message: 'Kendala berhasil dihapus.' })
  } catch (err) {
    return handleError(res, err, 'Gagal menghapus kendala.')
  }
})

export default router
