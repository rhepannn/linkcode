import { useEffect, useRef } from 'react'

// Karakter 2D: bebek karet pixel (rubber duck debugging 🦆).
const DUCK = [
  '...YYYY.........',
  '..YYYYYY........',
  '..YBYYYY........',
  'OOYYYYYY........',
  '..YYYYYY........',
  '..YYYYYYYYY.....',
  '.YYYYYYYYYYYY...',
  'YYYYYYyyyYYYYY..',
  'YYYYYYyyyYYYYY..',
  '.YYYYYYYYYYYYY..',
  '..YYYYYYYYYYY...',
  '...YYYYYYYY.....',
]

const DUCK_COLORS = {
  Y: '#FFD23F', // badan
  y: '#E0A21A', // bayangan sayap
  O: '#FF8A1E', // paruh
  B: '#0A2342', // mata (navy)
}

function PixelDuck() {
  return (
    <svg viewBox="0 0 16 12" width="72" height="54" shapeRendering="crispEdges" aria-label="Bebek karet pixel">
      {DUCK.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '.' ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={DUCK_COLORS[c]} />
          ),
        ),
      )}
    </svg>
  )
}

// --- Parameter air pixel (2 lapis, sama seperti scene login) ---
const PIXEL = 8
const SCENE_H = 112
const BASE_BACK = 54 // garis air lapis belakang
const BASE_FRONT = 74 // garis air lapis depan (lebih bawah = lebih dekat)

const WATER_BACK = { foam: '#CDE7FA', mid: '#7FB6EC', body: '#4E92DA' } // jauh/hazy
const WATER_FRONT = { foam: '#A6D8F5', mid: '#3FA0EC', body: '#1B6FC4' } // dekat/pekat

const backOffset = (x, t) => Math.sin(x * 0.05 - t * 1.4) * 5 + Math.sin(x * 0.1 + t * 2.0) * 2.5
const frontOffset = (x, t) => Math.sin(x * 0.042 - t * 1.8) * 8 + Math.sin(x * 0.085 + t * 2.5) * 4

export default function WaveFooter() {
  const rootRef = useRef(null)
  const backRef = useRef(null)
  const frontRef = useRef(null)
  const duckRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const back = backRef.current
    const front = frontRef.current
    if (!root || !back || !front) return
    const bctx = back.getContext('2d')
    const fctx = front.getContext('2d')
    let raf = 0
    let timer = 0
    let lastRaf = -1000
    let cssW = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cssW = root.clientWidth || window.innerWidth
      for (const cv of [back, front]) {
        cv.width = Math.max(1, Math.round(cssW * dpr))
        cv.height = Math.round(SCENE_H * dpr)
        const c = cv.getContext('2d')
        c.setTransform(dpr, 0, 0, dpr, 0, 0)
        c.imageSmoothingEnabled = false
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    resize()

    const drawWater = (ctx, base, off, colors, t) => {
      ctx.clearRect(0, 0, cssW, SCENE_H)
      for (let x = 0; x < cssW; x += PIXEL) {
        const sy = base + off(x + PIXEL / 2, t)
        const top = Math.round(sy / PIXEL) * PIXEL
        ctx.fillStyle = colors.foam
        ctx.fillRect(x, top, PIXEL, PIXEL)
        ctx.fillStyle = colors.mid
        ctx.fillRect(x, top + PIXEL, PIXEL, PIXEL)
        ctx.fillStyle = colors.body
        ctx.fillRect(x, top + 2 * PIXEL, PIXEL, SCENE_H - (top + 2 * PIXEL))
      }
    }

    const start = performance.now()
    const render = () => {
      if (cssW <= 0) return
      const t = (performance.now() - start) / 1000
      drawWater(bctx, BASE_BACK, backOffset, WATER_BACK, t) // lapis belakang
      // bebek di ANTARA 2 lapis (lambung tenggelam → ketutup air depan)
      if (duckRef.current) {
        const cx = cssW / 2
        const dy = frontOffset(cx, t)
        const slope = (frontOffset(cx + PIXEL, t) - frontOffset(cx - PIXEL, t)) / (2 * PIXEL)
        let angle = Math.atan(slope) * (180 / Math.PI) * 0.35
        angle = Math.max(-13, Math.min(13, angle))
        duckRef.current.style.transform = `translateY(${dy.toFixed(2)}px) rotate(${angle.toFixed(2)}deg)`
      }
      drawWater(fctx, BASE_FRONT, frontOffset, WATER_FRONT, t) // lapis depan (menutup)
    }

    const loop = (now) => {
      lastRaf = now
      render()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    // Fallback: di panel preview / tab tersembunyi, rAF di-pause.
    timer = setInterval(() => {
      if (performance.now() - lastRaf > 120) render()
    }, 33)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(timer)
      ro.disconnect()
    }
  }, [])

  return (
    <footer className="relative overflow-hidden bg-navy">
      <div ref={rootRef} className="relative" style={{ height: SCENE_H }}>
        {/* lapis air BELAKANG */}
        <canvas
          ref={backRef}
          className="absolute inset-0 z-0 block w-full"
          style={{ height: SCENE_H, imageRendering: 'pixelated' }}
          aria-hidden="true"
        />

        {/* bebek (di antara 2 lapis, mengapung tenggelam sedikit) */}
        <div className="absolute left-1/2 z-10 -translate-x-1/2" style={{ bottom: SCENE_H - BASE_FRONT - 14 }}>
          <div
            ref={duckRef}
            className="origin-bottom drop-shadow-[2px_3px_0_rgba(0,0,0,0.25)] will-change-transform"
          >
            <PixelDuck />
          </div>
        </div>

        {/* lapis air DEPAN (menutup lambung/badan bawah bebek) */}
        <canvas
          ref={frontRef}
          className="absolute inset-0 z-20 block w-full"
          style={{ height: SCENE_H, imageRendering: 'pixelated' }}
          aria-hidden="true"
        />
      </div>

      {/* badan air + copyright */}
      <div className="bg-brand-blue pb-5 pt-1 text-center font-pixel text-[10px] leading-relaxed text-white/85">
        (c) 2026 LinkCode · Software Development Studio
      </div>
    </footer>
  )
}
