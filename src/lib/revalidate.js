import { revalidatePath } from 'next/cache'

// Segarkan semua halaman publik yang bergantung pada data karya.
export function revalidateShowcases() {
  revalidatePath('/')
  revalidatePath('/karya/[slug]', 'page')
  revalidatePath('/sitemap.xml')
}
