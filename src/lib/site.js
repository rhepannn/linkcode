// Konfigurasi situs untuk SEO (metadata, sitemap, JSON-LD).
export const SITE_NAME = 'LinkCode'
export const SITE_TAGLINE = 'Software Development Studio'
export const SITE_DESCRIPTION =
  'LinkCode adalah software development studio. Lihat karya website dan aplikasi yang sudah kami bangun, serta progress project yang sedang berjalan secara transparan.'

// URL kanonis situs. Isi NEXT_PUBLIC_SITE_URL di produksi (mis. https://linkcode.id).
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (!raw) return 'http://localhost:3000'
  const url = raw.startsWith('http') ? raw : `https://${raw}`
  return url.replace(/\/$/, '')
}
