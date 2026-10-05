export default function Footer() {
  return (
    <footer className="border-t border-sand-light">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-ink-soft sm:flex-row sm:px-8">
        <p className="font-display text-xl font-semibold text-ink">
          Link<span className="italic text-olive">Code</span>
        </p>
        <p>© {new Date().getFullYear()} LinkCode. Software Development Studio.</p>
      </div>
    </footer>
  )
}
