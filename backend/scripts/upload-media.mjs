// Pindahkan media portofolio lokal (public/showcases/*) ke Supabase Storage dan ganti URL-nya
// di database dari path lokal ("/showcases/x.jpg") menjadi URL publik bucket.
//
// Pakai:
//   npm run upload-media                # unggah + perbarui database
//   npm run upload-media -- --dry-run   # hanya tampilkan rencana
//   npm run upload-media -- --only rata-coffee,finatra
//
// Aman dijalankan berulang: nama objek berbasis hash isi, jadi berkas yang sama tidak diunggah dua kali.
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { BUCKET, ensureBucket, storageConfigured, uploadFile } from '../lib/storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_DIR = path.resolve(__dirname, '../../public/showcases')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1] ?? args[args.indexOf('--only') + 1]
const only = args.includes('--only') || onlyArg ? new Set((onlyArg || '').split(',').filter(Boolean)) : null

// Kolom database → jenis media
const FIELDS = [
  ['thumbnailUrl', 'thumbnail'],
  ['previewUrl', 'preview'],
  ['videoUrl', 'video'],
]

const prisma = new PrismaClient()

async function main() {
  if (!storageConfigured()) {
    console.error('Storage belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di backend/.env.')
    process.exitCode = 1
    return
  }

  let items = await prisma.showcase.findMany({ orderBy: { sortOrder: 'asc' } })
  if (only) items = items.filter((i) => only.has(i.slug))

  if (!dryRun) {
    const { created } = await ensureBucket()
    console.log(created ? `Bucket "${BUCKET}" dibuat (publik).` : `Bucket "${BUCKET}" sudah ada.`)
  }

  const report = []
  for (const item of items) {
    const data = {}
    for (const [field, kind] of FIELDS) {
      const value = item[field]
      if (!value || !value.startsWith('/showcases/')) continue // kosong / sudah URL luar atau Storage
      const file = path.join(LOCAL_DIR, path.basename(value))
      const row = { slug: item.slug, jenis: kind, berkas: path.basename(value), hasil: '' }
      try {
        const stat = await fs.stat(file)
        if (dryRun) {
          row.hasil = `akan diunggah (${(stat.size / 1024).toFixed(0)} KB)`
        } else {
          data[field] = await uploadFile(file, item.slug, kind)
          row.hasil = 'ok'
        }
      } catch (err) {
        row.hasil = err.code === 'ENOENT' ? 'GAGAL: berkas lokal tidak ada' : `GAGAL: ${err.message}`
      }
      report.push(row)
    }
    if (Object.keys(data).length) await prisma.showcase.update({ where: { id: item.id }, data })
  }

  if (!report.length) console.log('Tidak ada media lokal yang perlu dipindahkan.')
  else console.table(report)
  if (report.some((r) => r.hasil.startsWith('GAGAL'))) process.exitCode = 1
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
