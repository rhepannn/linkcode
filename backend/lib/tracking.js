import { prisma } from './prisma.js'

export const featureInclude = { subtasks: true, assignee: true }

// ---- Progres ----------------------------------------------------------------
// Fitur "done" = 100%. Selain itu: rasio sub-tugas selesai; tanpa sub-tugas = 0%.
export function featureProgress(feature) {
  if (feature.status === 'done') return 1
  const subs = feature.subtasks || []
  if (!subs.length) return 0
  return subs.filter((s) => s.done).length / subs.length
}

// Rata-rata progres semua fitur (0-100), atau null bila project belum punya fitur.
export function projectProgressFrom(features) {
  if (!features.length) return null
  const sum = features.reduce((acc, f) => acc + featureProgress(f), 0)
  return Math.round((sum / features.length) * 100)
}

// Jika fitur punya sub-tugas, status mengikuti sub-tugas:
// semua selesai → done; sebagian → in_progress; belum ada → tetap (atau in_progress bila tadinya done).
// Mengembalikan fitur terbaru (dengan sub-tugas & penanggung jawab).
export async function syncFeatureStatus(featureId) {
  const f = await prisma.feature.findUnique({ where: { id: featureId }, include: featureInclude })
  if (!f || f.subtasks.length === 0) return f

  const done = f.subtasks.filter((s) => s.done).length
  let status = f.status
  if (done === f.subtasks.length) status = 'done'
  else if (done > 0) status = 'in_progress'
  else if (status === 'done') status = 'in_progress'

  if (status === f.status) return f
  return prisma.feature.update({
    where: { id: f.id },
    data: { status, completedAt: status === 'done' ? new Date() : null },
    include: featureInclude,
  })
}

// Simpan persen otomatis ke Project.percentage (dipakai juga oleh halaman publik).
// Hanya menulis bila nilainya berubah. Mengembalikan persen terkini project.
export async function syncProjectProgress(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    relationLoadStrategy: 'join',
    select: { percentage: true, features: { include: { subtasks: true } } },
  })
  if (!project) return null
  const pct = projectProgressFrom(project.features)
  if (pct === null || pct === project.percentage) return project.percentage
  await prisma.project.update({ where: { id: projectId }, data: { percentage: pct } })
  return pct
}

// ---- Kesehatan project --------------------------------------------------------
// done | hold | overdue | at_risk | on_track
export function computeHealth(project, openBlockers = [], now = new Date()) {
  if (project.status === 'done') return 'done'
  if (project.status === 'hold') return 'hold'

  const pct = project.percentage
  if (project.targetDate && now > project.targetDate && pct < 100) return 'overdue'

  let risky = openBlockers.some((b) => b.severity === 'high')
  if (project.startDate && project.targetDate) {
    const total = project.targetDate - project.startDate
    if (total > 0) {
      const elapsed = Math.min(Math.max(now - project.startDate, 0), total)
      const expected = (elapsed / total) * 100
      if (pct < expected - 15) risky = true // tertinggal >15 poin dari jadwal
    }
  }
  return risky ? 'at_risk' : 'on_track'
}

// ---- Serializer ---------------------------------------------------------------
const sortTeam = (team) =>
  [...team].sort((a, b) => (a.role === 'lead' ? -1 : 0) - (b.role === 'lead' ? -1 : 0) || b.contribution - a.contribution)

// Bentuk lama `pics` untuk halaman publik (PIC utama di depan).
export const toPics = (team) =>
  sortTeam(team).map((t) => ({
    id: t.id,
    name: t.member.name,
    role: t.member.role,
    contribution: t.contribution,
    avatarColor: t.member.avatarColor,
  }))

export const serializeTeam = (team) =>
  sortTeam(team).map((t) => ({
    id: t.id,
    memberId: t.memberId,
    name: t.member.name,
    title: t.member.role,
    email: t.member.email,
    avatarColor: t.member.avatarColor,
    role: t.role, // lead | member
    contribution: t.contribution,
  }))

export const serializeFeature = (f) => ({
  id: f.id,
  projectId: f.projectId,
  title: f.title,
  description: f.description,
  status: f.status,
  dueDate: f.dueDate,
  sortOrder: f.sortOrder,
  completedAt: f.completedAt,
  assigneeId: f.assigneeId,
  assignee: f.assignee ? { id: f.assignee.id, name: f.assignee.name, avatarColor: f.assignee.avatarColor } : null,
  subtasks: [...(f.subtasks || [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
  progress: Math.round(featureProgress(f) * 100),
})

