import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = Router()

const VALID_STATUS = ['active', 'review', 'hold', 'done']

// Bersihkan & validasi payload project dari request body.
function parseProjectInput(body) {
  const { name, description, percentage, status, icon, pics } = body || {}
  const errors = []

  if (!name || !String(name).trim()) errors.push('Nama project wajib diisi.')
  if (!description || !String(description).trim()) errors.push('Deskripsi wajib diisi.')
  if (status && !VALID_STATUS.includes(status)) errors.push('Status tidak valid.')

  const pct = Number(percentage)
  const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0

  const cleanPics = Array.isArray(pics)
    ? pics
        .filter((p) => p && String(p.name || '').trim())
        .map((p) => ({
          name: String(p.name).trim(),
          role: String(p.role || '').trim(),
          contribution: Math.max(0, Math.min(100, Number(p.contribution) || 0)),
          avatarColor: String(p.avatarColor || '#1E5FA8'),
        }))
    : []

  return {
    errors,
    data: {
      name: String(name || '').trim(),
      description: String(description || '').trim(),
      percentage: safePct,
      status: status || 'active',
      icon: String(icon || '🚀').trim(),
      pics: cleanPics,
    },
  }
}

// GET /api/projects — publik. Semua project + PICs.
router.get('/', async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { pics: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(projects)
  } catch (err) {
    console.error('Get projects error:', err)
    res.status(500).json({ message: 'Gagal mengambil data project.' })
  }
})

// POST /api/projects — [AUTH] buat project baru beserta PICs.
router.post('/', authMiddleware, async (req, res) => {
  const { errors, data } = parseProjectInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        percentage: data.percentage,
        status: data.status,
        icon: data.icon,
        pics: { create: data.pics },
      },
      include: { pics: true },
    })
    res.status(201).json(project)
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ message: 'Gagal membuat project.' })
  }
})

// PUT /api/projects/:id — [AUTH] edit project. PICs di-replace penuh.
router.put('/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' })

  const { errors, data } = parseProjectInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    // Replace PICs: hapus yang lama, buat ulang dari payload.
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        percentage: data.percentage,
        status: data.status,
        icon: data.icon,
        pics: { deleteMany: {}, create: data.pics },
      },
      include: { pics: true },
    })
    res.json(project)
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Project tidak ditemukan.' })
    }
    console.error('Update project error:', err)
    res.status(500).json({ message: 'Gagal memperbarui project.' })
  }
})

// DELETE /api/projects/:id — [AUTH] hapus project (PICs ikut terhapus via cascade).
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' })

  try {
    await prisma.project.delete({ where: { id } })
    res.json({ message: 'Project berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Project tidak ditemukan.' })
    }
    console.error('Delete project error:', err)
    res.status(500).json({ message: 'Gagal menghapus project.' })
  }
})

export default router
