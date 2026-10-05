import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { parseShowcaseInput } from '@/lib/parsers'
import { parseId } from '@/lib/util'
import { removeByUrls } from '@/lib/storage'
import { revalidateShowcases } from '@/lib/revalidate'

const MEDIA_FIELDS = ['thumbnailUrl', 'previewUrl', 'videoUrl']

// PUT /api/showcases/:id — [AUTH] replace penuh.
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { errors, data } = parseShowcaseInput(body)
  if (errors.length) return fail(errors.join(' '), 400)

  try {
    const before = await prisma.showcase.findUnique({ where: { id } })
    const updated = await prisma.showcase.update({ where: { id }, data })
    // Media yang diganti/dikosongkan dibuang dari Storage (hanya objek milik bucket kita; best-effort).
    if (before) {
      const replaced = MEDIA_FIELDS.filter((f) => before[f] && before[f] !== updated[f]).map((f) => before[f])
      if (replaced.length) await removeByUrls(replaced).catch(() => {})
    }
    revalidateShowcases()
    return json(updated)
  } catch (err) {
    if (err.code === 'P2025') return fail('Karya tidak ditemukan.', 404)
    if (err.code === 'P2002') return fail('Slug sudah dipakai.', 409)
    console.error('Update showcase error:', err)
    return fail('Gagal memperbarui karya.', 500)
  }
}

// DELETE /api/showcases/:id — [AUTH]
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return fail('ID tidak valid.', 400)

  try {
    const before = await prisma.showcase.findUnique({ where: { id } })
    await prisma.showcase.delete({ where: { id } })
    if (before) await removeByUrls(MEDIA_FIELDS.map((f) => before[f]).filter(Boolean)).catch(() => {})
    revalidateShowcases()
    return json({ message: 'Karya berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') return fail('Karya tidak ditemukan.', 404)
    console.error('Delete showcase error:', err)
    return fail('Gagal menghapus karya.', 500)
  }
}
