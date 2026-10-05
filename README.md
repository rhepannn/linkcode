# LinkCode

Situs software development studio: halaman publik berisi **portofolio karya** dan **progress project yang
sedang berjalan**, plus panel **admin** untuk mengelola semuanya (termasuk dashboard pemantauan project).

## Tech stack

- **Next.js 16** (App Router, JavaScript) + **React 19** + **Tailwind CSS 3.4**
- **Prisma 5** + PostgreSQL di **Supabase**; media di **Supabase Storage**
- Auth admin: JWT (jose) di cookie `httpOnly`; password di-hash dengan bcryptjs
- Hosting yang ditargetkan: **Vercel** (satu proyek untuk UI dan API)

Halaman publik dirender di server (Server Components + ISR) agar konten, metadata, dan data terstruktur
terbaca mesin pencari dan pratinjau tautan tanpa menjalankan JavaScript.

## Struktur

```
src/
├── app/                     # rute (App Router)
│   ├── page.jsx             # beranda (SSR + ISR)
│   ├── karya/[slug]/        # halaman detail tiap karya (SEO)
│   ├── admin/               # panel admin (noindex)
│   ├── api/                 # Route Handlers (REST): auth, project, tim, fitur, karya, unggah, dll.
│   ├── sitemap.js robots.js opengraph-image.jsx icon.svg
│   └── layout.jsx           # font (next/font), metadata dasar
├── components/              # UI: home/, portfolio/, admin/ (+ admin/tracking/)
├── lib/                     # prisma, auth (sesi), rate-limit, storage, parsers, tracking, queries
└── utils/ api/              # util tampilan; klien API untuk panel admin
prisma/                      # schema, migrasi, seed
scripts/                     # capture-showcases, upload-media, api-test
```

## Menjalankan

```bash
npm install                  # juga menjalankan `prisma generate`
cp .env.example .env.local   # isi DATABASE_URL, DIRECT_URL, JWT_SECRET, SUPABASE_*, dll.
npm run db:deploy            # terapkan migrasi ke database
npm run db:seed              # admin awal + data contoh (idempoten)
npm run dev                  # http://localhost:3000
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` / `build` / `start` | pengembangan / build produksi / jalankan hasil build |
| `npm run db:deploy` / `db:migrate` / `db:seed` | migrasi produksi / migrasi dev / seed |
| `npm run test:api` | uji API end-to-end (±136 pemeriksaan) terhadap server yang berjalan |
| `npm run capture` | ambil screenshot & video tiap karya (Playwright), unggah ke Storage |
| `npm run upload-media` | pindahkan media lokal ke Storage (`--dry-run`, `--repair`) |

Admin awal: username dari `SEED_ADMIN_USERNAME`, password dari `SEED_ADMIN_PASSWORD`. Ganti lewat
**Admin → Pengaturan → Ganti password**.

## Deploy ke Vercel

1. Impor repo ke Vercel (framework Next.js terdeteksi; `vercel.json` menetapkan region **hnd1/Tokyo**,
   dekat database Supabase — ubah bila database Anda di region lain).
2. Isi Environment Variables (lihat `.env.example`). Poin penting:
   - `DATABASE_URL` → **transaction pooler `:6543`** dengan `?pgbouncer=true&connection_limit=1`
     (serverless membuka banyak instance singkat; session pooler `:5432` cepat habis kuotanya).
   - `DIRECT_URL` → koneksi `:5432` (hanya untuk migrasi).
   - `JWT_SECRET` (≥ 32 karakter, **baru**, jangan salin dari lokal), `SUPABASE_URL`,
     `SUPABASE_SERVICE_ROLE_KEY` (rahasia, hanya server), `NEXT_PUBLIC_SITE_URL` (domain produksi).
3. Terapkan migrasi sekali dari mesin Anda ke database produksi: `npm run db:deploy`
   (jangan memakai `db:migrate` di produksi). Lalu `npm run db:seed` untuk admin awal.
4. Deploy. Setelah itu cek: `/sitemap.xml`, `/robots.txt`, dan login admin.

> **Satu database untuk dev dan produksi berarti uji coba lokal mengubah data produksi.**
> Disarankan project Supabase terpisah untuk produksi.

## SEO

- Metadata per halaman (`generateMetadata`), canonical, Open Graph + Twitter card, gambar OG bawaan.
- JSON-LD: `Organization`, `WebSite`, `ItemList` (beranda); `CreativeWork` + `BreadcrumbList` (tiap karya).
- Setiap karya punya halaman sendiri `/karya/[slug]` yang dirender statis (ISR) dan masuk `sitemap.xml`.
- `/admin` dan `/api` tidak diindeks (`robots.txt`, header `X-Robots-Tag`, meta `noindex`).
- Perubahan di admin langsung menyegarkan halaman publik (`revalidatePath`), tanpa build ulang.
- Isi `NEXT_PUBLIC_SITE_URL` dengan domain produksi agar canonical/sitemap benar.

## Keamanan

