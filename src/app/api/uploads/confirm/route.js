import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import {
  MEDIA_KINDS,
  extFor,
  inspectObject,
  parseObjectPath,
  publicUrlFor,
  removeObject,
  sniffMime,
  storageConfigured,
} from '@/lib/storage'

// POST /api/uploads/confirm — [AUTH] { path }
// Dipanggil setelah browser selesai PUT ke signed URL. Server memeriksa ISI berkas (magic bytes) dan
// ukurannya; berkas yang tidak sesuai dihapus saat itu juga, jadi bucket tidak menampung sampah.
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  if (!storageConfigured()) return fail('Penyimpanan belum dikonfigurasi.', 503)
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const parsed = parseObjectPath(body.path)
  if (!parsed) return fail('Path berkas tidak valid.', 400)
  const spec = MEDIA_KINDS[parsed.kind]

  try {
    const info = await inspectObject(body.path)
    if (!info.exists) return fail('Berkas belum terunggah.', 404)

    if (info.size > spec.maxBytes) {
      await removeObject(body.path)
      return fail(`Ukuran maksimal ${Math.round(spec.maxBytes / 1024 / 1024)} MB untuk jenis media ini.`, 413)
    }
    const mime = sniffMime(info.head)
    if (!mime || !spec.types.includes(mime) || extFor(mime) !== parsed.ext) {
      await removeObject(body.path)
      return fail(`Jenis berkas tidak didukung. Gunakan: ${spec.types.map((t) => t.split('/')[1]).join(', ')}.`, 415)
    }
    return json({ url: publicUrlFor(body.path), size: info.size, contentType: mime }, 201)
  } catch (err) {
    console.error('Confirm upload error:', err)
    return fail('Gagal memeriksa unggahan. Coba lagi.', 502)
  }
}
