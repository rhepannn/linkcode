import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, invalidJson, json, readJson } from '@/lib/http'

// Kunci setting yang boleh dibaca publik & diedit dari admin.
const ALLOWED_KEYS = ['whatsappNumber']

async function readSettings() {
  const rows = await prisma.setting.findMany({ where: { key: { in: ALLOWED_KEYS } } })
  const out = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

// GET /api/settings — publik
export async function GET() {
  try {
    return json(await readSettings())
  } catch (err) {
    console.error('Get settings error:', err)
    return fail('Gagal mengambil pengaturan.', 500)
  }
}

// PUT /api/settings — [AUTH] upsert beberapa setting sekaligus
export async function PUT(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  const body = await readJson(request)
  if (body === null) return invalidJson()

  try {
    const entries = Object.entries(body).filter(([k]) => ALLOWED_KEYS.includes(k))
    for (const [key, value] of entries) {
      const v = String(value).trim()
      await prisma.setting.upsert({ where: { key }, update: { value: v }, create: { key, value: v } })
    }
    revalidatePath('/') // nomor WhatsApp tampil di halaman publik
    return json(await readSettings())
  } catch (err) {
    console.error('Update settings error:', err)
    return fail('Gagal menyimpan pengaturan.', 500)
  }
}
