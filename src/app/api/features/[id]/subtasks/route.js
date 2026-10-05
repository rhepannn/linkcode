import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, readJson } from '@/lib/http'
import { parseId } from '@/lib/util'
import { dbError, featureResponse } from '@/lib/feature-response'

// POST /api/features/:id/subtasks — [AUTH] { title }
export async function POST(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()
  const title = String(body.title || '').trim()
  if (!title) return fail('Judul sub-tugas wajib diisi.', 400)

  try {
    const feature = await prisma.feature.findUnique({ where: { id } })
    if (!feature) return fail('Fitur tidak ditemukan.', 404)
    const last = await prisma.subtask.aggregate({ where: { featureId: id }, _max: { sortOrder: true } })
    await prisma.subtask.create({ data: { featureId: id, title, sortOrder: (last._max.sortOrder ?? -1) + 1 } })
    return featureResponse(id, feature.projectId, 201)
  } catch (err) {
    return dbError(err, 'Gagal menambah sub-tugas.')
  }
}
