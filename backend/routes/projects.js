import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import { clamp, isHttpUrl, optStr, parseDate, parseId } from '../lib/util.js'
import {
  computeHealth,
  featureInclude,
  projectProgressFrom,
  serializeFeature,
  serializeTeam,
  toPics,
} from '../lib/tracking.js'

const router = Router()

const VALID_STATUS = ['active', 'review', 'hold', 'done']
const teamInclude = { include: { member: true } }

// Validasi & bersihkan payload project. Tim ditangani terpisah (parseTeam).
function parseProjectInput(body) {
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

// Validasi daftar tim: [{ memberId, role: 'lead'|'member', contribution }]
function parseTeam(input) {
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

// ---------- Publik ----------

// GET /api/projects — publik. Hanya field yang aman ditampilkan (tanpa klien/link/catatan internal).
router.get('/', async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      relationLoadStrategy: 'join',
      select: {
        id: true,
        name: true,
        description: true,
        percentage: true,
        status: true,
        icon: true,
        createdAt: true,
        team: teamInclude,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(projects.map(({ team, ...p }) => ({ ...p, pics: toPics(team) })))
  } catch (err) {
    console.error('Get projects error:', err)
    res.status(500).json({ message: 'Gagal mengambil data project.' })
  }
})

// ---------- Admin ----------

// GET /api/projects/overview — [AUTH] ringkasan semua project untuk dashboard.
router.get('/overview', authMiddleware, async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      relationLoadStrategy: 'join',
      include: {
        team: teamInclude,
        features: { select: { status: true } },
        blockers: { where: { status: 'open' } },
        updates: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(
      projects.map((p) => {
        const lead = p.team.find((t) => t.role === 'lead')
        const count = (s) => p.features.filter((f) => f.status === s).length
        return {
          id: p.id,
          name: p.name,
          icon: p.icon,
          status: p.status,
          percentage: p.percentage,
          client: p.client,
          startDate: p.startDate,
          targetDate: p.targetDate,
          updatedAt: p.updatedAt,
          health: computeHealth(p, p.blockers),
          lead: lead ? { name: lead.member.name, avatarColor: lead.member.avatarColor } : null,
          teamCount: p.team.length,
          features: { total: p.features.length, done: count('done'), in_progress: count('in_progress'), next: count('next') },
          openBlockers: p.blockers.length,
          highBlockers: p.blockers.filter((b) => b.severity === 'high').length,
          lastUpdate: p.updates[0] ? { note: p.updates[0].note, createdAt: p.updates[0].createdAt } : null,
        }
      }),
    )
  } catch (err) {
    console.error('Get overview error:', err)
    res.status(500).json({ message: 'Gagal mengambil ringkasan project.' })
  }
})

// GET /api/projects/:id — [AUTH] detail lengkap satu project.
router.get('/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  try {
    const p = await prisma.project.findUnique({
      where: { id },
      relationLoadStrategy: 'join',
      include: {
        team: teamInclude,
        features: { include: featureInclude, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        updates: { orderBy: { createdAt: 'desc' } },
        blockers: { orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] },
      },
    })
    if (!p) return res.status(404).json({ message: 'Project tidak ditemukan.' })

    const { team, features, ...rest } = p
    const open = p.blockers.filter((b) => b.status === 'open')
    res.json({
      ...rest,
      health: computeHealth(p, open),
      autoProgress: projectProgressFrom(features) !== null,
      team: serializeTeam(team),
      features: features.map(serializeFeature),
    })
  } catch (err) {
    console.error('Get project error:', err)
    res.status(500).json({ message: 'Gagal mengambil detail project.' })
  }
})

// POST /api/projects — [AUTH] buat project (tim opsional).
router.post('/', authMiddleware, async (req, res) => {
  const { errors, data } = parseProjectInput(req.body)
  let team = []
  if (req.body?.team !== undefined) {
    const parsed = parseTeam(req.body.team)
    errors.push(...parsed.errors)
    team = parsed.team
  }
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    const project = await prisma.project.create({
      data: { ...data, team: { create: team } },
      include: { team: teamInclude },
    })
    res.status(201).json({ ...project, team: serializeTeam(project.team) })
  } catch (err) {
    if (err.code === 'P2003') return res.status(400).json({ message: 'Ada anggota tim yang tidak ditemukan.' })
    console.error('Create project error:', err)
    res.status(500).json({ message: 'Gagal membuat project.' })
  }
})

// PUT /api/projects/:id — [AUTH] ubah data dasar. Tim tidak disentuh (lihat /:id/team).
// Persen manual diabaikan jika project sudah punya fitur (dihitung otomatis).
router.put('/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  const { errors, data } = parseProjectInput(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    const featureCount = await prisma.feature.count({ where: { projectId: id } })
    if (featureCount > 0) delete data.percentage

    const project = await prisma.project.update({ where: { id }, data })
    res.json(project)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Project tidak ditemukan.' })
    console.error('Update project error:', err)
    res.status(500).json({ message: 'Gagal memperbarui project.' })
  }
})

// PUT /api/projects/:id/team — [AUTH] ganti seluruh susunan tim project.
router.put('/:id/team', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  const { errors, team } = parseTeam(req.body?.team)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })

  try {
    await prisma.$transaction([
      prisma.projectMember.deleteMany({ where: { projectId: id } }),
      prisma.projectMember.createMany({ data: team.map((t) => ({ ...t, projectId: id })) }),
    ])
    const rows = await prisma.projectMember.findMany({ where: { projectId: id }, ...teamInclude })
    res.json(serializeTeam(rows))
  } catch (err) {
    if (err.code === 'P2003') return res.status(400).json({ message: 'Project atau anggota tidak ditemukan.' })
    console.error('Update team error:', err)
    res.status(500).json({ message: 'Gagal menyimpan tim.' })
  }
})

// DELETE /api/projects/:id — [AUTH] hapus project (fitur, tim, catatan, kendala ikut terhapus).
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ message: 'ID tidak valid.' })

  try {
    await prisma.project.delete({ where: { id } })
    res.json({ message: 'Project berhasil dihapus.' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Project tidak ditemukan.' })
    console.error('Delete project error:', err)
    res.status(500).json({ message: 'Gagal menghapus project.' })
  }
})

export default router
