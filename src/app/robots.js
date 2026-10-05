import { getSiteUrl } from '@/lib/site'

export default function robots() {
  const site = getSiteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
