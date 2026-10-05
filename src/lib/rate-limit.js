import { prisma } from './prisma.js'

// Pembatas laju berbasis database (jendela tetap). Memori proses tidak bisa dipakai di serverless
// karena tiap fungsi punya memori sendiri; tabel LoginAttempt dibagi oleh semua instance.
export async function rateLimit(key, { max, windowMs }) {
  const since = new Date(Date.now() - windowMs)

  // Bersihkan baris lama sesekali agar tabel tidak membengkak.
  if (Math.random() < 0.05) {
    prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 3600_000) } } }).catch(() => {})
  }

  const count = await prisma.loginAttempt.count({ where: { key, createdAt: { gte: since } } })
  if (count >= max) {
    const oldest = await prisma.loginAttempt.findFirst({
      where: { key, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })
    const retryAfter = Math.max(1, Math.ceil((oldest.createdAt.getTime() + windowMs - Date.now()) / 1000))
    return { limited: true, retryAfter }
  }
  await prisma.loginAttempt.create({ data: { key } })
  return { limited: false, remaining: max - count - 1 }
}
