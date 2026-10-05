'use client'

import { HEALTH } from '../../utils/trackingConfig.js'

// Badge kesehatan project (on track / at risk / terlambat / ditahan / selesai).
export default function HealthBadge({ health }) {
  const h = HEALTH[health] || HEALTH.on_track
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: h.bg, color: h.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: h.dot }} />
      {h.label}
    </span>
  )
}
