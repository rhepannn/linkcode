import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { fail, json } from '@/lib/http'
import { computeHealth } from '@/lib/tracking'

// GET /api/projects/overview — [AUTH] ringkasan semua project untuk dashboard.
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const projects = await prisma.project.findMany({
      relationLoadStrategy: 'join',
      include: {
        team: { include: { member: true } },
        features: { select: { status: true } },
        blockers: { where: { status: 'open' } },
        updates: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return json(
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
    return fail('Gagal mengambil ringkasan project.', 500)
  }
}
