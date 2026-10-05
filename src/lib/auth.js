import { SignJWT, jwtVerify } from 'jose'
import { fail } from './http.js'

// Sesi admin: JWT (HS256, 8 jam) di cookie httpOnly. Header `Authorization: Bearer` juga diterima
// (untuk skrip/uji), dan tidak terkena pengecekan CSRF karena tidak dikirim otomatis oleh browser.
export const COOKIE_NAME = 'lc_session'
export const SESSION_SECONDS = 8 * 60 * 60

function secret() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET belum diisi atau terlalu pendek (minimal 32 karakter).')
  }
  return new TextEncoder().encode(s)
}

export async function signSession({ id, username }) {
  return new SignJWT({ id, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret())
}

export async function verifySession(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return { id: payload.id, username: payload.username }
  } catch {
    return null
  }
}

export const cookieOptions = (maxAge = SESSION_SECONDS) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge,
})

function readCookie(request, name) {
  const header = request.headers.get('cookie') || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

// Untuk permintaan berbasis cookie yang mengubah data: Origin harus sama dengan host kita.
function sameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// Mengembalikan { admin } bila terautentikasi, atau { error: Response } (401/403) bila tidak.
export async function requireAdmin(request) {
  const bearer = (request.headers.get('authorization') || '').split(' ')
  if (bearer[0] === 'Bearer' && bearer[1]) {
    const admin = await verifySession(bearer[1])
    return admin ? { admin } : { error: fail('Token tidak valid atau sudah kedaluwarsa.', 401) }
  }

  const admin = await verifySession(readCookie(request, COOKIE_NAME))
  if (!admin) return { error: fail('Token tidak ditemukan.', 401) }

  const method = request.method.toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !sameOrigin(request)) {
    return { error: fail('Permintaan ditolak (asal tidak cocok).', 403) }
  }
  return { admin }
}
