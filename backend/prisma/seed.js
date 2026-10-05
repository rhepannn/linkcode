import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { projectProgressFrom } from '../lib/tracking.js'

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
      { name: 'Andi Wijaya', role: 'Lead Developer', contribution: 45, avatarColor: '#5C6E21' },
      { name: 'Sari Putri', role: 'Frontend Dev', contribution: 35, avatarColor: '#8A7556' },
      { name: 'Budi Santoso', role: 'QA Engineer', contribution: 20, avatarColor: '#1E211D' },
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
      { name: 'Citra Dewi', role: 'Fullstack Dev', contribution: 60, avatarColor: '#5C6E21' },
      { name: 'Eko Prasetyo', role: 'Backend Dev', contribution: 40, avatarColor: '#8A7556' },
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
      { name: 'Fajar Nugroho', role: 'Lead Developer', contribution: 50, avatarColor: '#1E211D' },
      { name: 'Gita Lestari', role: 'UI/UX Designer', contribution: 25, avatarColor: '#8A7556' },
      { name: 'Hadi Kurniawan', role: 'Backend Dev', contribution: 25, avatarColor: '#5C6E21' },
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
      { name: 'Indah Permata', role: 'Project Manager', contribution: 40, avatarColor: '#5C6E21', lead: true },
      { name: 'Joko Susilo', role: 'Mobile Dev', contribution: 60, avatarColor: '#8A7556' },
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
      { name: 'Kartika Sari', role: 'Frontend Dev', contribution: 70, avatarColor: '#8A7556' },
      { name: 'Lukman Hakim', role: 'SEO Specialist', contribution: 30, avatarColor: '#1E211D' },
    ],
  },
]

