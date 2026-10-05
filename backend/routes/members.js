import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import { optStr, parseId } from '../lib/util.js'

// Anggota tim global. Seluruhnya [AUTH].
const router = Router()
router.use(authMiddleware)

const HEX = /^#[0-9a-fA-F]{6}$/

function parseMemberInput(body) {
  const b = body || {}
  const errors = []

  const name = String(b.name || '').trim()
  const role = String(b.role || '').trim()
  if (!name) errors.push('Nama wajib diisi.')
  if (!role) errors.push('Jabatan wajib diisi.')

  const email = optStr(b.email)
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push('Email tidak valid.')

  const avatarColor = b.avatarColor ? String(b.avatarColor) : '#5C6E21'
  if (!HEX.test(avatarColor)) errors.push('Warna avatar harus berformat #RRGGBB.')

  return {
    errors,
    data: { name, role, email, avatarColor, active: b.active === undefined ? true : Boolean(b.active) },
  }
}

// GET /api/members — daftar anggota + proyek yang ditangani & jumlah fitur terbuka.
router.get('/', async (_req, res) => {
  try {
    const members = await prisma.member.findMany({
      relationLoadStrategy: 'join',
      include: {
        assignments: { include: { project: { select: { id: true, name: true, icon: true, status: true } } } },
        features: { where: { status: { not: 'done' } }, select: { id: true } },
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    })
    res.json(
      members.map(({ assignments, features, ...m }) => ({
        ...m,
        projects: assignments.map((a) => ({ ...a.project, role: a.role, contribution: a.contribution })),
        openFeatures: features.length,
      })),
    )
  } catch (err) {
    console.error('Get members error:', err)
    res.status(500).json({ message: 'Gagal mengambil data anggota.' })
  }
})

router.post('/', async (req, res) => {
  const { errors, data } = parseMemberInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  try {
    res.status(201).json(await prisma.member.create({ data }))
  } catch (err) {
    console.error('Create member error:', err)
    res.status(500).json({ message: 'Gagal menambah anggota.' })
  }
})

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })
  const { errors, data } = parseMemberInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  try {
    res.json(await prisma.member.update({ where: { id }, data }))
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Anggota tidak ditemukan.' })
    console.error('Update member error:', err)
    res.status(500).json({ message: 'Gagal memperbarui anggota.' })
  }
})

// DELETE — penugasan ikut terhapus; fitur yang ditugaskan jadi tanpa penanggung jawab.
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })
  try {
    await prisma.member.delete({ where: { id } })
    res.json({ message: 'Anggota berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Anggota tidak ditemukan.' })
    console.error('Delete member error:', err)
    res.status(500).json({ message: 'Gagal menghapus anggota.' })
  }
})

export default router
