import { create } from 'zustand'

// Auth state disimpan di memory (Zustand) — BUKAN localStorage / cookie.
// Token akan hilang saat refresh halaman, sesuai requirement keamanan.
export const useAuthStore = create((set) => ({
  token: null,
  isAdmin: false,
  username: null,

  login: ({ token, username }) =>
    set({ token, username: username || 'Admin', isAdmin: true }),

  logout: () => set({ token: null, isAdmin: false, username: null }),
}))