// Karya portofolio. Urutan array = urutan tampil (sortOrder).
// `embeddable` = hasil cek header X-Frame-Options / frame-ancestors (2026-10-04).
const SHOWCASES = [
  { slug: 'rata-coffee', title: 'Rata Coffee', url: 'https://ratacoffee.linkproductive.com', sector: 'bisnis', featured: true, embeddable: false,
    description: 'Website brand kedai kopi: sederhana, nikmat, setiap hari.' },
  { slug: 'link-productive-ecosystem', title: 'Link Productive Ecosystem', url: 'https://ecosystem.linkproductive.com', sector: 'platform', featured: true, embeddable: false,
    description: 'Platform ekosistem digital terpadu Indonesia.' },
  { slug: 'mangrove-link', title: 'Mangrove Link', url: 'https://mangrove-link.vercel.app', sector: 'lingkungan', featured: true, embeddable: false,
    description: 'Transparansi restorasi mangrove dari akar: lokasi, spesies, dan kondisi lapangan tercatat sejak hari tanam pertama, bahkan tanpa sinyal.' },
  { slug: 'kkmp-cilegon', title: 'KKMP Cilegon', url: 'https://kkmp.linkproductive.com', sector: 'pemerintahan', featured: true, embeddable: false,
    description: 'Platform digital Koperasi Kelurahan Merah Putih Kota Cilegon: simpan pinjam, katalog UMKM, sembako, dan pengelolaan keuangan koperasi.' },
  { slug: 'blue-forests-mis', title: 'Blue Forests MIS', url: 'https://blue-forest-eta.vercel.app', sector: 'lingkungan', featured: true, embeddable: false,
    description: 'Sistem informasi terintegrasi untuk pengelolaan program, KMEL, lanskap, bukti, dan pengetahuan.' },

  { slug: 'ahm-smart-factory', title: 'AHM Smart Factory Platform', url: 'https://ahm.linkproductive.com', sector: 'industri', embeddable: true,
    description: 'Production intelligence platform untuk memantau operasional pabrik.' },
  { slug: 'pama-smart-mining', title: 'PAMA Smart Mining', url: 'https://pama.linkproductive.com', sector: 'industri', embeddable: false,
    description: 'Remote operation center dan monitoring CCTV berbasis AI untuk operasi pertambangan.' },
  { slug: 'kpp-smart-hauling', title: 'KPP Smart Hauling', url: 'https://kpp.linkproductive.com', sector: 'industri', embeddable: true,
    description: 'Command center monitoring hauling dan manajemen ban terpadu.' },
  { slug: 'ud-smart-fleet', title: 'UD Smart Fleet', url: 'https://ud.linkproductive.com', sector: 'industri', embeddable: true,
    description: 'Platform pemantauan armada kendaraan.' },
  { slug: 'pratama-galuh-perkasa', title: 'Pratama Galuh Perkasa', url: 'https://hrd.linkproductive.com', sector: 'industri', embeddable: false,
    description: 'Website perusahaan logistik: angkutan darat, pengiriman laut, dan solusi logistik kustom.' },

  { slug: 'rbp-redd-gcf-sumbar', title: 'RBP REDD+ GCF Sumatera Barat', url: 'https://gcf-phi.vercel.app', sector: 'lingkungan', embeddable: true,
    description: 'Pusat database, monitoring, pengetahuan, dan publikasi Program RBP REDD+ GCF Output 2 Provinsi Sumatera Barat.' },

  { slug: 'tani-merdeka', title: 'Tani Merdeka', url: 'https://tani-merdeka-gamma.vercel.app', sector: 'pemerintahan', embeddable: false,
    description: 'Platform terpadu untuk data, program bantuan, akses pasar, dan pengetahuan pertanian Indonesia.' },
  { slug: 'tppkk-pulomerak', title: 'TP PKK Kecamatan Pulomerak', url: 'https://tppkkkecamatanpulomerakk.page.gd', sector: 'pemerintahan', embeddable: false,
    description: 'Website TP PKK Kecamatan Pulomerak.' },

  { slug: 'finatra', title: 'FINATRA', url: 'https://finatra.linkproductive.com', sector: 'platform', embeddable: true,
    description: 'Ekosistem pertumbuhan UMKM: platform pembiayaan dan pengelolaan UMKM.' },
  { slug: 'lp-iss', title: 'LP-ISS Industri Class', url: 'https://industriclass.linkproductive.com', sector: 'platform', embeddable: true,
    description: 'Talent dan industry readiness platform: sistem seleksi kelas industri.' },
  { slug: 'linkpromedia', title: 'LinkProMedia.id', url: 'https://media.linkproductive.com', sector: 'platform', embeddable: false,
    description: 'Portal berita nasional, ekonomi, teknologi, olahraga, dan hiburan.' },

  { slug: 'soto-betawi', title: 'Soto Betawi', url: 'https://sotobetawi.vercel.app', sector: 'bisnis', embeddable: false,
    description: 'Website kuliner Soto Betawi.' },
  { slug: 'bpjs-compliance-guard', title: 'BPJS Compliance Guard', url: 'https://bpjs-iota.vercel.app', sector: 'bisnis', embeddable: true,
    description: 'Sistem monitoring dan deteksi risiko kepatuhan BPJS Kesehatan bagi pemberi kerja.' },
]


