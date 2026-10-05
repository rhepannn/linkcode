import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'
import { MEDIA_KINDS, createSignedUpload, extFor, publicUrlFor, randomObjectPath, storageConfigured } from '@/lib/storage'

const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/
const MB = (n) => Math.round(n / 1024 / 1024)

// POST /api/uploads/sign — [AUTH] { slug, kind, contentType, size } → { path, signedUrl, publicUrl }
// Browser lalu PUT berkas langsung ke signedUrl, kemudian memanggil /api/uploads/confirm.
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  if (!storageConfigured()) {
    return fail('Penyimpanan belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local lalu restart server.', 503)
  }
  const body = await readJson(request)
  if (body === null) return invalidJson()

  const { slug, kind, contentType } = body
  const size = Number(body.size)
  const spec = MEDIA_KINDS[kind]

  if (!spec) return fail('Jenis media tidak valid.', 400)
  if (!SLUG.test(String(slug || ''))) return fail('Slug karya tidak valid. Isi judul/slug terlebih dahulu.', 400)
  if (!spec.types.includes(contentType) || !extFor(contentType)) {
    return fail(`Jenis berkas tidak didukung. Gunakan: ${spec.types.map((t) => t.split('/')[1]).join(', ')}.`, 415)
  }
  if (!Number.isFinite(size) || size <= 0) return fail('Ukuran berkas tidak valid.', 400)
  if (size > spec.maxBytes) return fail(`Ukuran maksimal ${MB(spec.maxBytes)} MB untuk jenis media ini.`, 413)

  try {
    const path = randomObjectPath(slug, kind, contentType)
    const { signedUrl } = await createSignedUpload(path)
    return json({ path, signedUrl, publicUrl: publicUrlFor(path) }, 201)
  } catch (err) {
    console.error('Sign upload error:', err)
    return fail('Gagal menyiapkan unggahan. Coba lagi.', 502)
  }
}
