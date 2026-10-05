import { cookies } from 'next/headers'
import AdminApp from '@/components/admin/AdminApp'
import { COOKIE_NAME, verifySession } from '@/lib/auth'

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

// Dinamis (membaca cookie). Sesi diverifikasi di server lalu diteruskan ke UI sebagai prop.
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  const user = await verifySession(token)
  return <AdminApp initialUser={user ? { username: user.username } : null} />
}
