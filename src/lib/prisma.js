import { PrismaClient } from '@prisma/client'

// Satu instance per proses. Di dev, `next dev` me-reload modul sehingga instance disimpan di globalThis
// agar koneksi tidak menumpuk. Di serverless (Vercel) tiap instance fungsi memegang satu klien.
const globalForPrisma = globalThis

export const prisma = globalForPrisma.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma
