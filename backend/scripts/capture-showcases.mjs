// Ambil screenshot (thumbnail + halaman penuh) dan rekaman scroll tiap karya portofolio,
// simpan ke ../public/showcases lalu isi thumbnailUrl/previewUrl/videoUrl di database.
//
// Pakai:
//   npm run capture                       # semua karya yang published
//   npm run capture -- --only rata-coffee,finatra
//   npm run capture -- --no-video         # hanya screenshot
//   npm run capture -- --local            # simpan hanya di public/showcases (jangan unggah)
//
// Jika SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY terisi, hasil capture otomatis diunggah ke
// Supabase Storage dan database diisi URL publiknya; selain itu memakai path lokal.
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { ensureBucket, storageConfigured, uploadFile } from '../lib/storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../../public/showcases')
const URL_BASE = '/showcases'

const DESKTOP = { width: 1440, height: 900 }
const VIDEO = { width: 1280, height: 720 }
const MAX_FULLPAGE_HEIGHT = 6000 // batasi tinggi screenshot agar file tidak membengkak
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// Waktu tunggu (ms) setelah halaman dimuat agar splash/animasi intro selesai.
const DEFAULT_SETTLE = 3500
const SETTLE_OVERRIDES = { 'kkmp-cilegon': 7000, 'mangrove-link': 8000 }
const run = promisify(execFile)

const args = process.argv.slice(2)
const withVideo = !args.includes('--no-video')
const useStorage = storageConfigured() && !args.includes('--local')
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1] ?? args[args.indexOf('--only') + 1]
const only = args.includes('--only') || onlyArg ? new Set((onlyArg || '').split(',').filter(Boolean)) : null

