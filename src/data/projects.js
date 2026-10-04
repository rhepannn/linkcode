// Data mock untuk halaman publik — dipakai sebagai fallback jika API gagal,
// dan untuk pengembangan frontend tanpa backend.
export const MOCK_PROJECTS = [
  {
    id: 1,
    name: 'Sistem Kasir UMKM',
    description:
      'Aplikasi point-of-sale berbasis web untuk toko ritel dengan manajemen stok, laporan penjualan harian, dan cetak struk.',
    percentage: 72,
    status: 'active',
    icon: '🛒',
    pics: [
      { id: 1, name: 'Andi Wijaya', role: 'Lead Developer', contribution: 45, avatarColor: '#1E5FA8' },
      { id: 2, name: 'Sari Putri', role: 'Frontend Dev', contribution: 35, avatarColor: '#4A90D9' },
      { id: 3, name: 'Budi Santoso', role: 'QA Engineer', contribution: 20, avatarColor: '#0D2B4E' },
    ],
  },
  {
    id: 2,
    name: 'Portal HR Internal',
    description:
      'Platform manajemen karyawan: absensi, pengajuan cuti, slip gaji digital, dan dashboard analitik untuk HRD.',
    percentage: 48,
    status: 'active',
    icon: '👔',
    pics: [
      { id: 4, name: 'Citra Dewi', role: 'Fullstack Dev', contribution: 60, avatarColor: '#1E5FA8' },
      { id: 5, name: 'Eko Prasetyo', role: 'Backend Dev', contribution: 40, avatarColor: '#4A90D9' },
    ],
  },
  {
    id: 3,
    name: 'Marketplace Tani',
    description:
      'Marketplace yang menghubungkan petani langsung ke pembeli grosir, lengkap dengan sistem lelang dan logistik.',
    percentage: 90,
    status: 'review',
    icon: '🌾',
    pics: [
      { id: 6, name: 'Fajar Nugroho', role: 'Lead Developer', contribution: 50, avatarColor: '#0D2B4E' },
      { id: 7, name: 'Gita Lestari', role: 'UI/UX Designer', contribution: 25, avatarColor: '#4A90D9' },
      { id: 8, name: 'Hadi Kurniawan', role: 'Backend Dev', contribution: 25, avatarColor: '#1E5FA8' },
    ],
  },
  {
    id: 4,
    name: 'Aplikasi Logistik Armada',
    description:
      'Pelacakan armada pengiriman real-time dengan rute optimal, estimasi waktu tiba, dan notifikasi ke pelanggan.',
    percentage: 30,
    status: 'hold',
    icon: '🚚',
    pics: [
      { id: 9, name: 'Indah Permata', role: 'Project Manager', contribution: 40, avatarColor: '#1E5FA8' },
      { id: 10, name: 'Joko Susilo', role: 'Mobile Dev', contribution: 60, avatarColor: '#4A90D9' },
    ],
  },
  {
    id: 5,
    name: 'Company Profile Interaktif',
    description:
      'Website company profile dengan animasi modern, CMS untuk update konten mandiri, dan optimasi SEO.',
    percentage: 100,
    status: 'done',
    icon: '🌐',
    pics: [
      { id: 11, name: 'Kartika Sari', role: 'Frontend Dev', contribution: 70, avatarColor: '#4A90D9' },
      { id: 12, name: 'Lukman Hakim', role: 'SEO Specialist', contribution: 30, avatarColor: '#0D2B4E' },
    ],
  },
  {
    id: 6,
    name: 'Dashboard Analitik Bisnis',
    description:
      'Dashboard BI yang menggabungkan data penjualan, marketing, dan operasional menjadi visualisasi yang mudah dibaca.',
    percentage: 55,
    status: 'active',
    icon: '📊',
    pics: [
      { id: 13, name: 'Maya Anggraini', role: 'Data Engineer', contribution: 55, avatarColor: '#1E5FA8' },
      { id: 14, name: 'Nanda Pratama', role: 'Frontend Dev', contribution: 45, avatarColor: '#4A90D9' },
    ],
  },
]
