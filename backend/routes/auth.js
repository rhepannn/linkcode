import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = Router()

// Rate limit: maksimal 5 percobaan login per menit per IP.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' },
})

// POST /api/auth/login → { token, username }
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' })
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { username } })

    // Pesan error sengaja generik agar tidak membocorkan validitas username.
    if (!admin) {
      return res.status(401).json({ message: 'Username atau password salah.' })
    }

    const ok = await bcrypt.compare(password, admin.passwordHash)
    if (!ok) {
      return res.status(401).json({ message: 'Username atau password salah.' })
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    )

    return res.json({ token, username: admin.username })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

// POST /api/auth/change-password — [AUTH] ganti password admin yang login
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Password lama & baru wajib diisi.' })
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter.' })
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } })
    if (!admin) return res.status(404).json({ message: 'Admin tidak ditemukan.' })

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Password lama salah.' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } })

    return res.json({ message: 'Password berhasil diubah.' })
  } catch (err) {
    console.error('Change password error:', err)
    return res.status(500).json({ message: 'Terjadi kesalahan server.' })
  }
})

export default router
