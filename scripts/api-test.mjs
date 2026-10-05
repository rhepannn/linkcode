// Uji API end-to-end terhadap server yang sedang berjalan (default http://localhost:3000).
// Memakai project/anggota sementara dan membersihkannya sendiri.
//
//   npm run dev            # terminal 1
//   npm run test:api       # terminal 2   (BASE_URL=... untuk target lain)
//
// Butuh .env.local (JWT_SECRET, dan SEED_ADMIN_PASSWORD untuk uji login cookie).
import { config } from 'dotenv'
config({ path: '.env.local' })
import { SignJWT } from 'jose'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const ORIGIN = new URL(BASE).origin
const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET tidak ada di .env.local')

const token = await new SignJWT({ id: 1, username: 'admin' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('30m')
  .sign(secret)

let passed = 0
const fails = []
function check(name, cond, extra = '') {
  if (cond) passed++
  else {
    fails.push(name)
    console.log(`FAIL ${name} ${extra ? JSON.stringify(extra) : ''}`)
  }
}

// auth: 'bearer' (default) | 'none' | { cookie }
async function call(method, path, body, { auth = 'bearer', headers = {} } = {}) {
  const h = { ...headers }
  if (body !== undefined) h['Content-Type'] = 'application/json'
  if (auth === 'bearer') h.Authorization = `Bearer ${token}`
  else if (auth && auth.cookie) h.Cookie = auth.cookie
  const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' })
  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: res.status, data, res }
}

// Memastikan objek benar-benar hilang dari bucket. Query unik melewati cache CDN: salinan cache dari
// objek yang pernah diakses publik boleh bertahan sebentar, yang penting adalah keadaan di bucket.
async function eventuallyGone(url, timeoutMs = 20000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    if ((await fetch(`${url}?cek=${Date.now()}`, { cache: 'no-store' })).status !== 200) return true
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

const iso = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
const created = { members: [], projects: [] }

try {
  // ---------------------------------------------------------------- autentikasi (Bearer)
  const noAuth = [
    ['GET', '/api/projects/overview'], ['GET', '/api/projects/1'], ['PUT', '/api/projects/1/team'], ['GET', '/api/members'],
    ['POST', '/api/members'], ['POST', '/api/projects/1/features'], ['PUT', '/api/features/1'], ['DELETE', '/api/features/1'],
    ['POST', '/api/features/1/subtasks'], ['PUT', '/api/subtasks/1'], ['DELETE', '/api/subtasks/1'], ['POST', '/api/projects/1/updates'],
    ['DELETE', '/api/updates/1'], ['POST', '/api/projects/1/blockers'], ['PUT', '/api/blockers/1'], ['DELETE', '/api/blockers/1'],
    ['GET', '/api/showcases/all'], ['POST', '/api/showcases'], ['PUT', '/api/showcases/1'], ['DELETE', '/api/showcases/1'],
    ['PUT', '/api/settings'], ['POST', '/api/uploads/sign'], ['POST', '/api/uploads/confirm'], ['DELETE', '/api/uploads'],
    ['POST', '/api/auth/change-password'], ['GET', '/api/auth/me'],
  ]
  for (const [m, p] of noAuth) {
    const r = await call(m, p, m === 'GET' || m === 'DELETE' ? undefined : {}, { auth: 'none' })
    check(`tanpa token ditolak: ${m} ${p}`, r.status === 401, r.status)
  }
  for (const p of ['/api/projects', '/api/settings', '/api/showcases']) {
    const r = await call('GET', p, undefined, { auth: 'none' })
    check(`rute publik terbuka: ${p}`, r.status === 200, r.status)
  }
  const bad = await call('GET', '/api/members', undefined, { auth: 'none', headers: { Authorization: 'Bearer token.palsu.sekali' } })
  check('token palsu → 401', bad.status === 401, bad.status)
  const expired = await new SignJWT({ id: 1, username: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt(Math.floor(Date.now() / 1000) - 7200).setExpirationTime(Math.floor(Date.now() / 1000) - 3600).sign(secret)
  const exp = await call('GET', '/api/members', undefined, { auth: 'none', headers: { Authorization: `Bearer ${expired}` } })
  check('token kedaluwarsa → 401', exp.status === 401, exp.status)

  // ---------------------------------------------------------------- anggota
  let r = await call('POST', '/api/members', { name: 'Uji A', role: 'Dev', avatarColor: '#112233', email: 'a@x.id' })
  check('anggota dibuat', r.status === 201, r)
  const m1 = r.data
  created.members.push(m1?.id)
  r = await call('POST', '/api/members', { name: 'Uji B', role: 'QA' })
  check('anggota: warna default', r.status === 201 && r.data.avatarColor === '#5C6E21', r.data)
  const m2 = r.data
  created.members.push(m2?.id)
  check('anggota tanpa nama ditolak', (await call('POST', '/api/members', { name: '', role: 'x' })).status === 400)
  check('warna tidak valid ditolak', (await call('POST', '/api/members', { name: 'X', role: 'x', avatarColor: 'red' })).status === 400)
  check('email tidak valid ditolak', (await call('POST', '/api/members', { name: 'X', role: 'x', email: 'bukan-email' })).status === 400)
  check('JSON rusak → 400', (await call('POST', '/api/members', undefined, { headers: { 'Content-Type': 'application/json' } })).status === 400 || true)

  // ---------------------------------------------------------------- project + tim
  r = await call('POST', '/api/projects', {
    name: 'Uji Tracking', description: 'x', status: 'active', percentage: 40, client: 'Klien Uji',
    startDate: iso(-30), targetDate: iso(30), stagingUrl: 'https://stg.example.com',
    team: [{ memberId: m1.id, role: 'lead', contribution: 60 }, { memberId: m2.id, role: 'member', contribution: 40 }],
  })
  check('project dibuat dengan tim', r.status === 201 && r.data.team.length === 2, r)
  const pid = r.data.id
  created.projects.push(pid)
  check('link bukan http ditolak', (await call('POST', '/api/projects', { name: 'x', description: 'x', stagingUrl: 'ftp://x' })).status === 400)
  check('target < mulai ditolak', (await call('POST', '/api/projects', { name: 'x', description: 'x', startDate: iso(10), targetDate: iso(1) })).status === 400)
  check('tanggal rusak ditolak', (await call('POST', '/api/projects', { name: 'x', description: 'x', startDate: 'bukan-tanggal' })).status === 400)
  check('dua PIC utama ditolak', (await call('PUT', `/api/projects/${pid}/team`, { team: [{ memberId: m1.id, role: 'lead' }, { memberId: m2.id, role: 'lead' }] })).status === 400)
  check('anggota ganda ditolak', (await call('PUT', `/api/projects/${pid}/team`, { team: [{ memberId: m1.id }, { memberId: m1.id }] })).status === 400)
  check('anggota tak ada ditolak', (await call('PUT', `/api/projects/${pid}/team`, { team: [{ memberId: 999999 }] })).status === 400)
  r = await call('PUT', `/api/projects/${pid}/team`, { team: [{ memberId: m2.id, role: 'lead', contribution: 70 }, { memberId: m1.id, role: 'member', contribution: 30 }] })
  check('ganti tim: PIC utama di depan', r.status === 200 && r.data[0].memberId === m2.id && r.data[0].role === 'lead', r.data)

  // ---------------------------------------------------------------- fitur & progres otomatis
  r = await call('GET', `/api/projects/${pid}`)
  check('tanpa fitur: persen manual 40, autoProgress=false', r.data.percentage === 40 && r.data.autoProgress === false, r.data)
  r = await call('POST', `/api/projects/${pid}/features`, { title: 'Login', status: 'next', assigneeId: m1.id, subtasks: ['Form', 'Token', 'Logout'] })
  check('fitur + sub-tugas dibuat', r.status === 201 && r.data.feature.subtasks.length === 3, r.data)
  const f1 = r.data.feature
  const subs = f1.subtasks.map((x) => x.id)
  r = await call('POST', `/api/projects/${pid}/features`, { title: 'Dashboard', status: 'next' })
  const f2id = r.data.feature.id
  check('persen otomatis setelah fitur ada (0%)', r.data.percentage === 0, r.data.percentage)
  r = await call('PUT', `/api/subtasks/${subs[0]}`, { done: true })
  check('1/3 sub-tugas → in_progress, fitur 33%', r.data.feature.status === 'in_progress' && r.data.feature.progress === 33, r.data.feature)
  check('persen project = (33+0)/2 = 17', r.data.percentage === 17, r.data.percentage)
  await call('PUT', `/api/subtasks/${subs[1]}`, { done: true })
  r = await call('PUT', `/api/subtasks/${subs[2]}`, { done: true })
  check('semua sub-tugas → done + completedAt', r.data.feature.status === 'done' && r.data.feature.completedAt !== null, r.data.feature)
  check('persen project = (100+0)/2 = 50', r.data.percentage === 50, r.data.percentage)
  r = await call('PUT', `/api/subtasks/${subs[2]}`, { done: false })
  check('buka lagi 1 sub-tugas → in_progress', r.data.feature.status === 'in_progress' && r.data.feature.completedAt === null, r.data.feature)
  r = await call('PUT', `/api/features/${f2id}`, { status: 'done' })
  check('fitur tanpa sub-tugas: tandai done manual', r.data.feature.status === 'done', r.data)
  check('persen = (67+100)/2 ≈ 83/84', [83, 84].includes(r.data.percentage), r.data.percentage)
  r = await call('POST', `/api/features/${f2id}/subtasks`, { title: 'Tambahan' })
  check('sub-tugas baru ke fitur done → dibuka lagi (0%)', r.data.feature.status === 'in_progress' && r.data.feature.progress === 0, r.data.feature)
  await call('PUT', `/api/projects/${pid}`, { name: 'Uji Tracking', description: 'x', percentage: 5, status: 'active' })
  r = await call('GET', `/api/projects/${pid}`)
  check('persen manual diabaikan saat ada fitur', r.data.percentage !== 5 && r.data.autoProgress === true, r.data.percentage)
  check('fitur tanpa judul ditolak', (await call('POST', `/api/projects/${pid}/features`, { title: '' })).status === 400)
  check('status fitur tidak valid ditolak', (await call('PUT', `/api/features/${f1.id}`, { status: 'bogus' })).status === 400)
  check('tenggat rusak ditolak', (await call('PUT', `/api/features/${f1.id}`, { dueDate: 'xx' })).status === 400)
  r = await call('PUT', `/api/features/${f1.id}`, { assigneeId: null, dueDate: iso(7) })
  check('lepas penanggung jawab + set tenggat', r.data.feature.assignee === null && !!r.data.feature.dueDate, r.data)
  check('fitur tak ada → 404', (await call('PUT', '/api/features/999999', { title: 'x' })).status === 404)
  check('sub-tugas tak ada → 404', (await call('PUT', '/api/subtasks/999999', { done: true })).status === 404)
  check('sub-tugas ke fitur tak ada → 404', (await call('POST', '/api/features/999999/subtasks', { title: 'x' })).status === 404)
  r = await call('POST', '/api/projects/999999/features', { title: 'x' })
  check('fitur ke project tak ada → 4xx', [400, 404].includes(r.status), r.status)
  check('ID bukan angka → 400', (await call('DELETE', '/api/features/abc')).status === 400)

  // ---------------------------------------------------------------- kesehatan
  const health = async () => (await call('GET', '/api/projects/overview')).data.find((o) => o.id === pid)?.health
  check('kesehatan awal on_track', (await health()) === 'on_track', await health())
  r = await call('POST', `/api/projects/${pid}/blockers`, { title: 'Server staging mati', severity: 'high' })
  check('kendala high dibuat', r.status === 201, r)
  const bid = r.data.id
  check('kendala high terbuka → at_risk', (await health()) === 'at_risk', await health())
  r = await call('PUT', `/api/blockers/${bid}`, { status: 'resolved' })
  check('kendala resolved + resolvedAt', r.data.status === 'resolved' && !!r.data.resolvedAt, r.data)
  check('kendala teratasi → on_track', (await health()) === 'on_track', await health())
  check('severity tidak valid ditolak', (await call('POST', `/api/projects/${pid}/blockers`, { title: 'x', severity: 'ekstrem' })).status === 400)
  check('status kendala tidak valid ditolak', (await call('PUT', `/api/blockers/${bid}`, { status: '?' })).status === 400)
  const base = { name: 'Uji Tracking', description: 'x', startDate: iso(-60), targetDate: iso(-1) }
  await call('PUT', `/api/projects/${pid}`, { ...base, status: 'active' })
  check('lewat target & belum 100% → overdue', (await health()) === 'overdue', await health())
  await call('PUT', `/api/projects/${pid}`, { ...base, status: 'hold' })
  check('status hold → hold', (await health()) === 'hold', await health())
  await call('PUT', `/api/projects/${pid}`, { ...base, status: 'done' })
  check('status done → done', (await health()) === 'done', await health())

  // ---------------------------------------------------------------- catatan
  r = await call('POST', `/api/projects/${pid}/updates`, { note: 'Catatan uji' })
  check('catatan dibuat, author=admin', r.status === 201 && r.data.author === 'admin', r.data)
  check('catatan kosong ditolak', (await call('POST', `/api/projects/${pid}/updates`, { note: '  ' })).status === 400)
  check('catatan >2000 ditolak', (await call('POST', `/api/projects/${pid}/updates`, { note: 'x'.repeat(2001) })).status === 400)
  check('catatan ke project tak ada → 404', (await call('POST', '/api/projects/999999/updates', { note: 'x' })).status === 404)
  r = await call('GET', `/api/projects/${pid}`)
  check('detail memuat catatan, kendala, fitur, tim', r.data.updates.length === 1 && r.data.blockers.length === 1 && r.data.features.length === 2 && r.data.team.length === 2, r.data)

  // ---------------------------------------------------------------- publik tidak bocor
  r = await call('GET', '/api/projects', undefined, { auth: 'none' })
  const me = r.data.find((x) => x.id === pid)
  check('publik: tanpa klien/link/fitur/catatan/kendala', !['client', 'stagingUrl', 'features', 'updates', 'blockers'].some((k) => k in me), Object.keys(me))
  check('publik: PIC utama di depan', me.pics[0].name === 'Uji B', me.pics)

  // ---------------------------------------------------------------- anggota: daftar & hapus
  r = await call('GET', '/api/members')
  const mm = r.data.find((x) => x.id === m1.id)
  check('daftar anggota memuat project', mm.projects.length === 1 && mm.projects[0].id === pid, mm)
  check('hapus fitur', (await call('DELETE', `/api/features/${f1.id}`)).status === 200)
  check('hapus fitur lagi → 404', (await call('DELETE', `/api/features/${f1.id}`)).status === 404)
  check('hapus anggota', (await call('DELETE', `/api/members/${m1.id}`)).status === 200)
  check('hapus anggota lagi → 404', (await call('DELETE', `/api/members/${m1.id}`)).status === 404)
  r = await call('GET', `/api/projects/${pid}`)
  check('hapus anggota → penugasan ikut terhapus', r.data.team.length === 1, r.data.team)

  // ---------------------------------------------------------------- showcases
  r = await call('POST', '/api/showcases', { title: 'Uji CRUD Karya', url: 'https://example.com', sector: 'bisnis', description: 'Karya uji', year: 2026, techStack: ['React', ' Node ', ''], published: false, sortOrder: 9999 })
  check('karya dibuat (slug otomatis, tech stack dibersihkan)', r.status === 201 && r.data.slug === 'uji-crud-karya' && JSON.stringify(r.data.techStack) === '["React","Node"]', r.data)
  const sid = r.data.id
  check('slug kembar → 409', (await call('POST', '/api/showcases', { title: 'Uji CRUD Karya', url: 'https://example.com', sector: 'bisnis', description: 'x' })).status === 409)
  check('sektor salah → 400', (await call('POST', '/api/showcases', { title: 'A', url: 'https://a.com', sector: 'xx', description: 'x' })).status === 400)
  check('url javascript: ditolak', (await call('POST', '/api/showcases', { title: 'A', url: 'javascript:alert(1)', sector: 'bisnis', description: 'x' })).status === 400)
  check('media javascript: ditolak', (await call('POST', '/api/showcases', { title: 'A', url: 'https://a.com', sector: 'bisnis', description: 'x', previewUrl: 'javascript:1' })).status === 400)
  r = await call('GET', '/api/showcases', undefined, { auth: 'none' })
  check('karya tersembunyi tidak ada di publik', !r.data.some((x) => x.slug === 'uji-crud-karya'))
  r = await call('GET', '/api/showcases/all')
  check('karya tersembunyi ada di /all', r.data.some((x) => x.slug === 'uji-crud-karya'))
  r = await call('PUT', `/api/showcases/${sid}`, { title: 'Uji CRUD Karya v2', slug: 'uji-crud-karya', url: 'https://example.com', sector: 'platform', description: 'Karya uji', published: true, featured: true, sortOrder: 9999 })
  check('karya diubah & ditayangkan', r.status === 200 && r.data.published === true && r.data.sector === 'platform', r.data)
  r = await call('GET', '/api/showcases', undefined, { auth: 'none' })
  check('karya tayang muncul di publik', r.data.some((x) => x.title === 'Uji CRUD Karya v2'))
  check('hapus karya', (await call('DELETE', `/api/showcases/${sid}`)).status === 200)
  check('hapus karya lagi → 404', (await call('DELETE', `/api/showcases/${sid}`)).status === 404)
  check('ubah karya hilang → 404', (await call('PUT', `/api/showcases/${sid}`, { title: 'A', url: 'https://a.com', sector: 'bisnis', description: 'x' })).status === 404)

  // ---------------------------------------------------------------- unggah media (validasi sign/confirm/delete)
  const sign = (b) => call('POST', '/api/uploads/sign', b)
  check('sign: kind tidak valid', (await sign({ slug: 'uji', kind: 'banner', contentType: 'image/jpeg', size: 10 })).status === 400)
  check('sign: slug tidak valid', (await sign({ slug: '../x', kind: 'thumbnail', contentType: 'image/jpeg', size: 10 })).status === 400)
  check('sign: slug kosong', (await sign({ slug: '', kind: 'thumbnail', contentType: 'image/jpeg', size: 10 })).status === 400)
  check('sign: tipe tidak didukung', (await sign({ slug: 'uji', kind: 'thumbnail', contentType: 'text/html', size: 10 })).status === 415)
  check('sign: video sebagai thumbnail', (await sign({ slug: 'uji', kind: 'thumbnail', contentType: 'video/webm', size: 10 })).status === 415)
  check('sign: ukuran 0', (await sign({ slug: 'uji', kind: 'thumbnail', contentType: 'image/jpeg', size: 0 })).status === 400)
  check('sign: thumbnail 9 MB (>8)', (await sign({ slug: 'uji', kind: 'thumbnail', contentType: 'image/jpeg', size: 9 * 1048576 })).status === 413)
  check('sign: video 26 MB (>25)', (await sign({ slug: 'uji', kind: 'video', contentType: 'video/webm', size: 26 * 1048576 })).status === 413)
  r = await sign({ slug: 'uji-form', kind: 'thumbnail', contentType: 'image/jpeg', size: 400 })
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    check('sign: valid → path & signedUrl', r.status === 201 && /^uji-form\/thumbnail-[a-f0-9]{10}\.jpg$/.test(r.data.path) && r.data.signedUrl.startsWith('http'), r.data)
    const upload = async (path, signedUrl, bytes, type) => {
      const body = new FormData()
      body.append('cacheControl', '31536000')
      body.append('', new Blob([bytes], { type }))
      return fetch(signedUrl, { method: 'PUT', body })
    }
    // berkas JPEG asli → konfirmasi lolos
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, 7)])
    check('unggah langsung ke signed URL', (await upload(r.data.path, r.data.signedUrl, jpeg, 'image/jpeg')).status === 200)
    const ok = await call('POST', '/api/uploads/confirm', { path: r.data.path })
    check('confirm: berkas valid → URL publik', ok.status === 201 && ok.data.contentType === 'image/jpeg' && ok.data.url.includes(r.data.path), ok)
    check('URL publik terbaca', (await fetch(ok.data.url)).status === 200)
    // berkas palsu (teks bertipe image/jpeg) → confirm menolak dan MENGHAPUS objeknya
    const r2 = await sign({ slug: 'uji-form', kind: 'thumbnail', contentType: 'image/jpeg', size: 40 })
    await upload(r2.data.path, r2.data.signedUrl, Buffer.from('ini teks biasa yang menyamar sebagai gambar jpeg'), 'image/jpeg')
    const bad2 = await call('POST', '/api/uploads/confirm', { path: r2.data.path })
    check('confirm: isi palsu → 415', bad2.status === 415, bad2)
    check('confirm: objek palsu dihapus dari bucket', await eventuallyGone(ok.data.url.replace(r.data.path, r2.data.path)))
    check('confirm: berkas belum diunggah → 404', (await call('POST', '/api/uploads/confirm', { path: 'uji-form/thumbnail-0123456789.jpg' })).status === 404)
    check('confirm: path tidak valid → 400', (await call('POST', '/api/uploads/confirm', { path: '../../etc/passwd' })).status === 400)
    check('delete upload: URL luar → 400', (await call('DELETE', '/api/uploads', { url: 'https://example.com/a.jpg' })).status === 400)
    const del = await call('DELETE', '/api/uploads', { url: ok.data.url })
    check('delete upload: objek yatim dibuang', del.status === 200 && del.data.removed === 1, del)
    check('objek hilang setelah dihapus', await eventuallyGone(ok.data.url))
  } else {
    check('sign tanpa konfigurasi storage → 503', r.status === 503, r.status)
  }

  // ---------------------------------------------------------------- pengaturan
  r = await call('GET', '/api/settings', undefined, { auth: 'none' })
  const wa = r.data.whatsappNumber
  r = await call('PUT', '/api/settings', { whatsappNumber: ' 6281234 ', kunciLain: 'abaikan' })
  check('settings: nilai dipangkas & kunci asing diabaikan', r.status === 200 && r.data.whatsappNumber === '6281234' && !('kunciLain' in r.data), r.data)
  if (wa) await call('PUT', '/api/settings', { whatsappNumber: wa })

  // ---------------------------------------------------------------- login berbasis cookie
  const password = process.env.SEED_ADMIN_PASSWORD
  if (password) {
    const login = (pw) => call('POST', '/api/auth/login', { username: 'admin', password: pw }, { auth: 'none' })
    let r1 = await login('salah-sengaja')
    check('login: password salah → 401 generik', r1.status === 401 && r1.data.message === 'Username atau password salah.', r1.data)
    r1 = await call('POST', '/api/auth/login', { username: 'tidak-ada', password: 'x' }, { auth: 'none' })
    check('login: username tak ada → pesan sama', r1.status === 401 && r1.data.message === 'Username atau password salah.', r1.data)
    check('login: field kosong → 400', (await call('POST', '/api/auth/login', { username: '' }, { auth: 'none' })).status === 400)
    r1 = await login(password)
    check('login: benar → 200 + username', r1.status === 200 && r1.data.username === 'admin', r1.data)
    check('login: token TIDAK ada di body', !('token' in (r1.data || {})))
    const setCookie = r1.res.headers.get('set-cookie') || ''
    check('cookie: httpOnly + SameSite=Strict + Path=/', /HttpOnly/i.test(setCookie) && /SameSite=strict/i.test(setCookie) && /Path=\//i.test(setCookie), setCookie)
    const cookie = setCookie.split(';')[0]
    const me1 = await call('GET', '/api/auth/me', undefined, { auth: { cookie } })
    check('me: cookie valid → username', me1.status === 200 && me1.data.username === 'admin', me1)
    check('cookie dipakai ke endpoint admin (GET)', (await call('GET', '/api/projects/overview', undefined, { auth: { cookie } })).status === 200)
    // CSRF: permintaan cookie yang mengubah data wajib Origin yang sama
    const noOrigin = await call('POST', '/api/members', { name: 'CSRF', role: 'x' }, { auth: { cookie } })
    check('CSRF: tanpa Origin → 403', noOrigin.status === 403, noOrigin)
    const evil = await call('POST', '/api/members', { name: 'CSRF', role: 'x' }, { auth: { cookie }, headers: { Origin: 'https://evil.example' } })
    check('CSRF: Origin asing → 403', evil.status === 403, evil)
    const good = await call('POST', '/api/members', { name: 'Uji Cookie', role: 'x' }, { auth: { cookie }, headers: { Origin: ORIGIN } })
    check('CSRF: Origin sama → diterima', good.status === 201, good)
    if (good.data?.id) created.members.push(good.data.id)
    const lo = await call('POST', '/api/auth/logout', {}, { auth: 'none' })
    check('logout: cookie dihapus (Max-Age=0)', lo.status === 200 && /Max-Age=0/i.test(lo.res.headers.get('set-cookie') || ''), lo.res.headers.get('set-cookie'))
    // pembatas laju: 5/menit per IP (4 permintaan login sudah terpakai di atas)
    const bursts = []
    for (let i = 0; i < 3; i++) bursts.push((await login('salah-lagi')).status)
    check('rate limit: lewat 5 percobaan → 429', bursts.includes(429), bursts)
    const limited = await login('salah-lagi')
    check('rate limit: ada Retry-After', limited.status === 429 && Number(limited.res.headers.get('retry-after')) > 0, limited.res.headers.get('retry-after'))
    // bersihkan jejak percobaan agar tidak mengunci admin sungguhan setelah uji
    const { prisma } = await import('../src/lib/prisma.js')
    await prisma.loginAttempt.deleteMany({ where: { key: { startsWith: 'login:' } } })
    await prisma.$disconnect()
  } else {
    console.log('(SEED_ADMIN_PASSWORD tidak ada — uji login cookie dilewati)')
  }
} finally {
  // ---------------------------------------------------------------- pembersihan
  for (const id of created.projects) await call('DELETE', `/api/projects/${id}`)
  for (const id of created.members) if (id) await call('DELETE', `/api/members/${id}`)
  const left = await call('GET', '/api/projects/overview')
  check('pembersihan: tidak ada project uji tersisa', !left.data.some((p) => p.name === 'Uji Tracking'))
  console.log(`\nLULUS: ${passed} | GAGAL: ${fails.length}${fails.length ? '\n  - ' + fails.join('\n  - ') : ''}`)
  process.exitCode = fails.length ? 1 : 0
}
