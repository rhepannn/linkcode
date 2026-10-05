import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseId } from '@/lib/util'
import { dbError } from '@/lib/feature-response'

const SEVERITIES = ['low', 'medium', 'high']

// POST /api/projects/:id/blockers — [AUTH] { title, detail?, severity? }
export async function POST(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const projectId = parseId((await params).id)
  if (!projectId) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const title = String(body.title || '').trim()
  if (!title) return fail('Judul kendala wajib diisi.', 400)
  const severity = body.severity ?? 'medium'
  if (!SEVERITIES.includes(severity)) return fail('Tingkat keparahan tidak valid.', 400)

  try {
    const blocker = await prisma.blocker.create({
      data: { projectId, title, detail: String(body.detail || '').trim(), severity },
    })
    return json(blocker, 201)
  } catch (err) {
    if (err.code === 'P2003') return fail('Project tidak ditemukan.', 404)
    return dbError(err, 'Gagal menyimpan kendala.')
  }
}
