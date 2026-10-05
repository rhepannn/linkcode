import { json, fail } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'

// GET /api/auth/me — sesi saat ini (dipakai UI untuk memulihkan login setelah refresh).
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  return json({ username: auth.admin.username })
}
