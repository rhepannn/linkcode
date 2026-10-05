import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseProjectInput } from '@/lib/parsers'
import { parseId } from '@/lib/util'
import { computeHealth, featureInclude, projectProgressFrom, serializeFeature, serializeTeam } from '@/lib/tracking'

// GET /api/projects/:id — [AUTH] detail lengkap satu project.
export async function GET(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)

  try {
    const p = await prisma.project.findUnique({
      where: { id },
      relationLoadStrategy: 'join',
      include: {
        team: { include: { member: true } },
        features: { include: featureInclude, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        updates: { orderBy: { createdAt: 'desc' } },
        blockers: { orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] },
      },
    })
    if (!p) return fail('Project tidak ditemukan.', 404)

    const { team, features, ...rest } = p
    const open = p.blockers.filter((b) => b.status === 'open')
    return json({
      ...rest,
      health: computeHealth(p, open),
      autoProgress: projectProgressFrom(features) !== null,
      team: serializeTeam(team),
      features: features.map(serializeFeature),
    })
  } catch (err) {
    console.error('Get project error:', err)
    return fail('Gagal mengambil detail project.', 500)
  }
}

// PUT /api/projects/:id — [AUTH] ubah data dasar. Tim tidak disentuh (lihat /:id/team).
// Persen manual diabaikan jika project sudah punya fitur (dihitung otomatis).
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseProjectInput(body)
  if (errors.length) return fail(errors.join(' '), 400)

  try {
    const featureCount = await prisma.feature.count({ where: { projectId: id } })
    if (featureCount > 0) delete data.percentage

    const project = await prisma.project.update({ where: { id }, data })
    revalidatePath('/')
    return json(project)
  } catch (err) {
    if (err.code === 'P2025') return fail('Project tidak ditemukan.', 404)
    console.error('Update project error:', err)
    return fail('Gagal memperbarui project.', 500)
  }
}

// DELETE /api/projects/:id — [AUTH] hapus project (fitur, tim, catatan, kendala ikut terhapus).
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)

  try {
    await prisma.project.delete({ where: { id } })
    revalidatePath('/')
    return json({ message: 'Project berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') return fail('Project tidak ditemukan.', 404)
    console.error('Delete project error:', err)
    return fail('Gagal menghapus project.', 500)
  }
}
