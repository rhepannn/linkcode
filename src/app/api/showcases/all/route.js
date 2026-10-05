import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, json } from '@/lib/http'

// GET /api/showcases/all — [AUTH] semua karya termasuk yang disembunyikan.
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  try {
    return json(await prisma.showcase.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }))
  } catch (err) {
    console.error('Get all showcases error:', err)
    return fail('Gagal mengambil data portofolio.', 500)
  }
}
