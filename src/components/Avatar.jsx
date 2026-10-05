// Inisial dari nama, mis. "Andi Wijaya" -> "AW".
export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

// Warna avatar dari palet tema, dipilih stabil berdasarkan nama.
const AVATAR_COLORS = ['#5C6E21', '#8A7556', '#1E211D', '#A0522D', '#6B7F5E', '#7A6440']

function colorFor(name = '') {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// `color` opsional: dipakai admin (warna anggota); halaman publik memakai warna dari palet tema.
export default function Avatar({ name, size = 28, ring = true, color }) {
  return (
    <div
      title={name}
      className={`flex shrink-0 items-center justify-center rounded-full font-medium text-paper ${
        ring ? 'ring-2 ring-paper' : ''
      }`}
      style={{ backgroundColor: color || colorFor(name), width: size, height: size, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </div>
  )
}
