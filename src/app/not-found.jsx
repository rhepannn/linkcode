import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/home/Footer'

export const metadata = { title: 'Halaman tidak ditemukan', robots: { index: false } }

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
          Halaman <span className="italic text-olive">tidak ditemukan</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-ink-soft">Tautan yang Anda buka mungkin salah ketik atau karyanya sudah dihapus.</p>
        <Link href="/" className="btn-solid mt-9">Kembali ke beranda</Link>
      </main>
      <Footer />
    </div>
  )
}
