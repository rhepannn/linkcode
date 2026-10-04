import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = Router()

// Kunci setting yang boleh dibaca publik & diedit dari admin.
const ALLOWED_KEYS = ['whatsappNumber']

async function readSettings() {
  const rows = await prisma.setting.findMany({ where: { key: { in: ALLOWED_KEYS } } })
  const out = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

// GET /api/settings — publik
router.get('/', async (_req, res) => {
  try {
    res.json(await readSettings())
  } catch (err) {
    console.error('Get settings error:', err)
    res.status(500).json({ message: 'Gagal mengambil pengaturan.' })
  }
})

// PUT /api/settings — [AUTH] upsert beberapa setting sekaligus
router.put('/', authMiddleware, async (req, res) => {
  const body = req.body || {}
  try {
    const entries = Object.entries(body).filter(([k]) => ALLOWED_KEYS.includes(k))
    for (const [key, value] of entries) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value).trim() },
        create: { key, value: String(value).trim() },
      })
    }
    res.json(await readSettings())
  } catch (err) {
    console.error('Update settings error:', err)
    res.status(500).json({ message: 'Gagal menyimpan pengaturan.' })
  }
})

export default router
