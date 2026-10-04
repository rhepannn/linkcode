import { useEffect, useRef } from 'react'

// Burung pixel 2D dengan kepak sayap (2 frame) yang terbang melintas hero.
const WING = '#EAF2FA'
const BODY = '#A6D8F5'

// Sayap naik (tips di atas) ↔ sayap turun (tips di bawah) → kesan mengepak.
const FRAME_UP = ['W...........W', '.WW.......WW.', '...WW...WW...', '.....WBW.....']
const FRAME_DOWN = ['.....WBW.....', '...WW...WW...', '.WW.......WW.', 'W...........W']

function buildBird(rows, scale) {
  const w = rows[0].length
  const h = rows.length
  let rects = ''
  rows.forEach((row, y) => {
    ;[...row].forEach((c, x) => {
      if (c === '.') return
      rects += `<rect x='${x}' y='${y}' width='1' height='1' fill='${c === 'B' ? BODY : WING}'/>`
    })
  })
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w * scale}' height='${h * scale}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${rects}</svg>`
  return { uri: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, w: w * scale, h: h * scale }
}

const SCALE = 3
const FRAMES = [buildBird(FRAME_UP, SCALE), buildBird(FRAME_DOWN, SCALE)]

// Burung: 3 di langit atas + 2 di bawah (setelah 3 card) biar area bawah hidup.
const BIRDS = [
  // langit atas
  { top: '7%', speed: 74, offset: 0, amp: 8, flutter: 2.4, flap: 0.16 },
  { top: '12%', speed: 98, offset: 520, amp: 6, flutter: 3.0, flap: 0.13 },
  { top: '17%', speed: 60, offset: 1050, amp: 7, flutter: 2.0, flap: 0.18 },
  // bawah, setelah 3 card
  { top: '92%', speed: 86, offset: 320, amp: 6, flutter: 2.7, flap: 0.15 },
  { top: '96%', speed: 108, offset: 900, amp: 5, flutter: 3.3, flap: 0.12 },
]

export default function PixelBird() {
  const layerRef = useRef(null)
  const itemRefs = useRef([])
  const lastFrame = useRef([])

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

    const bw = FRAMES[0].w
    const start = performance.now()
    const render = () => {
      const t = (performance.now() - start) / 1000
      for (let i = 0; i < BIRDS.length; i++) {
        const el = itemRefs.current[i]
        if (!el) continue
        const b = BIRDS[i]
        const period = W + bw + 160
        const x = ((b.speed * t + b.offset) % period) - bw - 80
        const y = Math.sin(t * b.flutter + i * 1.7) * b.amp // wobble vertikal
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
        const f = Math.floor(t / b.flap + i) % 2 // kepak sayap
        if (lastFrame.current[i] !== f) {
          el.style.backgroundImage = FRAMES[f].uri
          lastFrame.current[i] = f
        }
      }
    }

    // rAF (mulus saat terlihat) + fallback interval (preview / tab tersembunyi).
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
      {BIRDS.map((b, i) => (
        <div
          key={i}
          ref={(el) => (itemRefs.current[i] = el)}
          className="absolute left-0 will-change-transform bg-no-repeat"
          style={{
            top: b.top,
            width: FRAMES[0].w,
            height: FRAMES[0].h,
            backgroundImage: FRAMES[0].uri,
            backgroundSize: `${FRAMES[0].w}px ${FRAMES[0].h}px`,
            imageRendering: 'pixelated',
          }}
        />
      ))}
    </div>
  )
}
