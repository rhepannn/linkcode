import { clamp, isHttpUrl, optStr, parseDate, parseId } from './util.js'

// Validasi & pembersihan payload. Dipisah dari route.js karena berkas route hanya boleh
// mengekspor handler HTTP.

// ---------- Anggota ----------
const HEX = /^#[0-9a-fA-F]{6}$/

export function parseMemberInput(body) {
  const b = body || {}
  const errors = []

  const name = String(b.name || '').trim()
  const role = String(b.role || '').trim()
  if (!name) errors.push('Nama wajib diisi.')
  if (!role) errors.push('Jabatan wajib diisi.')

  const email = optStr(b.email)
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push('Email tidak valid.')

  const avatarColor = b.avatarColor ? String(b.avatarColor) : '#5C6E21'
  if (!HEX.test(avatarColor)) errors.push('Warna avatar harus berformat #RRGGBB.')

  return {
    errors,
    data: { name, role, email, avatarColor, active: b.active === undefined ? true : Boolean(b.active) },
  }
}

// ---------- Project ----------
export const VALID_STATUS = ['active', 'review', 'hold', 'done']

export function parseProjectInput(body) {
  const b = body || {}
  const errors = []

  const name = String(b.name || '').trim()
  const description = String(b.description || '').trim()
  if (!name) errors.push('Nama project wajib diisi.')
  if (!description) errors.push('Deskripsi wajib diisi.')
  if (b.status && !VALID_STATUS.includes(b.status)) errors.push('Status tidak valid.')

  const startDate = parseDate(b.startDate)
  const targetDate = parseDate(b.targetDate)
  if (startDate === undefined) errors.push('Tanggal mulai tidak valid.')
  if (targetDate === undefined) errors.push('Tanggal target tidak valid.')
  if (startDate && targetDate && targetDate < startDate) errors.push('Tanggal target tidak boleh sebelum tanggal mulai.')

  const links = {}
  for (const [key, label] of [['stagingUrl', 'Link staging'], ['liveUrl', 'Link live'], ['repoUrl', 'Link repositori']]) {
    const v = optStr(b[key])
    if (v && !isHttpUrl(v)) errors.push(`${label} harus diawali http:// atau https://.`)
    links[key] = v
  }

  const pct = Number(b.percentage)

  return {
    errors,
    data: {
      name,
      description,
      percentage: Number.isFinite(pct) ? clamp(Math.round(pct), 0, 100) : 0,
      status: b.status || 'active',
      icon: String(b.icon || '🚀').trim(),
      client: optStr(b.client),
      startDate: startDate ?? null,
      targetDate: targetDate ?? null,
      ...links,
    },
  }
}

// Daftar tim: [{ memberId, role: 'lead'|'member', contribution }]
export function parseTeam(input) {
  if (!Array.isArray(input)) return { errors: ['Tim harus berupa daftar.'], team: [] }
  const errors = []
  const seen = new Set()
  const team = []
  for (const t of input) {
    const memberId = parseId(t?.memberId)
    if (!memberId) {
      errors.push('Anggota tim tidak valid.')
      continue
    }
    if (seen.has(memberId)) {
      errors.push('Satu anggota tidak boleh dimasukkan dua kali.')
      continue
    }
    seen.add(memberId)
    team.push({
      memberId,
      role: t.role === 'lead' ? 'lead' : 'member',
      contribution: clamp(Math.round(Number(t.contribution) || 0), 0, 100),
    })
  }
  if (team.filter((t) => t.role === 'lead').length > 1) errors.push('Hanya boleh ada satu PIC utama.')
  return { errors, team }
}

// ---------- Fitur ----------
export const FEATURE_STATUS = ['next', 'in_progress', 'done']

export function parseFeatureInput(body, { partial = false } = {}) {
  const b = body || {}
  const errors = []
  const data = {}

  if (!partial || b.title !== undefined) {
    const title = String(b.title || '').trim()
    if (!title) errors.push('Judul fitur wajib diisi.')
    data.title = title
  }
  if (b.description !== undefined) data.description = String(b.description).trim()
  if (b.status !== undefined) {
    if (!FEATURE_STATUS.includes(b.status)) errors.push('Status fitur tidak valid.')
    else data.status = b.status
  }
  if (b.dueDate !== undefined) {
    const d = parseDate(b.dueDate)
    if (d === undefined) errors.push('Tenggat tidak valid.')
    else data.dueDate = d
  }
  if (b.assigneeId !== undefined) {
    if (b.assigneeId === null || b.assigneeId === '') data.assigneeId = null
    else {
      const a = parseId(b.assigneeId)
      if (!a) errors.push('Penanggung jawab tidak valid.')
      else data.assigneeId = a
    }
  }
  if (b.sortOrder !== undefined) {
    const n = Number(b.sortOrder)
    if (Number.isInteger(n)) data.sortOrder = n
  }
  return { errors, data }
}

// ---------- Karya portofolio ----------
export const SECTORS = ['industri', 'lingkungan', 'pemerintahan', 'platform', 'bisnis']

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// Media boleh berupa path lokal ("/showcases/x.jpg") atau URL penuh.
const isMediaUrl = (v) => v.startsWith('/') || isHttpUrl(v)

export function parseShowcaseInput(body) {
  const b = body || {}
  const errors = []

  const title = String(b.title || '').trim()
  const description = String(b.description || '').trim()
  const url = String(b.url || '').trim()
  const slug = slugify(b.slug || title)

  if (!title) errors.push('Judul wajib diisi.')
  if (!description) errors.push('Deskripsi wajib diisi.')
  if (!isHttpUrl(url)) errors.push('URL harus diawali http:// atau https://.')
  if (!SECTORS.includes(b.sector)) errors.push('Sektor tidak valid.')
  if (!slug) errors.push('Slug tidak valid.')

  const media = {}
  for (const key of ['thumbnailUrl', 'previewUrl', 'videoUrl']) {
    const v = String(b[key] || '').trim()
    if (v && !isMediaUrl(v)) errors.push(`${key} tidak valid.`)
    media[key] = v || null
  }

  const yearNum = Number(b.year)
  const year = b.year === '' || b.year == null ? null : Number.isInteger(yearNum) ? yearNum : NaN
  if (Number.isNaN(year)) errors.push('Tahun tidak valid.')

  const techStack = Array.isArray(b.techStack)
    ? b.techStack.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
    : []

  return {
    errors,
    data: {
      slug,
      title,
      url,
      sector: b.sector,
      description,
      year,
      techStack,
      ...media,
      featured: Boolean(b.featured),
      embeddable: Boolean(b.embeddable),
      published: b.published === undefined ? true : Boolean(b.published),
      sortOrder: Number.isInteger(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
    },
  }
}