// ---------------------------------------------------------------------------
// Data contoh untuk dashboard pemantauan (fitur, sub-tugas, catatan, kendala).
// Hanya diterapkan pada project yang belum punya fitur. Tanggal relatif terhadap hari seeding.
// ---------------------------------------------------------------------------
const day = (offset) => new Date(Date.now() + offset * 86400000)
// Fitur: [judul, status, penanggung jawab, [[sub-tugas, selesai?], ...]]
const DEMO = {
  'Sistem Kasir UMKM': {
    client: 'Contoh: Jaringan Toko Ritel',
    startDate: day(-60),
    targetDate: day(30),
    features: [
      ['Autentikasi & hak akses kasir', 'done', 'Andi Wijaya', [['Login & sesi', 1], ['Peran kasir/admin', 1]]],
      ['Transaksi penjualan (POS)', 'done', 'Sari Putri', [['Keranjang & diskon', 1], ['Pembayaran tunai/QRIS', 1], ['Cetak ulang struk', 1]]],
      ['Manajemen stok', 'in_progress', 'Andi Wijaya', [['Master produk', 1], ['Stok masuk', 1], ['Stok opname', 0], ['Notifikasi stok menipis', 0]]],
      ['Laporan penjualan harian', 'in_progress', 'Sari Putri', [['Rekap harian', 1], ['Ekspor PDF', 0]]],
      ['Integrasi printer struk', 'next', 'Andi Wijaya', []],
      ['Mode offline', 'next', null, []],
    ],
    updates: [
      'Modul stok masuk selesai diuji QA. Stok opname dimulai minggu ini.',
      'Demo ke klien berjalan baik; permintaan tambahan: ekspor laporan ke PDF.',
    ],
    blockers: [['Menunggu spesifikasi printer termal dari klien', 'Integrasi printer belum bisa dimulai tanpa model dan driver.', 'medium']],
  },
  'Portal HR Internal': {
    client: 'Contoh: Divisi HRD Internal',
    startDate: day(-45),
    targetDate: day(50),
    features: [
      ['Absensi karyawan', 'done', 'Citra Dewi', [['Check-in/out', 1], ['Rekap bulanan', 1]]],
      ['Pengajuan cuti & approval', 'in_progress', 'Citra Dewi', [['Form pengajuan', 1], ['Alur persetujuan atasan', 0], ['Saldo cuti otomatis', 0]]],
      ['Slip gaji digital', 'next', 'Eko Prasetyo', []],
      ['Dashboard analitik HRD', 'next', null, []],
    ],
    updates: ['Absensi sudah dipakai uji coba oleh 20 karyawan.'],
    blockers: [],
  },
  'Marketplace Tani': {
    client: 'Contoh: Koperasi Tani Mandiri',
    startDate: day(-120),
    targetDate: day(10),
    features: [
      ['Katalog produk & pencarian', 'done', 'Fajar Nugroho', [['Listing produk', 1], ['Filter & kategori', 1]]],
      ['Keranjang & checkout', 'done', 'Hadi Kurniawan', [['Keranjang', 1], ['Pembayaran', 1]]],
      ['Sistem lelang', 'done', 'Fajar Nugroho', []],
      ['Logistik & pengiriman', 'in_progress', 'Hadi Kurniawan', [['Pilihan kurir', 1], ['Pelacakan resi', 0]]],
      ['UAT & perbaikan akhir', 'in_progress', 'Gita Lestari', [['Skenario UAT', 1], ['Perbaikan temuan UAT', 0]]],
    ],
    updates: ['Masuk tahap review. UAT bersama pengurus koperasi dijadwalkan pekan ini.'],
    blockers: [],
  },
  'Aplikasi Logistik Armada': {
    client: 'Contoh: Perusahaan Ekspedisi',
    startDate: day(-90),
    targetDate: day(-5),
    features: [
      ['Peta pelacakan real-time', 'in_progress', 'Joko Susilo', [['Tampilan peta', 1], ['Pembaruan posisi tiap 10 detik', 0]]],
      ['Optimasi rute', 'next', 'Joko Susilo', []],
      ['Estimasi waktu tiba (ETA)', 'next', null, []],
      ['Notifikasi ke pelanggan', 'next', null, []],
    ],
    updates: ['Project ditahan sementara menunggu keputusan anggaran layanan peta.'],
    blockers: [['Anggaran API peta belum disetujui', 'Pelacakan real-time bergantung pada layanan peta berbayar.', 'high']],
  },
  'Company Profile Interaktif': {
    client: 'Contoh: PT Mitra Kreatif',
    startDate: day(-100),
    targetDate: day(-20),
    features: [
      ['Halaman utama & animasi', 'done', 'Kartika Sari', [['Hero', 1], ['Animasi scroll', 1]]],
      ['CMS konten mandiri', 'done', 'Kartika Sari', []],
      ['Optimasi SEO', 'done', 'Lukman Hakim', [['Meta & sitemap', 1], ['Kecepatan halaman', 1]]],
    ],
    updates: ['Situs resmi diluncurkan dan diserahkan ke klien.'],
    blockers: [],
  },
}