const prisma = new PrismaClient()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, item) {
  const url = item.url
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status() ?? 'tanpa respons'}`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  // Matikan smooth-scroll bawaan situs supaya scrollTo() langsung sampai.
  await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' }).catch(() => {})
  await sleep(SETTLE_OVERRIDES[item.slug] ?? DEFAULT_SETTLE)
}

// ffmpeg bawaan Playwright (dipakai memangkas splash di awal video). Null jika tidak ada.
async function findFfmpeg() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), 'Library/Caches/ms-playwright')
  for (const root of [base, path.join(os.homedir(), '.cache/ms-playwright')]) {
    const dirs = await fs.readdir(root).catch(() => [])
    for (const d of dirs.filter((x) => x.startsWith('ffmpeg-'))) {
      for (const bin of ['ffmpeg-mac', 'ffmpeg-linux', 'ffmpeg-win64.exe']) {
        const full = path.join(root, d, bin)
        if (await fs.access(full).then(() => true, () => false)) return full
      }
    }
  }
  return null
}

// Scroll bertahap ke bawah agar konten lazy-load / animasi reveal ikut muncul, lalu kembali ke atas.
async function warmUp(page) {
  await page.evaluate(async (maxH) => {
    const step = Math.round(window.innerHeight * 0.7)
    for (let y = 0; y < Math.min(document.documentElement.scrollHeight, maxH); y += step) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 140))
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, MAX_FULLPAGE_HEIGHT * 2)
  await sleep(1200)
}

async function captureImages(browser, item) {
  const ctx = await browser.newContext({ viewport: DESKTOP, userAgent: UA, locale: 'id-ID' })
  const page = await ctx.newPage()
  try {
    await open(page, item)
    await warmUp(page)

    await page.screenshot({
      path: path.join(OUT_DIR, `${item.slug}-thumb.jpg`),
      type: 'jpeg',
      quality: 80,
    })

    const fullH = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.screenshot({
      path: path.join(OUT_DIR, `${item.slug}.jpg`),
      type: 'jpeg',
      quality: 72,
      fullPage: true,
      clip: { x: 0, y: 0, width: DESKTOP.width, height: Math.min(fullH, MAX_FULLPAGE_HEIGHT) },
    })
    return fullH
  } finally {
    await ctx.close()
  }
}

async function captureVideo(browser, item) {
  const tmp = path.join(OUT_DIR, `.tmp-${item.slug}`)
  await fs.mkdir(tmp, { recursive: true })
  const ctx = await browser.newContext({
    viewport: VIDEO,
    userAgent: UA,
    locale: 'id-ID',
    recordVideo: { dir: tmp, size: VIDEO },
  })
  const t0 = Date.now()
  const page = await ctx.newPage()
  try {
    await open(page, item)
    const introSec = (Date.now() - t0) / 1000 // bagian awal (loading/splash) yang dipangkas
    // Scroll halus dengan easing; durasi mengikuti tinggi halaman (6–16 detik).
    await page.evaluate(async () => {
      const total = Math.min(document.documentElement.scrollHeight - window.innerHeight, 9000)
      if (total <= 0) return
      const duration = Math.max(6000, Math.min(16000, total * 4))
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
      await new Promise((resolve) => {
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration)
          window.scrollTo(0, total * ease(t))
          t < 1 ? requestAnimationFrame(tick) : resolve()
        }
        requestAnimationFrame(tick)
      })
    })
    await sleep(1000)
    const video = page.video()
    await ctx.close() // video baru tersimpan setelah context ditutup
    const raw = await video.path()
    const out = path.join(OUT_DIR, `${item.slug}.webm`)
    const ffmpeg = await findFfmpeg()
    if (ffmpeg) {
      await run(ffmpeg, ['-y', '-v', 'error', '-ss', String(Math.max(0, introSec - 0.3)), '-i', raw, '-c:v', 'libvpx', '-b:v', '1500k', '-an', out])
    } else {
      await fs.rename(raw, out) // tanpa ffmpeg: video utuh, termasuk loading di awal
    }
  } finally {
    await ctx.close().catch(() => {})
    await fs.rm(tmp, { recursive: true, force: true })
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  let items = await prisma.showcase.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } })
  if (only) items = items.filter((i) => only.has(i.slug))
  if (!items.length) {
    console.log('Tidak ada karya yang cocok.')
    return
  }

  if (useStorage) await ensureBucket()
  console.log(useStorage ? 'Mode: unggah ke Supabase Storage' : 'Mode: simpan lokal (public/showcases)')
  const browser = await chromium.launch()
  const report = []

  for (const item of items) {
    const row = { slug: item.slug, gambar: '-', video: '-', catatan: '' }
    process.stdout.write(`→ ${item.slug} … `)
    const data = {}
    try {
      const h = await captureImages(browser, item)
      data.thumbnailUrl = `${URL_BASE}/${item.slug}-thumb.jpg`
      data.previewUrl = `${URL_BASE}/${item.slug}.jpg`
      row.gambar = 'ok'
      row.catatan = `tinggi halaman ${h}px`
    } catch (err) {
      row.gambar = 'GAGAL'
      row.catatan = String(err.message).split('\n')[0]
    }

    if (withVideo && row.gambar === 'ok') {
      try {
        await captureVideo(browser, item)
        data.videoUrl = `${URL_BASE}/${item.slug}.webm`
        row.video = 'ok'
      } catch (err) {
        row.video = 'GAGAL'
        row.catatan += ` | video: ${String(err.message).split('\n')[0]}`
      }
    }

    if (useStorage && Object.keys(data).length) {
      try {
        const files = { thumbnailUrl: [`${item.slug}-thumb.jpg`, 'thumbnail'], previewUrl: [`${item.slug}.jpg`, 'preview'], videoUrl: [`${item.slug}.webm`, 'video'] }
        for (const field of Object.keys(data)) {
          const [file, kind] = files[field]
          data[field] = await uploadFile(path.join(OUT_DIR, file), item.slug, kind)
        }
      } catch (err) {
        row.catatan += ` | unggah: ${String(err.message).split('\n')[0]}`
        for (const k of Object.keys(data)) delete data[k] // gagal unggah → jangan ubah database
      }
    }
    if (Object.keys(data).length) await prisma.showcase.update({ where: { id: item.id }, data })
    console.log(`gambar ${row.gambar}, video ${row.video}`)
    report.push(row)
  }

  await browser.close()
  console.log('\nRingkasan:')
  console.table(report)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
