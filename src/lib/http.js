import { NextResponse } from 'next/server'

// Helper respons & parsing untuk Route Handlers.
export const json = (data, status = 200) => NextResponse.json(data, { status })
export const fail = (message, status = 400) => NextResponse.json({ message }, { status })

// Body JSON → objek. Body kosong → {}. JSON rusak → null (pemanggil membalas 400).
export async function readJson(request) {
  const text = await request.text()
  if (!text.trim()) return {}
  try {
    const data = JSON.parse(text)
    return data && typeof data === 'object' ? data : {}
  } catch {
    return null
  }
}

export const invalidJson = () => fail('Body JSON tidak valid.', 400)

// Alamat klien. Di Vercel x-forwarded-for diisi platform (tidak bisa dipalsukan klien);
// di host lain pastikan proxy di depan menimpa header ini.
export function clientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
