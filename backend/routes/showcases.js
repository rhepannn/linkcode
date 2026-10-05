import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { removeByUrls } from '../lib/storage.js'

const prisma = new PrismaClient()
const router = Router()

const VALID_SECTORS = ['industri', 'lingkungan', 'pemerintahan', 'platform', 'bisnis']
const MEDIA_FIELDS = ['thumbnailUrl', 'previewUrl', 'videoUrl']
const ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }]

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(v)
// Media boleh berupa path lokal ("/showcases/x.jpg") atau URL penuh.
const isMediaUrl = (v) => v.startsWith('/') || isHttpUrl(v)

// Bersihkan & validasi payload showcase dari request body.
function parseShowcaseInput(body) {
  const b = body || {}
  const errors = []

  const title = String(b.title || '').trim()
  const description = String(b.description || '').trim()
  const url = String(b.url || '').trim()
  const slug = slugify(b.slug || title)

  if (!title) errors.push('Judul wajib diisi.')
  if (!description) errors.push('Deskripsi wajib diisi.')
  if (!isHttpUrl(url)) errors.push('URL harus diawali http:// atau https://.')
  if (!VALID_SECTORS.includes(b.sector)) errors.push('Sektor tidak valid.')
  if (!slug) errors.push('Slug tidak valid.')

  const media = {}
  for (const key of ['thumbnailUrl', 'previewUrl', 'videoUrl']) {
    const v = String(b[key] || '').trim()
    if (v && !isMediaUrl(v)) errors.push(`${key} tidak valid.`)
    media[key] = v || null
  }

  const yearNum = Number(b.year)
  const year = b.year === '' || b.year == null ? null : Number.isInteger(yearNum) ? yearNum : NaN
  if (Number.isNaN(year)) errors.push('Tahun tidak valid.')

  const techStack = Array.isArray(b.techStack)
    ? b.techStack.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
    : []

  return {
    errors,
    data: {
      slug,
      title,
      url,
      sector: b.sector,
      description,
      year,
      techStack,
      ...media,
      featured: Boolean(b.featured),
      embeddable: Boolean(b.embeddable),
      published: b.published === undefined ? true : Boolean(b.published),
      sortOrder: Number.isInteger(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
    },
  }
}

// GET /api/showcases — publik. Hanya karya yang published.
router.get('/', async (_req, res) => {
  try {
    const items = await prisma.showcase.findMany({ where: { published: true }, orderBy: ORDER })
    res.json(items)
  } catch (err) {
    console.error('Get showcases error:', err)
    res.status(500).json({ message: 'Gagal mengambil data portofolio.' })
  }
})

// GET /api/showcases/all — [AUTH] semua karya termasuk yang disembunyikan.
router.get('/all', authMiddleware, async (_req, res) => {
  try {
    res.json(await prisma.showcase.findMany({ orderBy: ORDER }))
  } catch (err) {
    console.error('Get all showcases error:', err)
    res.status(500).json({ message: 'Gagal mengambil data portofolio.' })
  }
})

// POST /api/showcases — [AUTH]
router.post('/', authMiddleware, async (req, res) => {
  const { errors, data } = parseShowcaseInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    res.status(201).json(await prisma.showcase.create({ data }))
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Slug sudah dipakai.' })
    console.error('Create showcase error:', err)
    res.status(500).json({ message: 'Gagal membuat karya.' })
  }
})

// PUT /api/showcases/:id — [AUTH]
router.put('/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' })

  const { errors, data } = parseShowcaseInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    const before = await prisma.showcase.findUnique({ where: { id } })
    const updated = await prisma.showcase.update({ where: { id }, data })
    // Media yang diganti/dikosongkan dibuang dari Storage (hanya objek milik bucket kita; best-effort).
    if (before) {
      const replaced = MEDIA_FIELDS.filter((f) => before[f] && before[f] !== updated[f]).map((f) => before[f])
      if (replaced.length) removeByUrls(replaced).catch(() => {})
    }
    res.json(updated)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Karya tidak ditemukan.' })
    if (err.code === 'P2002') return res.status(409).json({ message: 'Slug sudah dipakai.' })
    console.error('Update showcase error:', err)
    res.status(500).json({ message: 'Gagal memperbarui karya.' })
  }
})

// DELETE /api/showcases/:id — [AUTH]
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID tidak valid.' })

  try {
    const before = await prisma.showcase.findUnique({ where: { id } })
    await prisma.showcase.delete({ where: { id } })
    if (before) removeByUrls(MEDIA_FIELDS.map((f) => before[f]).filter(Boolean)).catch(() => {})
    res.json({ message: 'Karya berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Karya tidak ditemukan.' })
    console.error('Delete showcase error:', err)
    res.status(500).json({ message: 'Gagal menghapus karya.' })
  }
})

export default router
