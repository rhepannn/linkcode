import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseMemberInput } from '@/lib/parsers'

// GET /api/members — [AUTH] anggota + proyek yang ditangani & jumlah fitur terbuka.
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  try {
    const members = await prisma.member.findMany({
      relationLoadStrategy: 'join',
      include: {
        assignments: { include: { project: { select: { id: true, name: true, icon: true, status: true } } } },
        features: { where: { status: { not: 'done' } }, select: { id: true } },
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    })
    return json(
      members.map(({ assignments, features, ...m }) => ({
        ...m,
        projects: assignments.map((a) => ({ ...a.project, role: a.role, contribution: a.contribution })),
        openFeatures: features.length,
      })),
    )
  } catch (err) {
    console.error('Get members error:', err)
    return fail('Gagal mengambil data anggota.', 500)
  }
}

// POST /api/members — [AUTH]
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseMemberInput(body)
  if (errors.length) return fail(errors.join(' '), 400)
  try {
    return json(await prisma.member.create({ data }), 201)
  } catch (err) {
    console.error('Create member error:', err)
    return fail('Gagal menambah anggota.', 500)
  }
}
