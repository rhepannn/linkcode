import Navbar from '@/components/Navbar'
import Hero from '@/components/home/Hero'
import ProjectsSection from '@/components/home/ProjectsSection'
import CTA from '@/components/home/CTA'
import Footer from '@/components/home/Footer'
import Portfolio from '@/components/portfolio/Portfolio'
import JsonLd from '@/components/JsonLd'
import { getPublicProjects, getPublicShowcases, getWhatsappNumber } from '@/lib/queries'
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from '@/lib/site'

// ISR: halaman dibuat di server lalu di-cache; disegarkan tiap 5 menit dan seketika saat admin
// mengubah data (revalidatePath di Route Handlers).
export const revalidate = 300

export const metadata = {
  title: { absolute: `${SITE_NAME} · Software Development Studio — Karya & Progress Project` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
}

// Gagal membaca database tidak boleh menggagalkan build/halaman: tampilkan bagian kosong.
async function safe(label, fn, fallback) {
  try {
    return await fn()
  } catch (err) {
    console.error(`[home] ${label} gagal:`, err.message)
    return fallback
  }
}

export default async function HomePage() {
  const [projects, showcases, waNumber] = await Promise.all([
    safe('project', getPublicProjects, []),
    safe('portofolio', getPublicShowcases, []),
    safe('whatsapp', getWhatsappNumber, null),
  ])
  const site = getSiteUrl()

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', '@id': `${site}/#org`, name: SITE_NAME, url: site, description: SITE_DESCRIPTION },
            { '@type': 'WebSite', '@id': `${site}/#website`, url: site, name: SITE_NAME, inLanguage: 'id-ID', publisher: { '@id': `${site}/#org` } },
            {
              '@type': 'ItemList',
              name: 'Portofolio LinkCode',
              itemListElement: showcases.map((w, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: w.title,
                url: `${site}/karya/${w.slug}`,
              })),
            },
          ],
        }}
      />
      <Navbar />
      <main>
        <Hero />
        <Portfolio items={showcases} />
        <ProjectsSection projects={projects} />
        <CTA waNumber={waNumber} />
      </main>
      <Footer />
    </div>
  )
}
