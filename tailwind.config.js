/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tema "soft editorial": krem hangat + tinta kehijauan + aksen olive.
        cream: '#F3EEE6', // latar halaman
        paper: '#FBF8F3', // permukaan kartu
        ink: '#1E211D', // teks utama
        'ink-soft': '#5C6157', // teks sekunder
        olive: '#5C6E21', // aksen utama
        'olive-dark': '#46541A',
        sand: '#B8A58A', // aksen hangat
        'sand-light': '#E4DAC8', // garis & border halus
        clay: '#BD3D44', // peringatan / hold
      },
      fontFamily: {
        // Variabel CSS diisi oleh next/font di src/app/layout.jsx
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // both = tahan keadaan awal (tersembunyi) sampai delay selesai; berjalan tanpa JavaScript.
        'fade-up': 'fade-up 0.7s ease-out both',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(30,33,29,0.04), 0 12px 32px -16px rgba(30,33,29,0.18)',
        lift: '0 2px 4px rgba(30,33,29,0.04), 0 20px 40px -18px rgba(30,33,29,0.25)',
      },
    },
  },
  plugins: [],
}
