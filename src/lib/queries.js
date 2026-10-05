import { prisma } from './prisma.js'
import { toPics } from './tracking.js'

// Query data publik yang dipakai halaman (Server Components) dan API publik.
// Hanya field yang aman ditampilkan (tanpa klien, link internal, catatan, kendala).

const iso = (d) => (d ? new Date(d).toISOString() : null)

export async function getPublicProjects() {
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
      team: { include: { member: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return projects.map(({ team, createdAt, ...p }) => ({ ...p, createdAt: iso(createdAt), pics: toPics(team) }))
}

const showcaseOrder = [{ sortOrder: 'asc' }, { id: 'asc' }]

const serializeShowcase = (w) => ({
  ...w,
  createdAt: iso(w.createdAt),
  updatedAt: iso(w.updatedAt),
})

export async function getPublicShowcases() {
  const items = await prisma.showcase.findMany({ where: { published: true }, orderBy: showcaseOrder })
  return items.map(serializeShowcase)
}

export async function getPublicShowcase(slug) {
  const w = await prisma.showcase.findFirst({ where: { slug, published: true } })
  return w ? serializeShowcase(w) : null
}

export async function getWhatsappNumber() {
  const row = await prisma.setting.findUnique({ where: { key: 'whatsappNumber' } })
  return row?.value || null
}
