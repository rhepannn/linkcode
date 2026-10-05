// "Rata Coffee!" -> "rata-coffee". Selaras dengan slugify di backend/routes/showcases.js.
export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
