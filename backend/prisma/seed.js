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
