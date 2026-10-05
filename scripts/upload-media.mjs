// Pindahkan media portofolio lokal (public/showcases/*) ke Supabase Storage dan ganti URL-nya
// di database dari path lokal ("/showcases/x.jpg") menjadi URL publik bucket.
//
// Pakai:
//   npm run upload-media                # unggah + perbarui database
//   npm run upload-media -- --dry-run   # hanya tampilkan rencana
//   npm run upload-media -- --only rata-coffee,finatra
//   npm run upload-media -- --repair    # periksa tiap URL Storage di database; unggah ulang yang objeknya hilang
//
// Aman dijalankan berulang: nama objek berbasis hash isi, jadi berkas yang sama tidak diunggah dua kali.
import { config } from 'dotenv'
config({ path: '.env.local' })
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { BUCKET, ensureBucket, objectExists, pathFromUrl, storageConfigured, uploadFile, withRetry } from '../src/lib/storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_DIR = path.resolve(__dirname, '../public/showcases')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const repair = args.includes('--repair')
// --only slug1,slug2  atau  --only=slug1,slug2  (tanpa flag ini → semua karya)
const onlyIdx = args.findIndex((a) => a === '--only' || a.startsWith('--only='))
const onlyVal = onlyIdx === -1 ? null : args[onlyIdx].includes('=') ? args[onlyIdx].split('=')[1] : args[onlyIdx + 1]
const only = onlyVal ? new Set(onlyVal.split(',').filter(Boolean)) : null

// Kolom database → jenis media
const FIELDS = [
  ['thumbnailUrl', 'thumbnail'],
  ['previewUrl', 'preview'],
  ['videoUrl', 'video'],
]

const prisma = new PrismaClient()

async function main() {
  if (!storageConfigured()) {
    console.error('Storage belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local.')
    process.exitCode = 1
    return
  }

  let items = await withRetry(() => prisma.showcase.findMany({ orderBy: { sortOrder: 'asc' } }), { label: 'Baca database' })
  if (only) items = items.filter((i) => only.has(i.slug))

  if (!dryRun) {
    const { created } = await withRetry(() => ensureBucket(), { label: 'Siapkan bucket' })
    console.log(created ? `Bucket "${BUCKET}" dibuat (publik).` : `Bucket "${BUCKET}" sudah ada.`)
  }

  const report = []
  for (const item of items) {
    for (const [field, kind] of FIELDS) {
      const value = item[field]
      if (!value) continue
      if (repair) {
        // Mode perbaikan: URL milik bucket kita yang objeknya tidak ada → unggah ulang dari berkas lokal.
        if (!pathFromUrl(value) || (await objectExists(pathFromUrl(value)))) continue
        const localName = field === 'thumbnailUrl' ? `${item.slug}-thumb.jpg` : field === 'previewUrl' ? `${item.slug}.jpg` : `${item.slug}.webm`
        const row = { slug: item.slug, jenis: kind, berkas: localName, hasil: '' }
        try {
          if (dryRun) row.hasil = 'akan diunggah ulang'
          else {
            const url = await uploadFile(path.join(LOCAL_DIR, localName), item.slug, kind)
            if (url !== value) await withRetry(() => prisma.showcase.update({ where: { id: item.id }, data: { [field]: url } }), { label: 'Simpan URL' })
            row.hasil = (await objectExists(pathFromUrl(url))) ? 'ok' : 'GAGAL: objek tetap tidak ada setelah unggah'
          }
        } catch (err) {
          row.hasil = err.code === 'ENOENT' ? 'GAGAL: berkas lokal tidak ada' : `GAGAL: ${err.message}`
        }
        console.log(`${row.hasil === 'ok' ? '✓' : row.hasil.startsWith('akan') ? '·' : '✗'} ${row.slug} / ${kind}${row.hasil === 'ok' || row.hasil.startsWith('akan') ? '' : ' → ' + row.hasil}`)
        report.push(row)
        continue
      }
      if (!value.startsWith('/showcases/')) continue // sudah URL luar atau Storage
      const file = path.join(LOCAL_DIR, path.basename(value))
      const row = { slug: item.slug, jenis: kind, berkas: path.basename(value), hasil: '' }
      try {
        const stat = await fs.stat(file)
        if (dryRun) {
          row.hasil = `akan diunggah (${(stat.size / 1024).toFixed(0)} KB)`
        } else {
          const url = await uploadFile(file, item.slug, kind)
          if (!(await objectExists(pathFromUrl(url)))) throw new Error('objek tidak ditemukan di bucket setelah diunggah')
          // Simpan SEKARANG per berkas: progres tidak hilang jika proses terputus di tengah jalan.
          await withRetry(() => prisma.showcase.update({ where: { id: item.id }, data: { [field]: url } }), { label: 'Simpan URL' })
          row.hasil = 'ok'
        }
      } catch (err) {
        row.hasil = err.code === 'ENOENT' ? 'GAGAL: berkas lokal tidak ada' : `GAGAL: ${err.message}`
      }
      console.log(`${row.hasil === 'ok' ? '✓' : row.hasil.startsWith('akan') ? '·' : '✗'} ${row.slug} / ${kind}${row.hasil === 'ok' || row.hasil.startsWith('akan') ? '' : ' → ' + row.hasil}`)
      report.push(row)
    }
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
