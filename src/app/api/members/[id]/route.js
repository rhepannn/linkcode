import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseId } from '@/lib/util'
import { parseMemberInput } from '@/lib/parsers'

// PUT /api/members/:id — [AUTH]
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseMemberInput(body)
  if (errors.length) return fail(errors.join(' '), 400)
  try {
    return json(await prisma.member.update({ where: { id }, data }))
  } catch (err) {
    if (err.code === 'P2025') return fail('Anggota tidak ditemukan.', 404)
    console.error('Update member error:', err)
    return fail('Gagal memperbarui anggota.', 500)
  }
}

// DELETE /api/members/:id — [AUTH] penugasan ikut terhapus; fitur yang ditugaskan jadi tanpa PJ.
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  try {
    await prisma.member.delete({ where: { id } })
    return json({ message: 'Anggota berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') return fail('Anggota tidak ditemukan.', 404)
    console.error('Delete member error:', err)
    return fail('Gagal menghapus anggota.', 500)
  }
}
