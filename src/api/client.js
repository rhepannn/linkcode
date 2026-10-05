import axios from 'axios'
import { useAuthStore } from '../store/authStore.js'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: sisipkan JWT dari Zustand (memory) ke tiap request.
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor response: jika 401, paksa logout (token invalid/expired).
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

// ---- Auth ----
export async function login({ username, password }) {
  const { data } = await client.post('/api/auth/login', { username, password })
  return data // { token, username? }
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

// ---- Unggah media (Supabase Storage lewat backend) ----
// kind: 'thumbnail' | 'preview' | 'video'. Mengembalikan { url, size, contentType }.
export async function uploadMedia({ file, slug, kind, onProgress }) {
  const body = new FormData()
  // Field teks harus sebelum berkas agar terbaca oleh multer di server.
  body.append('slug', slug)
  body.append('kind', kind)
  body.append('file', file)
  const { data } = await client.post('/api/uploads', body, {
    headers: { 'Content-Type': 'multipart/form-data' }, // tanpa ini, default JSON instance merusak FormData
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  })
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
