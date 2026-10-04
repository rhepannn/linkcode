import { useEffect, useRef } from 'react'

// Awan pixel 2D (blocky) yang melayang di hero.
const CLOUD = [
  '.......WWWW.......',
  '....WWWWWWWWWW....',
  '..WWWWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWWWW.',
  'WWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWW',
  '.SSSSSSSSSSSSSSSS.',
]

const C = { W: '#FFFFFF', S: '#A6D8F5' } // body putih, shadow light-blue

function CloudSprite({ w = 72 }) {
  const h = (w / 18) * 7
  return (
    <svg
      viewBox="0 0 18 7"
      width={w}
      height={h}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      {CLOUD.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === '.' ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={C[c]} />
          ),
        ),
      )}
    </svg>
  )
}

// Tiap awan: posisi vertikal, ukuran, kecepatan (px/dtk) & offset awal berbeda
// → kesan parallax (yang besar/dekat lebih cepat).
const CLOUDS = [
  { top: '11%', w: 100, speed: 20, offset: 0, opacity: 0.95 },
  { top: '24%', w: 56, speed: 34, offset: 520, opacity: 0.72 },
  { top: '40%', w: 82, speed: 14, offset: 1000, opacity: 0.88 },
  { top: '60%', w: 48, speed: 27, offset: 260, opacity: 0.66 },
]

export default function PixelClouds() {
  const layerRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    let raf = 0
    let timer = 0
    let lastRaf = -1000
    let W = layer.clientWidth || window.innerWidth

    const ro = new ResizeObserver(() => {
      W = layer.clientWidth || window.innerWidth
    })
    ro.observe(layer)

    const start = performance.now()
    const render = () => {
      const t = (performance.now() - start) / 1000
      for (let i = 0; i < CLOUDS.length; i++) {
        const el = itemRefs.current[i]
        if (!el) continue
        const c = CLOUDS[i]
        const period = W + c.w + 200 // jarak tempuh penuh sebelum muncul lagi
        const x = ((c.speed * t + c.offset) % period) - c.w - 100
        el.style.transform = `translateX(${x.toFixed(1)}px)`
      }
    }

    // rAF (mulus saat tab terlihat) + fallback interval (preview / tab tersembunyi).
    const loop = (now) => {
      lastRaf = now
      render()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
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
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          ref={(el) => (itemRefs.current[i] = el)}
          className="absolute left-0 will-change-transform"
          style={{ top: c.top, opacity: c.opacity }}
        >
          <CloudSprite w={c.w} />
        </div>
      ))}
    </div>
  )
}
