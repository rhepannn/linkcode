import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import settingsRoutes from './routes/settings.js'
import showcaseRoutes from './routes/showcases.js'
import uploadRoutes from './routes/uploads.js'
import memberRoutes from './routes/members.js'
import featureRoutes from './routes/features.js'
import trackingRoutes from './routes/tracking.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
  }),
)
app.use(express.json())

// Health check
app.get('/', (_req, res) => {
  res.json({ service: 'LinkCode API', status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/showcases', showcaseRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/members', memberRoutes)
// Rute bersarang (/api/projects/:id/features, /api/features/:id, dll.) — auth dipasang per-rute.
app.use('/api', featureRoutes)
app.use('/api', trackingRoutes)

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' })
})

app.listen(PORT, () => {
  console.log(`🚀 LinkCode API berjalan di http://localhost:${PORT}`)
})
