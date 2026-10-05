'use client'

import { useState } from 'react'
import Link from 'next/link'

// Layar login admin — halaman admin tidak bisa dilihat tanpa login berhasil.
export default function LoginModal({ onSubmit }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit({ username, password })
    } catch (err) {
      const msg =
        err?.response?.status === 429
          ? 'Terlalu banyak percobaan. Coba lagi sebentar.'
          : err?.response?.data?.message || 'Username atau password salah.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm">
        <div className="a-card p-7 shadow-sm">
          <p className="font-display text-2xl font-semibold">
            Link<span className="italic text-olive">Code</span>
          </p>
          <h1 className="mt-5 text-lg font-semibold text-neutral-900">Masuk ke admin</h1>
          <p className="mt-1 text-sm text-neutral-500">Khusus untuk tim internal LinkCode.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="a-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="a-input"
              />
            </div>

            <div>
              <label className="a-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="a-input"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="a-btn-primary w-full">
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-900 hover:underline">
            ← Kembali ke situs
          </Link>
        </p>
      </div>
    </div>
  )
}
