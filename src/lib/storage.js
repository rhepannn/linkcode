import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import { StorageClient } from '@supabase/storage-js'

// Supabase Storage untuk media portofolio (bucket publik). Memakai service role key,
// jadi HANYA boleh dipakai di backend — jangan pernah dikirim ke browser.

export const BUCKET = process.env.SUPABASE_BUCKET || 'showcases'

export const storageConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

// StorageClient dipakai langsung (bukan supabase-js penuh): supabase-js ikut memuat modul realtime yang
// butuh WebSocket bawaan dan gagal dibuat di Node < 22.
let client
function sb() {
  if (!storageConfigured()) {
    throw new Error('Storage belum dikonfigurasi: isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local.')
  }
  if (!client) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const base = process.env.SUPABASE_URL.replace(/\/$/, '')
    client = { storage: new StorageClient(`${base}/storage/v1`, { apikey: key, Authorization: `Bearer ${key}` }) }
  }
  return client
}

// Jenis media yang diizinkan per `kind`, beserta batas ukurannya.
export const MEDIA_KINDS = {
  thumbnail: { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 8 * 1024 * 1024 },
  preview: { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 12 * 1024 * 1024 },
  video: { types: ['video/webm', 'video/mp4'], maxBytes: 25 * 1024 * 1024 },
}
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(MEDIA_KINDS).map((k) => k.maxBytes))

const EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
}
export const extFor = (mime) => EXT[mime]

// Deteksi jenis file dari isinya (magic bytes), bukan dari nama/header klien yang bisa dipalsukan.
export function sniffMime(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm'
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') return 'video/mp4'
  return null
}

// Nama objek unik berbasis isi (hash) → upload ulang file yang sama tidak membuat duplikat,
// dan URL baru selalu berbeda saat isinya berubah (tidak terjebak cache CDN).
export function objectPath(slug, kind, buffer, mime) {
  const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 10)
  return `${slug}/${kind}-${hash}.${EXT[mime]}`
}

const publicPrefix = () => `${process.env.SUPABASE_URL?.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`

export const publicUrlFor = (objPath) => sb().storage.from(BUCKET).getPublicUrl(objPath).data.publicUrl

// URL publik bucket kita → path objek; selain itu (path lokal, URL luar) → null.
export function pathFromUrl(url) {
  if (!url || !storageConfigured()) return null
  const prefix = publicPrefix()
  if (!String(url).startsWith(prefix)) return null
  try {
    return decodeURIComponent(String(url).slice(prefix.length).split('?')[0])
  } catch {
    return null
  }
}

// Buat bucket publik jika belum ada.
export async function ensureBucket() {
  const { data } = await sb().storage.getBucket(BUCKET)
  if (data) return { created: false }
  const { error } = await sb().storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: Object.keys(EXT),
  })
  if (error) throw new Error(`Gagal membuat bucket "${BUCKET}": ${error.message}`)
  return { created: true }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Jalankan `fn` dengan percobaan ulang bertahap (jaringan lambat/putus sesaat).
export async function withRetry(fn, { tries = 4, baseMs = 2000, label = 'operasi' } = {}) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < tries - 1) await sleep(baseMs * (i + 1))
    }
  }
  throw new Error(`${label} gagal setelah ${tries} percobaan: ${lastErr?.message ?? lastErr}`)
}

export async function objectExists(objPath) {
  try {
    const { data } = await withRetry(
      async () => {
        const res = await sb().storage.from(BUCKET).exists(objPath)
        if (res.error) throw new Error(res.error.message)
        return res
      },
      { tries: 3, label: 'Cek objek' },
    )
    return data === true
  } catch {
    return false // tidak bisa memastikan → anggap belum ada, unggah (upsert aman karena nama berbasis hash)
  }
}

