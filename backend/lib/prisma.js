import { PrismaClient } from '@prisma/client'

// Satu instance dipakai bersama oleh route yang baru.
export const prisma = new PrismaClient()
