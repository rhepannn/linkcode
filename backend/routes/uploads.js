import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import {
  MAX_UPLOAD_BYTES,
  MEDIA_KINDS,
  objectPath,
  pathFromUrl,
  removeByUrls,
  sniffMime,
  storageConfigured,
  uploadBuffer,
} from '../lib/storage.js'

// Unggah media portofolio ke Supabase Storage. Seluruhnya [AUTH].
const router = Router()
router.use(authMiddleware)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 },
})

const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/
const MB = (n) => Math.round(n / 1024 / 1024)

function requireStorage(_req, res, next) {
  if (!storageConfigured()) {
    return res.status(503).json({
      message: 'Penyimpanan belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di backend/.env lalu restart server.',
    })
  }
  next()
}

// POST /api/uploads — multipart: file, slug, kind (thumbnail | preview | video)
router.post('/', requireStorage, upload.single('file'), async (req, res) => {
  const { slug, kind } = req.body || {}
  const spec = MEDIA_KINDS[kind]

  if (!req.file) return res.status(400).json({ message: 'Berkas wajib dipilih.' })
  if (!spec) return res.status(400).json({ message: 'Jenis media tidak valid.' })
  if (!SLUG.test(String(slug || ''))) return res.status(400).json({ message: 'Slug karya tidak valid. Isi judul/slug terlebih dahulu.' })

  const { buffer, size } = req.file
  if (size > spec.maxBytes) {
    return res.status(413).json({ message: `Ukuran maksimal ${MB(spec.maxBytes)} MB untuk jenis media ini.` })
  }

  // Percayai isi berkas, bukan nama/Content-Type dari klien.
  const mime = sniffMime(buffer)
  if (!mime || !spec.types.includes(mime)) {
    return res.status(415).json({ message: `Jenis berkas tidak didukung. Gunakan: ${spec.types.map((t) => t.split('/')[1]).join(', ')}.` })
  }

  try {
    const url = await uploadBuffer(objectPath(slug, kind, buffer, mime), buffer, mime)
    res.status(201).json({ url, size, contentType: mime })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(502).json({ message: 'Gagal mengunggah ke penyimpanan. Coba lagi.' })
  }
})

// DELETE /api/uploads { url } — buang unggahan yang batal dipakai (mis. form ditutup tanpa menyimpan).
// Hanya objek milik bucket kita yang belum dipakai karya mana pun.
router.delete('/', requireStorage, async (req, res) => {
  const url = String(req.body?.url || '')
  if (!pathFromUrl(url)) return res.status(400).json({ message: 'URL bukan milik penyimpanan ini.' })

  try {
    const used = await prisma.showcase.count({
      where: { OR: [{ thumbnailUrl: url }, { previewUrl: url }, { videoUrl: url }] },
    })
    if (used > 0) return res.status(409).json({ message: 'Berkas masih dipakai oleh sebuah karya.' })
    const removed = await removeByUrls([url])
    res.json({ removed })
  } catch (err) {
    console.error('Delete upload error:', err)
    res.status(500).json({ message: 'Gagal menghapus berkas.' })
  }
})

// Error multer (mis. file terlalu besar) → respons JSON yang jelas.
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? `Ukuran berkas maksimal ${MB(MAX_UPLOAD_BYTES)} MB.` : 'Unggahan tidak valid.'
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message })
  }
  next(err)
})

export default router
