// Konfigurasi tampilan untuk dashboard pemantauan project.

export const HEALTH = {
  on_track: { label: 'On track', bg: '#E8EDD5', fg: '#46541A', dot: '#5C6E21' },
  at_risk: { label: 'At risk', bg: '#FBEBC8', fg: '#8A5A00', dot: '#D99100' },
  overdue: { label: 'Terlambat', bg: '#F6E1E1', fg: '#9A2F36', dot: '#BD3D44' },
  hold: { label: 'Ditahan', bg: '#EFE6D3', fg: '#7A6440', dot: '#B8A58A' },
  done: { label: 'Selesai', bg: '#E4E6E1', fg: '#1E211D', dot: '#1E211D' },
}

export const FEATURE_STATUS = {
  in_progress: { label: 'Sedang dikerjakan', short: 'Dikerjakan' },
  next: { label: 'Berikutnya', short: 'Berikutnya' },
  done: { label: 'Selesai', short: 'Selesai' },
}
// Urutan kolom papan fitur.
export const FEATURE_COLUMNS = ['in_progress', 'next', 'done']

export const SEVERITY = {
  high: { label: 'Tinggi', bg: '#F6E1E1', fg: '#9A2F36' },
  medium: { label: 'Sedang', bg: '#FBEBC8', fg: '#8A5A00' },
  low: { label: 'Rendah', bg: '#E4E6E1', fg: '#46503F' },
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

export const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—')
export const fmtShort = (iso) => (iso ? shortFmt.format(new Date(iso)) : '—')

// "2026-10-04T..." → "2026-10-04" untuk <input type="date">
export const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

// Selisih hari dari hari ini (negatif = sudah lewat).
export function daysFromNow(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date()
  d.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

export function relativeDays(iso) {
  const n = daysFromNow(iso)
  if (n === null) return ''
  if (n === 0) return 'hari ini'
  return n > 0 ? `${n} hari lagi` : `${-n} hari lalu`
}

// Waktu relatif singkat untuk catatan/aktivitas.
export function timeAgo(iso) {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000))
  if (sec < 60) return 'baru saja'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} menit lalu`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} hari lalu`
  return fmtDate(iso)
}
