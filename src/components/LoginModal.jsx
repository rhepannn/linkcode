import { useState } from 'react'
import LoginWaterScene from './LoginWaterScene.jsx'

// Full-screen overlay login — tidak bisa ditutup tanpa login berhasil.
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
    <div className="scanlines pixel-grid fixed inset-0 z-50 flex flex-col overflow-hidden bg-navy/95">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm border-2 border-sky-blue bg-white p-7 shadow-[8px_8px_0_0_#4A90D9]">
        <div className="mb-6 text-center">
          <p className="font-display text-3xl text-navy">
            Link<span className="text-sky-blue">Code</span>
          </p>
          <h1 className="mt-4 font-pixel text-xs uppercase tracking-wider text-navy">
            ▸ Admin Login
          </h1>
          <p className="mt-2 text-lg text-navy/50">Masuk untuk mengelola project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-pixel text-[10px] uppercase text-navy">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full border-2 border-light-blue bg-off-white px-3 py-2.5 text-navy outline-none focus:border-sky-blue"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="mb-1 block font-pixel text-[10px] uppercase text-navy">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full border-2 border-light-blue bg-off-white px-3 py-2.5 text-navy outline-none focus:border-sky-blue"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="border-2 border-red-300 bg-red-50 px-3 py-2 text-base text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-pixel w-full border-navy bg-sky-blue py-3.5 text-white shadow hover:bg-sky-blue/90 active:shadow-none disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center font-pixel text-[8px] leading-relaxed text-navy/40">
          Halaman ini khusus untuk tim internal LinkCode.
        </p>
        </div>
      </div>
      <LoginWaterScene />
    </div>
  )
}
