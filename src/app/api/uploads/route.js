import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { pathFromUrl, removeByUrls, storageConfigured } from '@/lib/storage'

// DELETE /api/uploads { url } — [AUTH] buang unggahan yang batal dipakai (mis. form ditutup tanpa menyimpan).
// Hanya objek milik bucket kita yang belum dipakai karya mana pun.
export async function DELETE(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  if (!storageConfigured()) return fail('Penyimpanan belum dikonfigurasi.', 503)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const url = String(body.url || '')
  if (!pathFromUrl(url)) return fail('URL bukan milik penyimpanan ini.', 400)

  try {
    const used = await prisma.showcase.count({
      where: { OR: [{ thumbnailUrl: url }, { previewUrl: url }, { videoUrl: url }] },
    })
    if (used > 0) return fail('Berkas masih dipakai oleh sebuah karya.', 409)
    return json({ removed: await removeByUrls([url]) })
  } catch (err) {
    console.error('Delete upload error:', err)
    return fail('Gagal menghapus berkas.', 500)
  }
}
