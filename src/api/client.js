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
