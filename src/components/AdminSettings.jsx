import { useEffect, useState } from 'react'
import { getSettings, updateSettings, changePassword } from '../api/client.js'

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block font-pixel text-[9px] uppercase text-navy">{label}</label>
      <input
        className="w-full border-2 border-light-blue bg-off-white px-3 py-2.5 text-sm outline-none focus:border-sky-blue"
        {...props}
      />
    </div>
  )
}

// Notifikasi kecil (sukses/error) yang hilang sendiri.
function Note({ note }) {
  if (!note) return null
  const ok = note.type === 'ok'
  return (
    <p
      className={`border-2 px-3 py-2 text-sm ${
        ok ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-600'
      }`}
    >
      {note.msg}
    </p>
  )
}

function WhatsAppCard() {
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState(null)

  useEffect(() => {
    getSettings()
      .then((s) => setNumber(s.whatsappNumber || ''))
      .catch(() => setNote({ type: 'err', msg: 'Gagal memuat pengaturan.' }))
      .finally(() => setLoading(false))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNote(null)
    try {
      await updateSettings({ whatsappNumber: number.trim() })
      setNote({ type: 'ok', msg: 'Nomor WhatsApp tersimpan.' })
    } catch (err) {
      setNote({ type: 'err', msg: err?.response?.data?.message || 'Gagal menyimpan.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 border-2 border-navy bg-white p-5 shadow">
      <h3 className="font-pixel text-[11px] uppercase text-navy">📱 Nomor WhatsApp</h3>
      <p className="text-sm text-navy/55">
        Dipakai untuk tombol “Chat di WhatsApp” di halaman publik. Format: kode negara tanpa “+”,
        mis. <span className="text-navy">628123456789</span>.
      </p>
      <Field
        label="Nomor"
        type="text"
        inputMode="numeric"
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/[^\d]/g, ''))}
        placeholder={loading ? 'Memuat…' : '628xxxxxxxxxx'}
        disabled={loading}
      />
      <Note note={note} />
      <button
        type="submit"
        disabled={saving || loading}
        className="btn-pixel border-navy bg-sky-blue px-5 py-3 text-white shadow hover:bg-sky-blue/90 active:shadow-none disabled:opacity-60"
      >
        {saving ? 'Menyimpan…' : 'Simpan'}
      </button>
    </form>
  )
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState(null)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setNote(null)
    if (form.newPassword.length < 6) {
      return setNote({ type: 'err', msg: 'Password baru minimal 6 karakter.' })
    }
    if (form.newPassword !== form.confirm) {
      return setNote({ type: 'err', msg: 'Konfirmasi password tidak cocok.' })
    }
    setSaving(true)
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setNote({ type: 'ok', msg: 'Password berhasil diubah.' })
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setNote({ type: 'err', msg: err?.response?.data?.message || 'Gagal mengubah password.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-2 border-navy bg-white p-5 shadow">
      <h3 className="font-pixel text-[11px] uppercase text-navy">🔒 Ganti Password</h3>
      <Field
        label="Password lama"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={(e) => set('currentPassword', e.target.value)}
        required
      />
      <Field
        label="Password baru"
        type="password"
        autoComplete="new-password"
        value={form.newPassword}
        onChange={(e) => set('newPassword', e.target.value)}
        required
      />
      <Field
        label="Konfirmasi password baru"
        type="password"
        autoComplete="new-password"
        value={form.confirm}
        onChange={(e) => set('confirm', e.target.value)}
        required
      />
      <Note note={note} />
      <button
        type="submit"
        disabled={saving}
        className="btn-pixel border-navy bg-sky-blue px-5 py-3 text-white shadow hover:bg-sky-blue/90 active:shadow-none disabled:opacity-60"
      >
        {saving ? 'Menyimpan…' : 'Ubah Password'}
      </button>
    </form>
  )
}

export default function AdminSettings() {
  return (
    <section className="mt-12">
      <h2 className="mb-5 font-display text-xl leading-relaxed text-navy">Pengaturan</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <WhatsAppCard />
        <PasswordCard />
      </div>
    </section>
  )
}
