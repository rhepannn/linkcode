'use client'

export default function GlobalError({ reset }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
      <p className="eyebrow">Terjadi kesalahan</p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
        Maaf, halaman ini <span className="italic text-olive">belum bisa dimuat</span>
      </h1>
      <button type="button" onClick={reset} className="btn-solid mt-9">Coba lagi</button>
    </main>
  )
}
