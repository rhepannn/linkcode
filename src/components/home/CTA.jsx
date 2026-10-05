import { MessageCircle } from 'lucide-react'
import Reveal from '../Reveal.jsx'

// Fallback bila nomor WhatsApp belum diatur di admin.
const FALLBACK_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '628123456789'

export default function CTA({ waNumber }) {
  const digits = String(waNumber || FALLBACK_WA).replace(/\D/g, '')
  return (
    <section id="kontak" aria-labelledby="kontak-title" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20 sm:px-8">
      <Reveal className="rounded-3xl border border-sand-light bg-gradient-to-br from-paper to-sand-light/60 px-6 py-16 text-center sm:px-12 sm:py-24">
        <p className="eyebrow">Tertarik bekerja sama?</p>
        <h2 id="kontak-title" className="mx-auto mt-5 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
          Mari diskusikan <span className="italic text-olive">project</span> kamu
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-ink-soft">
          Ceritakan kebutuhan bisnis kamu, kami bantu carikan solusi yang tepat.
        </p>
        <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="btn-solid mt-9">
          <MessageCircle size={16} />
          Chat di WhatsApp
        </a>
      </Reveal>
    </section>
  )
}
