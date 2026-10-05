import { revalidatePath } from 'next/cache'
import { json, fail } from './http.js'
import { serializeFeature, syncFeatureStatus, syncProjectProgress } from './tracking.js'

// Setelah perubahan fitur/sub-tugas: sinkronkan status fitur & persen project, segarkan halaman
// publik (persen tampil di kartu), lalu kirim ringkasan.
export async function featureResponse(featureId, projectId, status = 200) {
  const feature = await syncFeatureStatus(featureId)
  const percentage = await syncProjectProgress(projectId)
  revalidatePath('/')
  return json({ feature: feature && serializeFeature(feature), percentage }, status)
}

export function dbError(err, fallback) {
  if (err.code === 'P2025') return fail('Data tidak ditemukan.', 404)
  if (err.code === 'P2003') return fail('Project atau penanggung jawab tidak ditemukan.', 400)
  console.error(fallback, err)
  return fail(fallback, 500)
}
