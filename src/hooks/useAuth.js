import { useAuthStore } from '../store/authStore.js'
import { login as apiLogin } from '../api/client.js'

// Hook tipis di atas authStore + API untuk dipakai komponen.
export function useAuth() {
  const token = useAuthStore((s) => s.token)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const username = useAuthStore((s) => s.username)
  const setLogin = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  const signIn = async (credentials) => {
    const { token, username } = await apiLogin(credentials)
    setLogin({ token, username: username || credentials.username })
    return token
  }

  return { token, isAdmin, username, signIn, logout }
}
