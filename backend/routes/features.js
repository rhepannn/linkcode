import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import { parseDate, parseId } from '../lib/util.js'
import { serializeFeature, syncFeatureStatus, syncProjectProgress } from '../lib/tracking.js'

// Dipasang di /api. Semua rute memakai authMiddleware per-rute
// (jangan router.use: akan ikut memblokir rute publik lain di /api).
const router = Router()

const VALID_STATUS = ['next', 'in_progress', 'done']

function parseFeatureInput(body, { partial = false } = {}) {
  const b = body || {}
  const errors = []
  const data = {}

  if (!partial || b.title !== undefined) {
    const title = String(b.title || '').trim()
    if (!title) errors.push('Judul fitur wajib diisi.')
    data.title = title
  }
  if (b.description !== undefined) data.description = String(b.description).trim()
  if (b.status !== undefined) {
    if (!VALID_STATUS.includes(b.status)) errors.push('Status fitur tidak valid.')
    else data.status = b.status
  }
  if (b.dueDate !== undefined) {
    const d = parseDate(b.dueDate)
    if (d === undefined) errors.push('Tenggat tidak valid.')
    else data.dueDate = d
  }
  if (b.assigneeId !== undefined) {
    if (b.assigneeId === null || b.assigneeId === '') data.assigneeId = null
    else {
      const a = parseId(b.assigneeId)
      if (!a) errors.push('Penanggung jawab tidak valid.')
      else data.assigneeId = a
    }
  }
  if (b.sortOrder !== undefined) {
    const n = Number(b.sortOrder)
    if (Number.isInteger(n)) data.sortOrder = n
  }
  return { errors, data }
}

// Setelah perubahan: sinkronkan status fitur & persen project, lalu kirim ringkasan.
async function respond(res, featureId, projectId, status = 200) {
  const feature = await syncFeatureStatus(featureId)
  const percentage = await syncProjectProgress(projectId)
  return res.status(status).json({ feature: feature && serializeFeature(feature), percentage })
}

function handleError(res, err, fallback) {
  if (err.code === 'P2025') return res.status(404).json({ message: 'Data tidak ditemukan.' })
  if (err.code === 'P2003') return res.status(400).json({ message: 'Project atau penanggung jawab tidak ditemukan.' })
  console.error(fallback, err)
  return res.status(500).json({ message: fallback })
}

// POST /api/projects/:projectId/features — [AUTH] { title, description?, status?, assigneeId?, dueDate?, subtasks?: string[] }
router.post('/projects/:projectId/features', authMiddleware, async (req, res) => {
  const projectId = parseId(req.params.projectId)
  if (!projectId) return res.status(400).json({ message: 'ID tidak valid.' })

  const { errors, data } = parseFeatureInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  const subtasks = Array.isArray(req.body?.subtasks)
    ? req.body.subtasks.map((t) => String(t).trim()).filter(Boolean).slice(0, 50)
    : []

  try {
    const last = await prisma.feature.aggregate({ where: { projectId }, _max: { sortOrder: true } })
    const created = await prisma.feature.create({
      data: {
        ...data,
        projectId,
        sortOrder: data.sortOrder ?? (last._max.sortOrder ?? -1) + 1,
        completedAt: data.status === 'done' ? new Date() : null,
        subtasks: { create: subtasks.map((title, i) => ({ title, sortOrder: i })) },
      },
    })
    return respond(res, created.id, projectId, 201)
  } catch (err) {
    return handleError(res, err, 'Gagal membuat fitur.')
  }
})

// PUT /api/features/:id — [AUTH] ubah sebagian field fitur.
router.put('/features/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  const { errors, data } = parseFeatureInput(req.body, { partial: true })
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    const current = await prisma.feature.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: 'Fitur tidak ditemukan.' })

    if (data.status && data.status !== current.status) {
      data.completedAt = data.status === 'done' ? new Date() : null
    }
    await prisma.feature.update({ where: { id }, data })
    return respond(res, id, current.projectId)
  } catch (err) {
    return handleError(res, err, 'Gagal memperbarui fitur.')
  }
})

// DELETE /api/features/:id — [AUTH]
router.delete('/features/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  try {
    const current = await prisma.feature.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ message: 'Fitur tidak ditemukan.' })
    await prisma.feature.delete({ where: { id } })
    const percentage = await syncProjectProgress(current.projectId)
    res.json({ message: 'Fitur berhasil dihapus.', percentage })
  } catch (err) {
    return handleError(res, err, 'Gagal menghapus fitur.')
  }
})

// POST /api/features/:id/subtasks — [AUTH] { title }
router.post('/features/:id/subtasks', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })
  const title = String(req.body?.title || '').trim()
  if (!title) return res.status(400).json({ message: 'Judul sub-tugas wajib diisi.' })

  try {
    const feature = await prisma.feature.findUnique({ where: { id } })
    if (!feature) return res.status(404).json({ message: 'Fitur tidak ditemukan.' })
    const last = await prisma.subtask.aggregate({ where: { featureId: id }, _max: { sortOrder: true } })
    await prisma.subtask.create({ data: { featureId: id, title, sortOrder: (last._max.sortOrder ?? -1) + 1 } })
    return respond(res, id, feature.projectId, 201)
  } catch (err) {
    return handleError(res, err, 'Gagal menambah sub-tugas.')
  }
})

// PUT /api/subtasks/:id — [AUTH] { title?, done? }
router.put('/subtasks/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  const data = {}
  if (req.body?.title !== undefined) {
    const title = String(req.body.title).trim()
    if (!title) return res.status(400).json({ message: 'Judul sub-tugas wajib diisi.' })
    data.title = title
  }
  if (req.body?.done !== undefined) data.done = Boolean(req.body.done)

  try {
    const sub = await prisma.subtask.update({ where: { id }, data, include: { feature: true } })
    return respond(res, sub.featureId, sub.feature.projectId)
  } catch (err) {
    return handleError(res, err, 'Gagal memperbarui sub-tugas.')
  }
})

// DELETE /api/subtasks/:id — [AUTH]
router.delete('/subtasks/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  try {
    const sub = await prisma.subtask.delete({ where: { id }, include: { feature: true } })
    return respond(res, sub.featureId, sub.feature.projectId)
  } catch (err) {
    return handleError(res, err, 'Gagal menghapus sub-tugas.')
  }
})

export default router