- Sesi: cookie `httpOnly`, `SameSite=Strict`, `Secure` di produksi; token tidak pernah ada di JavaScript.
- Permintaan berbasis cookie yang mengubah data wajib header `Origin` yang sama (proteksi CSRF).
- Login dibatasi **5 percobaan/menit per IP** (tabel `LoginAttempt`, bekerja lintas instance serverless);
  waktu respons konstan agar username tidak bisa ditebak.
- Tabel Supabase memakai Row Level Security tanpa kebijakan: tidak terbaca lewat REST publik (anon key).
- Unggahan media diperiksa isinya (magic bytes) dan ukurannya; berkas tidak sesuai dihapus otomatis.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server.

## Media portofolio (Supabase Storage)

Gambar/video karya disimpan di bucket publik, bukan di git. Browser mengunggah **langsung** ke Supabase
lewat signed URL (tidak melewati fungsi serverless, jadi tidak terkena batas body ±4,5 MB), lalu server
memverifikasi.

1. Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Project Settings → API).
2. **Admin → Portofolio → Edit**: tombol *Unggah* di tiap kolom media (JPG/PNG/WebP ≤ 8–12 MB, WebM/MP4 ≤ 25 MB).
   Media yang diganti atau karya yang dihapus ikut dibersihkan dari bucket.
3. `npm run capture` (butuh `npx playwright install chromium` sekali) membuat screenshot + video semua karya
   dan mengunggahnya (`--local` untuk menyimpan ke `public/showcases/` saja; folder itu tidak ikut git).
4. `npm run upload-media -- --repair` memeriksa tiap URL Storage di database dan mengunggah ulang dari
   `public/showcases/` bila objeknya hilang.

## Pemantauan project (admin)

**Admin → Dashboard** merangkum semua project: berjalan, selesai, ditahan, rata-rata progres, dan daftar
"Perlu perhatian". Klik project untuk membuka detailnya:

- **Fitur** — papan 3 kolom (Sedang dikerjakan / Berikutnya / Selesai), tiap fitur punya sub-tugas,
  penanggung jawab, dan tenggat. **Persen progres project dihitung otomatis**: rata-rata progres fitur
  (fitur selesai = 100%, selain itu sub-tugas selesai ÷ total). Project tanpa fitur memakai persen manual.
- **Tim** — anggota global (menu **Tim**) ditugaskan ke project. **PIC utama dipilih manual**, tidak ditentukan
  oleh besar kontribusi.
- **Catatan** — linimasa perkembangan berkala. **Kendala** — risiko/blocker dengan tingkat keparahan.

Kesehatan project dihitung server: `done`, `hold`, `overdue` (lewat target & belum 100%), `at_risk`
(progres tertinggal >15 poin dari jadwal, atau ada kendala Tinggi yang terbuka), `on_track`.

`GET /api/projects` (publik) hanya mengembalikan field aman (tanpa klien, link, catatan, kendala).

## API

Semua rute berada di `src/app/api`. Yang bertanda 🔒 butuh sesi admin (cookie) atau `Authorization: Bearer`.

| Endpoint | Keterangan |
|---|---|
| `POST /api/auth/login` · `logout` · `GET /api/auth/me` · `POST change-password` | sesi admin |
| `GET /api/projects` | publik, field aman |
| 🔒 `GET /api/projects/overview` · `GET/PUT/DELETE /api/projects/:id` · `POST /api/projects` · `PUT /:id/team` | project & tim |
| 🔒 `POST /api/projects/:id/features` · `PUT/DELETE /api/features/:id` · `POST /api/features/:id/subtasks` · `PUT/DELETE /api/subtasks/:id` | fitur & sub-tugas |
| 🔒 `POST /api/projects/:id/updates` · `DELETE /api/updates/:id` · `POST /api/projects/:id/blockers` · `PUT/DELETE /api/blockers/:id` | catatan & kendala |
| 🔒 `GET/POST /api/members` · `PUT/DELETE /api/members/:id` | anggota tim |
| `GET /api/showcases` (publik) · 🔒 `GET /all` · `POST` · `PUT/DELETE /:id` | karya portofolio |
| 🔒 `POST /api/uploads/sign` · `POST /api/uploads/confirm` · `DELETE /api/uploads` | unggah media |
| `GET /api/settings` (publik) · 🔒 `PUT /api/settings` | pengaturan (nomor WhatsApp) |

## Tema

Soft editorial: krem hangat, tinta kehijauan, aksen olive. Font: Cormorant Garamond (judul), DM Sans (teks),
JetBrains Mono (label), dimuat lewat `next/font`. Panel admin memakai gaya netral (abu + aksen olive).

| Token | Hex | Penggunaan |
|---|---|---|
| `cream` | `#F3EEE6` | Latar halaman |
| `paper` | `#FBF8F3` | Kartu / permukaan |
| `ink` / `ink-soft` | `#1E211D` / `#5C6157` | Teks utama / sekunder |
| `olive` | `#5C6E21` | Aksen utama |
| `sand` / `sand-light` | `#B8A58A` / `#E4DAC8` | Aksen hangat / garis halus |
| `clay` | `#BD3D44` | Peringatan, status On Hold |
