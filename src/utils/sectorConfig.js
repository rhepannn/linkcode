// Label sektor untuk portofolio. Urutan = urutan tampil di filter.
export const SECTORS = {
  industri: 'Industri & Operasional',
  lingkungan: 'Lingkungan & Iklim',
  pemerintahan: 'Pemerintahan & Komunitas',
  platform: 'Platform & Ekosistem',
  bisnis: 'Bisnis & Brand',
}

export const SECTOR_ORDER = Object.keys(SECTORS)

export const sectorLabel = (key) => SECTORS[key] || key

export const hostnameOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
