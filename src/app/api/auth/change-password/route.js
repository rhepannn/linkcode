import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'

// POST /api/auth/change-password — [AUTH] ganti password admin yang login.
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const body = await readJson(request)
  if (body === null) return invalidJson()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) return fail('Password lama & baru wajib diisi.', 400)
  if (String(newPassword).length < 6) return fail('Password baru minimal 6 karakter.', 400)

  try {
    const admin = await prisma.admin.findUnique({ where: { id: auth.admin.id } })
    if (!admin) return fail('Admin tidak ditemukan.', 404)

    const ok = await bcrypt.compare(String(currentPassword), admin.passwordHash)
    if (!ok) return fail('Password lama salah.', 401)

    const passwordHash = await bcrypt.hash(String(newPassword), 10)
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } })
    return json({ message: 'Password berhasil diubah.' })
  } catch (err) {
    console.error('Change password error:', err)
    return fail('Terjadi kesalahan server.', 500)
  }
}
