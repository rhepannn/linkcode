import { getPublicShowcases } from '@/lib/queries'
import { getSiteUrl } from '@/lib/site'

// Disegarkan oleh revalidateShowcases() saat admin mengubah karya.
export const revalidate = 3600

export default async function sitemap() {
  const site = getSiteUrl()
  const items = await getPublicShowcases().catch(() => [])
  return [
    { url: site, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...items.map((w) => ({
      url: `${site}/karya/${w.slug}`,
      lastModified: new Date(w.updatedAt),
      changeFrequency: 'monthly',
      priority: w.featured ? 0.8 : 0.6,
    })),
  ]
}
