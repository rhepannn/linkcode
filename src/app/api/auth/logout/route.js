import { NextResponse } from 'next/server'
import { COOKIE_NAME, cookieOptions } from '@/lib/auth'

// POST /api/auth/logout — hapus cookie sesi. Aman dipanggil tanpa sesi.
export async function POST() {
  const res = NextResponse.json({ message: 'Berhasil keluar.' })
  res.cookies.set(COOKIE_NAME, '', cookieOptions(0))
  return res
}
