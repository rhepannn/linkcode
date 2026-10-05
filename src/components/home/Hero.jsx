import { ArrowDown } from 'lucide-react'

const HIGHLIGHTS = [
  { no: '01', title: 'Transparan', text: 'Progress project ditampilkan apa adanya, real-time.' },
  { no: '02', title: 'Terstruktur', text: 'Setiap project punya PIC yang jelas dan bertanggung jawab.' },
  { no: '03', title: 'Aktif', text: 'Bukan portofolio lama — ini yang sedang berjalan sekarang.' },
]

// Hero memakai animasi CSS (bukan Reveal berbasis JS) agar teks utama langsung terlihat saat HTML
// dimuat — baik untuk LCP dan untuk perayap yang tidak menjalankan JavaScript.
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* cahaya lembut di latar */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-olive/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-64 h-80 w-80 rounded-full bg-sand/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <p className="eyebrow animate-fade-up">Software Development Studio</p>

        <h1
          className="mt-6 max-w-4xl animate-fade-up font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl"
          style={{ animationDelay: '100ms' }}
        >
          Tim developer yang bekerja nyata,{' '}
          <span className="italic text-olive">progress yang bisa kamu pantau.</span>
        </h1>

        <p className="mt-8 max-w-xl animate-fade-up text-lg leading-relaxed text-ink-soft" style={{ animationDelay: '200ms' }}>
          Kami tidak hanya menjanjikan — kami menunjukkan. Setiap project yang sedang dikerjakan bisa kamu lihat
          langsung di sini.
        </p>

        <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-4" style={{ animationDelay: '300ms' }}>
          <a href="#portofolio" className="btn-solid">
            Lihat portofolio
            <ArrowDown size={16} />
          </a>
          <a href="#kontak" className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            Diskusi project
          </a>
        </div>

        <ul className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-sand-light bg-sand-light sm:grid-cols-3">
          {HIGHLIGHTS.map((h, i) => (
            <li key={h.title} className="animate-fade-up bg-paper p-7" style={{ animationDelay: `${400 + i * 100}ms` }}>
              <span className="font-mono text-xs text-sand">{h.no}</span>
              <h2 className="mt-6 font-display text-3xl font-medium">{h.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{h.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
