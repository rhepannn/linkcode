import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signSession, COOKIE_NAME, cookieOptions } from '@/lib/auth'
import { clientIp, fail, invalidJson, readJson } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'

// Hash valid yang dibuat sekali per instance: membandingkan password dengan ini saat username tidak ada
// membuat waktu respons tidak membedakan "username tidak ada" dari "password salah".
const DUMMY_HASH = bcrypt.hashSync('tidak-dipakai', 10)

// POST /api/auth/login → { username } + cookie sesi httpOnly. Maksimal 5 percobaan/menit per IP.
export async function POST(request) {
  const limit = await rateLimit(`login:${clientIp(request)}`, { max: 5, windowMs: 60_000 })
  if (limit.limited) {
    const res = fail('Terlalu banyak percobaan login. Coba lagi dalam 1 menit.', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const body = await readJson(request)
  if (body === null) return invalidJson()
  const { username, password } = body
  if (!username || !password) return fail('Username dan password wajib diisi.', 400)

  try {
    const admin = await prisma.admin.findUnique({ where: { username: String(username) } })
    const ok = await bcrypt.compare(String(password), admin?.passwordHash ?? DUMMY_HASH)
    // Pesan generik: tidak membocorkan validitas username.
    if (!admin || !ok) return fail('Username atau password salah.', 401)

    const token = await signSession({ id: admin.id, username: admin.username })
    const res = NextResponse.json({ username: admin.username })
    res.cookies.set(COOKIE_NAME, token, cookieOptions())
    return res
  } catch (err) {
    console.error('Login error:', err)
    return fail('Terjadi kesalahan server.', 500)
  }
}
