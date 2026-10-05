import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, readJson } from '@/lib/http'
import { parseId } from '@/lib/util'
import { dbError, featureResponse } from '@/lib/feature-response'

// PUT /api/subtasks/:id — [AUTH] { title?, done? }
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const data = {}
  if (body.title !== undefined) {
    const title = String(body.title).trim()
    if (!title) return fail('Judul sub-tugas wajib diisi.', 400)
    data.title = title
  }
  if (body.done !== undefined) data.done = Boolean(body.done)

  try {
    const sub = await prisma.subtask.update({ where: { id }, data, include: { feature: true } })
    return featureResponse(sub.featureId, sub.feature.projectId)
  } catch (err) {
    return dbError(err, 'Gagal memperbarui sub-tugas.')
  }
}

// DELETE /api/subtasks/:id — [AUTH]
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)

  try {
    const sub = await prisma.subtask.delete({ where: { id }, include: { feature: true } })
    return featureResponse(sub.featureId, sub.feature.projectId)
  } catch (err) {
    return dbError(err, 'Gagal menghapus sub-tugas.')
  }
}
