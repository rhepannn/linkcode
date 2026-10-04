/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Versi sedikit lebih saturated/cerah biar pas tema pixel —
        // tetap dekat dengan palette asli (keluarga biru yang sama).
        navy: '#0A2342', // dari #0D2B4E
        'brand-blue': '#1B6FC4', // dari #1E5FA8
        'sky-blue': '#3FA0EC', // dari #4A90D9
        'light-blue': '#A6D8F5', // dari #A8C8EE
        'off-white': '#EAF2FA', // dari #F4F7FB
        white: '#FFFFFF',
        // Aksen neon arcade — dipakai hemat untuk highlight
        'neon-green': '#3DF06F',
        'neon-pink': '#FF4D9D',
        'neon-yellow': '#FFD23F',
        'neon-cyan': '#2DE2E6',
      },
      fontFamily: {
        // Satu font pixel yang rapi & profesional untuk seluruh UI.
        sans: ['"Pixelify Sans"', 'ui-monospace', 'monospace'],
        pixel: ['"Pixelify Sans"', 'ui-monospace', 'monospace'],
        display: ['"Pixelify Sans"', 'ui-monospace', 'monospace'],
      },
      // Semua sudut dibuat kotak/tajam supaya terasa pixel.
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
      // Hard offset shadow (tanpa blur) — ciri khas UI pixel.
      boxShadow: {
        sm: '2px 2px 0 0 #0A2342',
        DEFAULT: '4px 4px 0 0 #0A2342',
        md: '4px 4px 0 0 #0A2342',
        lg: '6px 6px 0 0 #0A2342',
        xl: '8px 8px 0 0 #0A2342',
        none: 'none',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
