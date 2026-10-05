import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, json } from '@/lib/http'
import { parseId } from '@/lib/util'
import { dbError } from '@/lib/feature-response'

// DELETE /api/updates/:id — [AUTH]
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  try {
    await prisma.projectUpdate.delete({ where: { id } })
    return json({ message: 'Catatan berhasil dihapus.' })
  } catch (err) {
    return dbError(err, 'Gagal menghapus catatan.')
  }
}
