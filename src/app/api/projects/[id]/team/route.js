import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseTeam } from '@/lib/parsers'
import { parseId } from '@/lib/util'
import { serializeTeam } from '@/lib/tracking'

// PUT /api/projects/:id/team — [AUTH] ganti seluruh susunan tim project.
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, team } = parseTeam(body.team)
  if (errors.length) return fail(errors.join(' '), 400)

  try {
    await prisma.$transaction([
      prisma.projectMember.deleteMany({ where: { projectId: id } }),
      prisma.projectMember.createMany({ data: team.map((t) => ({ ...t, projectId: id })) }),
    ])
    const rows = await prisma.projectMember.findMany({ where: { projectId: id }, include: { member: true } })
    revalidatePath('/') // PIC tampil di kartu publik
    return json(serializeTeam(rows))
  } catch (err) {
    if (err.code === 'P2003') return fail('Project atau anggota tidak ditemukan.', 400)
    console.error('Update team error:', err)
    return fail('Gagal menyimpan tim.', 500)
  }
}
