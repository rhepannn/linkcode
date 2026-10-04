import { Link } from 'react-router-dom'

function Logo() {
  return (
    <Link to="/" className="font-display text-2xl text-white">
      Link<span className="text-sky-blue">Code</span>
      <span className="ml-0.5 animate-blink text-neon-green">_</span>
    </Link>
  )
}

// Navbar dipakai di halaman publik & admin.
// Saat `admin` true, tampilkan nama admin + tombol Logout.
export default function Navbar({ admin = false, username, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-sky-blue bg-navy">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />

        <div className="flex items-center gap-3">
          {admin ? (
            <>
              <span className="hidden font-pixel text-[10px] text-light-blue sm:inline">
                {username || 'admin'}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="btn-pixel border-sky-blue bg-transparent px-3 py-2 text-light-blue shadow-[3px_3px_0_0_#4A90D9] hover:bg-white/10 active:shadow-none"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/admin"
              className="font-pixel text-[10px] uppercase tracking-wider text-light-blue transition-colors hover:text-sky-blue"
            >
              [ Admin ]
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
