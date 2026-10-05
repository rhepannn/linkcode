import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import settingsRoutes from './routes/settings.js'
import showcaseRoutes from './routes/showcases.js'

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

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' })
})

app.listen(PORT, () => {
  console.log(`🚀 LinkCode API berjalan di http://localhost:${PORT}`)
})
