export const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(v)

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

// "12" → 12, selain bilangan bulat positif → null
export function parseId(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Terima "YYYY-MM-DD" / ISO. Kosong → null. Tidak valid → undefined.
export function parseDate(value) {
  if (value === undefined || value === null || value === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

// String opsional: kosong → null.
export const optStr = (v) => {
  const s = String(v ?? '').trim()
  return s || null
}
