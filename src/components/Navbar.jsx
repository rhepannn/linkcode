import Link from 'next/link'

// Navbar halaman publik.
export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-sand-light/70 bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          Link<span className="italic text-olive">Code</span>
        </Link>

        <div className="flex items-center gap-6 text-sm text-ink-soft">
          <a href="/#portofolio" className="hidden transition-colors hover:text-ink sm:inline">
            Portofolio
          </a>
          <a href="/#project" className="hidden transition-colors hover:text-ink sm:inline">
            Project
          </a>
          <a href="/#kontak" className="transition-colors hover:text-ink">
            Kontak
          </a>
          <Link
            href="/admin"
            className="rounded-full border border-sand-light px-4 py-1.5 transition-colors hover:border-ink hover:text-ink"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  )
}