async function applyDemo(project, author) {
  const demo = DEMO[project.name]
  if (!demo) return false
  const existing = await prisma.feature.count({ where: { projectId: project.id } })
  if (existing > 0) return false

  const members = await prisma.member.findMany()
  const idOf = (name) => members.find((m) => m.name === name)?.id ?? null

  await prisma.project.update({
    where: { id: project.id },
    data: { client: demo.client, startDate: demo.startDate, targetDate: demo.targetDate },
  })

  const created = []
  for (const [i, [title, status, who, subs]] of demo.features.entries()) {
    created.push(
      await prisma.feature.create({
        data: {
          projectId: project.id,
          title,
          status,
          sortOrder: i,
          assigneeId: who ? idOf(who) : null,
          completedAt: status === 'done' ? new Date() : null,
          subtasks: { create: subs.map(([t, done], j) => ({ title: t, done: Boolean(done), sortOrder: j })) },
        },
        include: { subtasks: true },
      }),
    )
  }

  const pct = projectProgressFrom(created)
  if (pct !== null) await prisma.project.update({ where: { id: project.id }, data: { percentage: pct } })

  // Catatan lama di bawah, terbaru di atas.
  for (const [i, note] of demo.updates.entries()) {
    await prisma.projectUpdate.create({
      data: { projectId: project.id, note, author, createdAt: day(-(demo.updates.length - i) * 4) },
    })
  }
  for (const [title, detail, severity] of demo.blockers) {
    await prisma.blocker.create({ data: { projectId: project.id, title, detail, severity } })
  }
  return true
}

// Cari/buat anggota global berdasarkan nama, lalu tugaskan ke project.
async function assignTeam(projectId, pics) {
  const leadName = (pics.find((p) => p.lead) ?? [...pics].sort((a, b) => b.contribution - a.contribution)[0]).name
  for (const pic of pics) {
    let member = await prisma.member.findFirst({ where: { name: pic.name } })
    if (!member) {
      member = await prisma.member.create({
        data: { name: pic.name, role: pic.role, avatarColor: pic.avatarColor },
      })
    }
    await prisma.projectMember.create({
      data: {
        projectId,
        memberId: member.id,
        role: pic.name === leadName ? 'lead' : 'member',
        contribution: pic.contribution,
      },
    })
  }
}

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
    for (const { pics, ...p } of PROJECTS) {
      const project = await prisma.project.create({ data: p })
      await assignTeam(project.id, pics)
    }
    console.log(`✅ ${PROJECTS.length} project contoh berhasil dibuat.`)
  } else {
    console.log('ℹ️  Project sudah ada, lewati seeding project.')
  }

  // --- Data contoh pemantauan (hanya untuk project yang belum punya fitur) ---
  let demoCount = 0
  for (const project of await prisma.project.findMany()) {
    if (await applyDemo(project, username)) demoCount++
  }
  console.log(`✅ Data pemantauan contoh diterapkan ke ${demoCount} project.`)

  // --- Ratakan PIC utama untuk project contoh yang diberi penanda `lead` ---
  for (const { name, pics } of PROJECTS) {
    const leadPic = pics.find((p) => p.lead)
    if (!leadPic) continue
    const project = await prisma.project.findFirst({ where: { name } })
    const member = await prisma.member.findFirst({ where: { name: leadPic.name } })
    if (!project || !member) continue
    const rows = await prisma.projectMember.findMany({ where: { projectId: project.id } })
    if (rows.find((r) => r.role === 'lead')?.memberId === member.id) continue
    await prisma.projectMember.updateMany({ where: { projectId: project.id }, data: { role: 'member' } })
    await prisma.projectMember.updateMany({ where: { projectId: project.id, memberId: member.id }, data: { role: 'lead' } })
  }

  // --- Showcase (buat jika slug belum ada; edit dari admin tidak ditimpa) ---
  for (const [i, sc] of SHOWCASES.entries()) {
    await prisma.showcase.upsert({
      where: { slug: sc.slug },
      update: {},
      create: { ...sc, sortOrder: i },
    })
  }
  console.log(`✅ ${SHOWCASES.length} karya portofolio siap.`)

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
