import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseId } from '@/lib/util'
import { dbError } from '@/lib/feature-response'

// POST /api/projects/:id/updates — [AUTH] { note }
export async function POST(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const projectId = parseId((await params).id)
  if (!projectId) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const note = String(body.note || '').trim()
  if (!note) return fail('Isi catatan wajib diisi.', 400)
  if (note.length > 2000) return fail('Catatan maksimal 2000 karakter.', 400)

  try {
    const update = await prisma.projectUpdate.create({
      data: { projectId, note, author: auth.admin.username || 'admin' },
    })
    // Catatan baru dianggap aktivitas project → perbarui updatedAt.
    await prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } })
    return json(update, 201)
  } catch (err) {
    if (err.code === 'P2003') return fail('Project tidak ditemukan.', 404)
    return dbError(err, 'Gagal menyimpan catatan.')
  }
}
