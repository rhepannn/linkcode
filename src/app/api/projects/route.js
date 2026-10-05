import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseProjectInput, parseTeam } from '@/lib/parsers'
import { getPublicProjects } from '@/lib/queries'
import { serializeTeam } from '@/lib/tracking'

// GET /api/projects — publik. Hanya field aman (tanpa klien/link/catatan internal).
export async function GET() {
  try {
    return json(await getPublicProjects())
  } catch (err) {
    console.error('Get projects error:', err)
    return fail('Gagal mengambil data project.', 500)
  }
}

// POST /api/projects — [AUTH] buat project (tim opsional).
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseProjectInput(body)
  let team = []
  if (body.team !== undefined) {
    const parsed = parseTeam(body.team)
    errors.push(...parsed.errors)
    team = parsed.team
  }
  if (errors.length) return fail(errors.join(' '), 400)

  try {
    const project = await prisma.project.create({
      data: { ...data, team: { create: team } },
      include: { team: { include: { member: true } } },
    })
    revalidatePath('/')
    return json({ ...project, team: serializeTeam(project.team) }, 201)
  } catch (err) {
    if (err.code === 'P2003') return fail('Ada anggota tim yang tidak ditemukan.', 400)
    console.error('Create project error:', err)
    return fail('Gagal membuat project.', 500)
  }
}
