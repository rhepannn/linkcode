import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseFeatureInput } from '@/lib/parsers'
import { parseId } from '@/lib/util'
import { syncProjectProgress } from '@/lib/tracking'
import { dbError, featureResponse } from '@/lib/feature-response'

// PUT /api/features/:id — [AUTH] ubah sebagian field fitur.
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseFeatureInput(body, { partial: true })
  if (errors.length) return fail(errors.join(' '), 400)

  try {
    const current = await prisma.feature.findUnique({ where: { id } })
    if (!current) return fail('Fitur tidak ditemukan.', 404)

    if (data.status && data.status !== current.status) {
      data.completedAt = data.status === 'done' ? new Date() : null
    }
    await prisma.feature.update({ where: { id }, data })
    return featureResponse(id, current.projectId)
  } catch (err) {
    return dbError(err, 'Gagal memperbarui fitur.')
  }
}

// DELETE /api/features/:id — [AUTH]
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)

  try {
    const current = await prisma.feature.findUnique({ where: { id } })
    if (!current) return fail('Fitur tidak ditemukan.', 404)
    await prisma.feature.delete({ where: { id } })
    const percentage = await syncProjectProgress(current.projectId)
    revalidatePath('/')
    return json({ message: 'Fitur berhasil dihapus.', percentage })
  } catch (err) {
    return dbError(err, 'Gagal menghapus fitur.')
  }
}
