import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROJECTS = [
  {
    name: 'Sistem Kasir UMKM',
    description:
      'Aplikasi point-of-sale berbasis web untuk toko ritel dengan manajemen stok, laporan penjualan harian, dan cetak struk.',
    percentage: 72,
    status: 'active',
    icon: '🛒',
    pics: [
      { name: 'Andi Wijaya', role: 'Lead Developer', contribution: 45, avatarColor: '#1E5FA8' },
      { name: 'Sari Putri', role: 'Frontend Dev', contribution: 35, avatarColor: '#4A90D9' },
      { name: 'Budi Santoso', role: 'QA Engineer', contribution: 20, avatarColor: '#0D2B4E' },
    ],
  },
  {
    name: 'Portal HR Internal',
    description:
      'Platform manajemen karyawan: absensi, pengajuan cuti, slip gaji digital, dan dashboard analitik untuk HRD.',
    percentage: 48,
    status: 'active',
    icon: '👔',
    pics: [
      { name: 'Citra Dewi', role: 'Fullstack Dev', contribution: 60, avatarColor: '#1E5FA8' },
      { name: 'Eko Prasetyo', role: 'Backend Dev', contribution: 40, avatarColor: '#4A90D9' },
    ],
  },
  {
    name: 'Marketplace Tani',
    description:
      'Marketplace yang menghubungkan petani langsung ke pembeli grosir, lengkap dengan sistem lelang dan logistik.',
    percentage: 90,
    status: 'review',
    icon: '🌾',
    pics: [
      { name: 'Fajar Nugroho', role: 'Lead Developer', contribution: 50, avatarColor: '#0D2B4E' },
      { name: 'Gita Lestari', role: 'UI/UX Designer', contribution: 25, avatarColor: '#4A90D9' },
      { name: 'Hadi Kurniawan', role: 'Backend Dev', contribution: 25, avatarColor: '#1E5FA8' },
    ],
  },
  {
    name: 'Aplikasi Logistik Armada',
    description:
      'Pelacakan armada pengiriman real-time dengan rute optimal, estimasi waktu tiba, dan notifikasi ke pelanggan.',
    percentage: 30,
    status: 'hold',
    icon: '🚚',
    pics: [
      { name: 'Indah Permata', role: 'Project Manager', contribution: 40, avatarColor: '#1E5FA8' },
      { name: 'Joko Susilo', role: 'Mobile Dev', contribution: 60, avatarColor: '#4A90D9' },
    ],
  },
  {
    name: 'Company Profile Interaktif',
    description:
      'Website company profile dengan animasi modern, CMS untuk update konten mandiri, dan optimasi SEO.',
    percentage: 100,
    status: 'done',
    icon: '🌐',
    pics: [
      { name: 'Kartika Sari', role: 'Frontend Dev', contribution: 70, avatarColor: '#4A90D9' },
      { name: 'Lukman Hakim', role: 'SEO Specialist', contribution: 30, avatarColor: '#0D2B4E' },
    ],
  },
]

async function main() {
  // --- Admin ---
  const username = process.env.SEED_ADMIN_USERNAME || 'admin'
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.admin.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash },
  })
  console.log(`✅ Admin siap → username: "${username}", password: "${password}"`)

  // --- Projects (hanya jika tabel masih kosong) ---
  const count = await prisma.project.count()
  if (count === 0) {
    for (const p of PROJECTS) {
      await prisma.project.create({
        data: { ...p, pics: { create: p.pics } },
      })
    }
    console.log(`✅ ${PROJECTS.length} project contoh berhasil dibuat.`)
  } else {
    console.log('ℹ️  Project sudah ada, lewati seeding project.')
  }

  // --- Setting default (nomor WhatsApp) ---
  const waNumber = process.env.SEED_WHATSAPP_NUMBER || '628123456789'
  await prisma.setting.upsert({
    where: { key: 'whatsappNumber' },
    update: {},
    create: { key: 'whatsappNumber', value: waNumber },
  })
  console.log(`✅ Setting whatsappNumber siap (default: "${waNumber}").`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
