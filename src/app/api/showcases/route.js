import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseShowcaseInput } from '@/lib/parsers'
import { getPublicShowcases } from '@/lib/queries'
import { revalidateShowcases } from '@/lib/revalidate'

// GET /api/showcases — publik. Hanya karya yang published.
export async function GET() {
  try {
    return json(await getPublicShowcases())
  } catch (err) {
    console.error('Get showcases error:', err)
    return fail('Gagal mengambil data portofolio.', 500)
  }
}

// POST /api/showcases — [AUTH]
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseShowcaseInput(body)
  if (errors.length) return fail(errors.join(' '), 400)

  try {
    const created = await prisma.showcase.create({ data })
    revalidateShowcases()
    return json(created, 201)
  } catch (err) {
    if (err.code === 'P2002') return fail('Slug sudah dipakai.', 409)
    console.error('Create showcase error:', err)
    return fail('Gagal membuat karya.', 500)
  }
}