// Unggah ke bucket. Nama objek berbasis hash, jadi bila objeknya sudah ada isinya pasti sama
// dan unggahan dilewati (hemat bandwidth saat dijalankan ulang).
export async function uploadBuffer(objPath, buffer, contentType) {
  const bucket = sb().storage.from(BUCKET)
  // exists() mengembalikan { data: boolean, error } — BUKAN boolean. Hanya `data === true` yang berarti ada.
  const exists = await objectExists(objPath)
  if (!exists) {
    await withRetry(
      async () => {
        const { error } = await bucket.upload(objPath, buffer, {
          contentType,
          upsert: true,
          cacheControl: '31536000', // nama berbasis hash → aman di-cache setahun
        })
        if (error) throw new Error(error.message)
      },
      { tries: 4, label: 'Upload' },
    )
  }
  return publicUrlFor(objPath)
}

// ---- Unggah langsung dari browser (signed URL) --------------------------------------------------
// Alur: server `createSignedUpload` → browser PUT berkas langsung ke Supabase (tanpa lewat fungsi
// serverless, jadi tidak terkena batas body ±4,5 MB) → server `inspectObject` memeriksa isinya.

const OBJECT_PATH = /^([a-z0-9][a-z0-9-]{0,59})\/(thumbnail|preview|video)-([a-f0-9]{10})\.(jpg|png|webp|webm|mp4)$/

// "slug/kind-abc123def4.jpg" → { slug, kind, ext } atau null bila bentuknya tidak dikenal.
export function parseObjectPath(objPath) {
  const m = OBJECT_PATH.exec(String(objPath || ''))
  return m ? { slug: m[1], kind: m[2], ext: m[4] } : null
}

// Nama acak (bukan hash isi) karena isi berkas belum diketahui server saat membuat signed URL.
export function randomObjectPath(slug, kind, mime) {
  return `${slug}/${kind}-${crypto.randomBytes(5).toString('hex')}.${EXT[mime]}`
}

export async function createSignedUpload(objPath) {
  const { data, error } = await sb().storage.from(BUCKET).createSignedUploadUrl(objPath)
  if (error) throw new Error(`Gagal membuat URL unggah: ${error.message}`)
  return { signedUrl: data.signedUrl, token: data.token }
}

// Baca 32 byte pertama + ukuran objek lewat URL publik (header Range). Objek tidak ada → exists:false.
export async function inspectObject(objPath) {
  // Query unik: pemeriksaan ini tidak boleh mengisi cache CDN pada URL asli objek. Kalau diisi, berkas yang
  // ditolak dan dihapus tetap bisa tersaji dari cache di URL-nya.
  const res = await fetch(`${publicUrlFor(objPath)}?inspect=${Date.now()}`, { headers: { Range: 'bytes=0-31' }, cache: 'no-store' })
  if (res.status === 404 || res.status === 400) return { exists: false }
  if (!res.ok && res.status !== 206) throw new Error(`Gagal membaca objek (HTTP ${res.status}).`)
  const head = Buffer.from(await res.arrayBuffer()).subarray(0, 32)
  const range = res.headers.get('content-range') // "bytes 0-31/12345"
  const size = range ? Number(range.split('/')[1]) : Number(res.headers.get('content-length'))
  return { exists: true, size, head }
}

export async function removeObject(objPath) {
  const { error } = await sb().storage.from(BUCKET).remove([objPath])
  if (error) console.error('Hapus objek storage gagal:', error.message)
}

// Unggah berkas lokal (dipakai skrip capture & migrasi media).
export async function uploadFile(localPath, slug, kind) {
  const buffer = await fs.readFile(localPath)
  const mime = sniffMime(buffer)
  if (!mime || !MEDIA_KINDS[kind]?.types.includes(mime)) {
    throw new Error(`${path.basename(localPath)}: jenis berkas tidak cocok untuk "${kind}" (${mime ?? 'tidak dikenal'}).`)
  }
  return uploadBuffer(objectPath(slug, kind, buffer, mime), buffer, mime)
}

// Hapus objek berdasarkan URL publik. Hanya URL milik bucket kita yang disentuh. Best-effort:
// kegagalan hanya dicatat agar tidak menggagalkan operasi utama.
export async function removeByUrls(urls) {
  if (!storageConfigured()) return 0
  const paths = [...new Set(urls.map(pathFromUrl).filter(Boolean))]
  if (!paths.length) return 0
  const { error } = await sb().storage.from(BUCKET).remove(paths)
  if (error) {
    console.error('Hapus objek storage gagal:', error.message)
    return 0
  }
  return paths.length
}
