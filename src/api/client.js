import axios from 'axios'

// Next.js menyajikan UI dan API dari origin yang sama: baseURL kosong, dan cookie sesi httpOnly
// dikirim otomatis oleh browser (tidak ada token yang disimpan di JavaScript).
const client = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

export const UNAUTHORIZED_EVENT = 'lc:unauthorized'

// 401 pada permintaan terautentikasi → beri tahu UI agar kembali ke layar login.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !url.startsWith('/api/auth/login') && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

// ---- Auth ----
export async function login({ username, password }) {
  const { data } = await client.post('/api/auth/login', { username, password })
  return data // { username } — token ada di cookie httpOnly
}

export async function logout() {
  await client.post('/api/auth/logout')
}

// ---- Projects ----
export async function getProjects() {
  const { data } = await client.get('/api/projects')
  return data
}

export async function createProject(payload) {
  const { data } = await client.post('/api/projects', payload)
  return data
}

export async function updateProject(id, payload) {
  const { data } = await client.put(`/api/projects/${id}`, payload)
  return data
}

export async function deleteProject(id) {
  const { data } = await client.delete(`/api/projects/${id}`)
  return data
}

// ---- Pemantauan project (admin) ----
export const getOverview = async () => (await client.get('/api/projects/overview')).data
export const getProject = async (id) => (await client.get(`/api/projects/${id}`)).data
export const setProjectTeam = async (id, team) => (await client.put(`/api/projects/${id}/team`, { team })).data

export const createFeature = async (projectId, payload) =>
  (await client.post(`/api/projects/${projectId}/features`, payload)).data
export const updateFeature = async (id, payload) => (await client.put(`/api/features/${id}`, payload)).data
export const deleteFeature = async (id) => (await client.delete(`/api/features/${id}`)).data

export const createSubtask = async (featureId, title) =>
  (await client.post(`/api/features/${featureId}/subtasks`, { title })).data
export const updateSubtask = async (id, payload) => (await client.put(`/api/subtasks/${id}`, payload)).data
export const deleteSubtask = async (id) => (await client.delete(`/api/subtasks/${id}`)).data

export const createUpdate = async (projectId, note) =>
  (await client.post(`/api/projects/${projectId}/updates`, { note })).data
export const deleteUpdate = async (id) => (await client.delete(`/api/updates/${id}`)).data

export const createBlocker = async (projectId, payload) =>
  (await client.post(`/api/projects/${projectId}/blockers`, payload)).data
export const updateBlocker = async (id, payload) => (await client.put(`/api/blockers/${id}`, payload)).data
export const deleteBlocker = async (id) => (await client.delete(`/api/blockers/${id}`)).data

export const getMembers = async () => (await client.get('/api/members')).data
export const createMember = async (payload) => (await client.post('/api/members', payload)).data
export const updateMember = async (id, payload) => (await client.put(`/api/members/${id}`, payload)).data
export const deleteMember = async (id) => (await client.delete(`/api/members/${id}`)).data

// ---- Showcases (portofolio) ----
export async function getShowcases() {
  const { data } = await client.get('/api/showcases')
  return data
}

// Admin: termasuk karya yang disembunyikan (published = false).
export async function getAllShowcases() {
  const { data } = await client.get('/api/showcases/all')
  return data
}

export async function createShowcase(payload) {
  const { data } = await client.post('/api/showcases', payload)
  return data
}

export async function updateShowcase(id, payload) {
  const { data } = await client.put(`/api/showcases/${id}`, payload)
  return data
}

export async function deleteShowcase(id) {
  const { data } = await client.delete(`/api/showcases/${id}`)
  return data
}

// ---- Unggah media ----
// Berkas dikirim LANGSUNG dari browser ke Supabase Storage lewat signed URL (tidak melewati fungsi
// serverless, jadi tidak terkena batas body ±4,5 MB). Server hanya menandatangani dan memverifikasi.
// kind: 'thumbnail' | 'preview' | 'video'. Mengembalikan { url, size, contentType }.
export async function uploadMedia({ file, slug, kind, onProgress }) {
  const { data: sign } = await client.post('/api/uploads/sign', {
    slug,
    kind,
    contentType: file.type,
    size: file.size,
  })

  // Instans axios terpisah: tanpa baseURL/header JSON milik klien kita. Content-Type multipart
  // (beserta boundary) diisi browser dari FormData.
  const body = new FormData()
  body.append('cacheControl', '31536000')
  body.append('', file)
  await axios.put(sign.signedUrl, body, {
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  })

  // Server memeriksa isi (magic bytes) & ukuran; berkas yang tidak sesuai dihapus di sana.
  const { data } = await client.post('/api/uploads/confirm', { path: sign.path })
  return data
}

// Buang unggahan yang batal dipakai (server menolak jika masih dipakai karya).
export async function deleteUpload(url) {
  const { data } = await client.delete('/api/uploads', { data: { url } })
  return data
}

// ---- Settings ----
export async function getSettings() {
  const { data } = await client.get('/api/settings')
  return data // { whatsappNumber, ... }
}

export async function updateSettings(payload) {
  const { data } = await client.put('/api/settings', payload)
  return data
}

// ---- Ganti password ----
export async function changePassword(payload) {
  const { data } = await client.post('/api/auth/change-password', payload)
  return data
}

export default client
