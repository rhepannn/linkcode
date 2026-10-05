# LinkCode

Portfolio publik untuk software development studio. Dua halaman: **Public** (`/`) untuk calon klien dan **Admin** (`/admin`) untuk tim internal.

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, React Router v6, Zustand, Recharts, Axios
- **Backend:** Node.js + Express, PostgreSQL, Prisma, JWT, bcrypt

JWT disimpan di **memory (Zustand)** — bukan localStorage/cookie. Token kedaluwarsa 8 jam.

## Struktur

```
linkcode/
├── src/            # Frontend (Vite)
│   ├── components/  pages/  store/  hooks/  api/  utils/  data/
├── backend/        # Express API + Prisma
│   ├── routes/  middleware/  prisma/  index.js
└── package.json
```

## Menjalankan Frontend

```bash
npm install
cp .env.example .env        # sesuaikan VITE_WHATSAPP_NUMBER
npm run dev                 # http://localhost:5173
```

Halaman publik **bisa jalan tanpa backend** — otomatis fallback ke data mock di `src/data/projects.js` jika API tidak tersedia.

## Menjalankan Backend

Database: **Supabase (PostgreSQL)**. Buat project di supabase.com, lalu ambil connection string dari
*Dashboard → Connect → ORMs → Prisma*.

```bash
cd backend
npm install
cp .env.example .env        # isi DATABASE_URL (pooler :6543), DIRECT_URL (:5432), JWT_SECRET
npm run prisma:deploy       # terapkan semua migrasi (buat tabel + aktifkan RLS)
npm run seed                # buat admin, project contoh + data pemantauan contoh
npm run dev                 # http://localhost:3000
```

- `DATABASE_URL` = **session pooler (:5432)** untuk runtime server Express (±5× lebih cepat per query daripada
  transaction pooler :6543). Pakai :6543 + `?pgbouncer=true` hanya jika di-deploy serverless.
- `DIRECT_URL` = koneksi langsung/session pooler, dipakai Prisma untuk migrasi.
- Migrasi `enable_rls` mengunci tabel dari REST API publik Supabase (anon key); backend tetap
  bisa akses karena Prisma memakai role `postgres`.
- Membuat migrasi baru saat development: `npm run prisma:migrate -- --name nama_perubahan`.

Kredensial admin default dari seed: **`admin` / `admin123`** (ubah via `SEED_ADMIN_*` di `.env`).

## API Endpoints

| Method | Endpoint              | Auth | Keterangan              |
| ------ | --------------------- | ---- | ----------------------- |
| POST   | `/api/auth/login`     | —    | Login → `{ token }` (rate limit 5/menit) |
| GET    | `/api/projects`       | —    | Semua project + PICs    |
| POST   | `/api/projects`       | ✅   | Buat project            |
| PUT    | `/api/projects/:id`   | ✅   | Edit project            |
| DELETE | `/api/projects/:id`   | ✅   | Hapus project           |
| POST   | `/api/auth/change-password` | ✅ | Ganti password admin |
| GET    | `/api/settings`       | —    | Pengaturan publik (nomor WhatsApp) |
| PUT    | `/api/settings`       | ✅   | Ubah pengaturan         |
| GET    | `/api/showcases`      | —    | Karya portofolio yang `published` |
| GET    | `/api/showcases/all`  | ✅   | Semua karya, termasuk yang disembunyikan |
| POST   | `/api/showcases`      | ✅   | Tambah karya            |
| PUT    | `/api/showcases/:id`  | ✅   | Ubah karya (replace penuh) |
| DELETE | `/api/showcases/:id`  | ✅   | Hapus karya             |

## Pemantauan project (admin)

**Admin → Dashboard** merangkum semua project: berjalan, selesai, ditahan, rata-rata progres, dan daftar
"Perlu perhatian". Klik project untuk membuka detailnya:

- **Fitur** — papan 3 kolom (Sedang dikerjakan / Berikutnya / Selesai), tiap fitur punya sub-tugas,
  penanggung jawab, dan tenggat. **Persen progres project dihitung otomatis**: rata-rata progres fitur
  (fitur selesai = 100%, selain itu sub-tugas selesai ÷ total). Project tanpa fitur memakai persen manual.
  Status fitur mengikuti sub-tugas (semua selesai → Selesai; ada yang dicentang → Sedang dikerjakan).
- **Tim** — anggota global (menu **Tim**) ditugaskan ke project. **PIC utama dipilih manual**, tidak ditentukan
  oleh besar kontribusi.
- **Catatan** — linimasa perkembangan berkala.
- **Kendala** — risiko/blocker dengan tingkat keparahan; yang masih terbuka dan berat menandai project *At risk*.

Indikator kesehatan (dihitung server): `done`, `hold`, `overdue` (lewat target & belum 100%),
`at_risk` (progres tertinggal >15 poin dari jadwal, atau ada kendala Tinggi yang terbuka), `on_track`.

Endpoint admin (semua butuh token): `GET /api/projects/overview`, `GET /api/projects/:id`,
`PUT /api/projects/:id/team`, `/api/members`, `POST /api/projects/:id/features`, `/api/features/:id`,
`/api/features/:id/subtasks`, `/api/subtasks/:id`, `/api/projects/:id/updates`, `/api/projects/:id/blockers`.
`GET /api/projects` (publik) hanya mengembalikan field aman (tanpa klien, link, catatan, kendala).

## Portofolio

Karya dikelola dari **Admin → Portofolio** (tambah/edit/hapus, saklar Tayang/Unggulan/Iframe, urutan).
Gambar dan video pratinjau dibuat otomatis oleh skrip penangkap (butuh `npm install` di `backend/`
dan `npx playwright install chromium` sekali saja):

```bash
cd backend
npm run capture                              # semua karya yang tayang
npm run capture -- --only rata-coffee,finatra
npm run capture -- --no-video                # hanya screenshot
```

Hasilnya ke `public/showcases/` dan URL-nya otomatis diisi ke database. Folder ini **tidak ikut git**
(`.gitignore`): jalankan ulang `npm run capture` di tiap lingkungan baru (dev/deploy) sebelum galeri
menampilkan gambar, atau pindahkan medianya ke penyimpanan lain dan isi URL-nya dari Admin → Portofolio. Jika sebuah situs memblokir
iframe, biarkan saklar **Iframe** mati agar modal memakai video.

## Tema

Soft editorial: krem hangat, tinta kehijauan, aksen olive. Font: Cormorant Garamond (judul),
DM Sans (teks), JetBrains Mono (label). Halaman admin memakai gaya netral (abu + aksen olive).

| Token        | Hex       | Penggunaan                      |
| ------------ | --------- | ------------------------------- |
| `cream`      | `#F3EEE6` | Latar halaman                   |
| `paper`      | `#FBF8F3` | Kartu / permukaan               |
| `ink`        | `#1E211D` | Teks utama                      |
| `ink-soft`   | `#5C6157` | Teks sekunder                   |
| `olive`      | `#5C6E21` | Aksen utama                     |
| `sand`       | `#B8A58A` | Aksen hangat                    |
| `sand-light` | `#E4DAC8` | Garis & border halus            |
| `clay`       | `#BD3D44` | Peringatan / status On Hold     |
