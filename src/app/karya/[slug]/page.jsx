import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import CTA from '@/components/home/CTA'
import Footer from '@/components/home/Footer'
import JsonLd from '@/components/JsonLd'
import BrowserFrame from '@/components/portfolio/BrowserFrame'
import ScrollPreview from '@/components/portfolio/ScrollPreview'
import { prisma } from '@/lib/prisma'
import { getPublicShowcase, getPublicShowcases, getWhatsappNumber } from '@/lib/queries'
import { SITE_NAME, getSiteUrl } from '@/lib/site'
import { hostnameOf, sectorLabel } from '@/utils/sectorConfig'

// ISR: dibuat saat build untuk karya yang ada, karya baru dibuat saat pertama diminta, lalu
// disegarkan tiap 10 menit dan seketika saat admin mengubah karya.
export const revalidate = 600

export async function generateStaticParams() {
  try {
    const rows = await prisma.showcase.findMany({ where: { published: true }, select: { slug: true } })
    return rows.map((r) => ({ slug: r.slug }))
  } catch {
    return [] // DB tak terjangkau saat build → halaman dibuat saat diminta
  }
}

const trim = (text, n = 158) => (text.length <= n ? text : `${text.slice(0, n - 1).trimEnd()}…`)

export async function generateMetadata({ params }) {
  const { slug } = await params
  const work = await getPublicShowcase(slug).catch(() => null)
  if (!work) return { title: 'Karya tidak ditemukan', robots: { index: false } }

  const title = `${work.title} — ${sectorLabel(work.sector)}`
  const description = trim(`${work.description} Karya ${SITE_NAME}: ${sectorLabel(work.sector)}.`)
  const image = work.thumbnailUrl || undefined
  return {
    title,
    description,
    alternates: { canonical: `/karya/${work.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/karya/${work.slug}`,
      images: image ? [{ url: image, width: 1440, height: 900, alt: `Tampilan website ${work.title}` }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  }
}

export default async function KaryaPage({ params }) {
  const { slug } = await params
  const work = await getPublicShowcase(slug)
  if (!work) notFound()

  const [all, waNumber] = await Promise.all([
    getPublicShowcases().catch(() => []),
    getWhatsappNumber().catch(() => null),
  ])
  const related = all.filter((w) => w.slug !== work.slug && w.sector === work.sector).slice(0, 3)
  const site = getSiteUrl()
  const pageUrl = `${site}/karya/${work.slug}`

  return (
    <div className="min-h-screen bg-cream">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CreativeWork',
              '@id': `${pageUrl}#work`,
              name: work.title,
              description: work.description,
              url: pageUrl,
              mainEntityOfPage: pageUrl,
              image: work.thumbnailUrl || undefined,
              genre: sectorLabel(work.sector),
              keywords: work.techStack?.length ? work.techStack.join(', ') : undefined,
              dateCreated: work.year ? String(work.year) : undefined,
              inLanguage: 'id-ID',
              creator: { '@type': 'Organization', name: SITE_NAME, url: site },
              sameAs: [work.url],
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Beranda', item: site },
                { '@type': 'ListItem', position: 2, name: 'Portofolio', item: `${site}/#portofolio` },
                { '@type': 'ListItem', position: 3, name: work.title, item: pageUrl },
              ],
            },
          ],
        }}
      />
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
          <Link href="/" className="hover:text-ink">Beranda</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link href="/#portofolio" className="hover:text-ink">Portofolio</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page" className="text-ink">{work.title}</span>
        </nav>

        <header className="max-w-3xl">
          <p className="eyebrow">{sectorLabel(work.sector)}{work.year ? ` · ${work.year}` : ''}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl">{work.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">{work.description}</p>

          {work.techStack?.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Teknologi">
              {work.techStack.map((t) => (
                <li key={t} className="rounded-full border border-sand-light px-3 py-1 font-mono text-[11px] text-ink-soft">{t}</li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={work.url} target="_blank" rel="noopener noreferrer" className="btn-solid">
              Kunjungi {hostnameOf(work.url)} <ArrowUpRight size={16} />
            </a>
            <Link href="/#portofolio" className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
              Lihat karya lainnya
            </Link>
          </div>
        </header>

        <section aria-label={`Tampilan ${work.title}`} className="mt-12">
          <BrowserFrame url={work.url}>
            <ScrollPreview
              src={work.previewUrl}
              fallbackSrc={work.thumbnailUrl}
              alt={`Tampilan website ${work.title}`}
              title={work.title}
              autoplay
            />
          </BrowserFrame>
          {work.videoUrl && (
            <video
              src={work.videoUrl}
              poster={work.thumbnailUrl || undefined}
              controls
              muted
              playsInline
              preload="none"
              className="mt-6 w-full rounded-xl border border-sand-light bg-paper"
              aria-label={`Rekaman scroll ${work.title}`}
            />
          )}
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-20">
            <h2 id="related-title" className="font-display text-3xl font-medium tracking-tight">
              Karya <span className="italic text-olive">{sectorLabel(work.sector)}</span> lainnya
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((w) => (
                <li key={w.id}>
                  <Link href={`/karya/${w.slug}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden rounded-xl border border-sand-light bg-sand-light/50">
                      {w.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.thumbnailUrl} alt={`Tampilan website ${w.title}`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <p className="mt-3 font-display text-2xl font-medium group-hover:text-olive">{w.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <CTA waNumber={waNumber} />
      <Footer />
    </div>
  )
}
