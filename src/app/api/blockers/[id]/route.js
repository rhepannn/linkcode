import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseId } from '@/lib/util'
import { dbError } from '@/lib/feature-response'

const SEVERITIES = ['low', 'medium', 'high']
const BLOCKER_STATUS = ['open', 'resolved']

// PUT /api/blockers/:id — [AUTH] { title?, detail?, severity?, status? }
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const b = await readJson(request)
  if (b === null) return invalidJson()

  const data = {}
  if (b.title !== undefined) {
    const title = String(b.title).trim()
    if (!title) return fail('Judul kendala wajib diisi.', 400)
    data.title = title
  }
  if (b.detail !== undefined) data.detail = String(b.detail).trim()
  if (b.severity !== undefined) {
    if (!SEVERITIES.includes(b.severity)) return fail('Tingkat keparahan tidak valid.', 400)
    data.severity = b.severity
  }
  if (b.status !== undefined) {
    if (!BLOCKER_STATUS.includes(b.status)) return fail('Status kendala tidak valid.', 400)
    data.status = b.status
    data.resolvedAt = b.status === 'resolved' ? new Date() : null
  }

  try {
    return json(await prisma.blocker.update({ where: { id }, data }))
  } catch (err) {
    return dbError(err, 'Gagal memperbarui kendala.')
  }
}

// DELETE /api/blockers/:id — [AUTH]
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  try {
    await prisma.blocker.delete({ where: { id } })
    return json({ message: 'Kendala berhasil dihapus.' })
  } catch (err) {
    return dbError(err, 'Gagal menghapus kendala.')
  }
}
