import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, readJson } from '@/lib/http'
import { parseFeatureInput } from '@/lib/parsers'
import { parseId } from '@/lib/util'
import { dbError, featureResponse } from '@/lib/feature-response'

// POST /api/projects/:id/features — [AUTH] { title, description?, status?, assigneeId?, dueDate?, subtasks?: string[] }
export async function POST(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const projectId = parseId((await params).id)
  if (!projectId) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseFeatureInput(body)
  if (errors.length) return fail(errors.join(' '), 400)

  const subtasks = Array.isArray(body.subtasks)
    ? body.subtasks.map((t) => String(t).trim()).filter(Boolean).slice(0, 50)
    : []

  try {
    const last = await prisma.feature.aggregate({ where: { projectId }, _max: { sortOrder: true } })
    const created = await prisma.feature.create({
      data: {
        ...data,
        projectId,
        sortOrder: data.sortOrder ?? (last._max.sortOrder ?? -1) + 1,
        completedAt: data.status === 'done' ? new Date() : null,
        subtasks: { create: subtasks.map((title, i) => ({ title, sortOrder: i })) },
      },
    })
    return featureResponse(created.id, projectId, 201)
  } catch (err) {
    return dbError(err, 'Gagal membuat fitur.')
  }
}
