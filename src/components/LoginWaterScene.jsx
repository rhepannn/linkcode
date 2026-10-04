import { useEffect, useRef } from 'react'

// ---------- Kapal + orang (gambar dari user) ----------
const BOAT_W = 116 // lebar tampil kapal (aspek asli 334×384)
const BOAT_H = Math.round(BOAT_W * (384 / 334)) // ≈ 133
const BOAT_WATERLINE = 0.74 // fraksi dari atas kapal yang berada di garis air

const PLAYER_W = 42 // aspek asli 260×360
const PLAYER_H = Math.round(PLAYER_W * (360 / 260)) // ≈ 58
const PLAYER_DECK = 0.8 // fraksi dari atas kapal tempat kaki orang berpijak (dek)
const PLAYER_X = 0.5 // posisi horizontal orang di kapal (0..1)

// ---------- Lumba-lumba (gambar dari user — sprite menghadap KIRI) ----------
const DOLPHIN_IMG = 'url("/delfin.png")'
const DOLPHIN_W = 66
const DOLPHIN_H = 66
const DOLPHIN_DEEP = 40 // kedalaman menyelam (di bawah garis air, tersembunyi)

// ---------- Dimensi scene & 2 lapis air ----------
const PIXEL = 8
const SCENE_H = 200
const BASE_BACK = 110 // garis air lapisan belakang
const BASE_FRONT = 138 // garis air lapisan depan (lebih bawah = lebih dekat)

// Belakang: warna lebih terang/hazy (jauh). Depan: lebih pekat (dekat).
const WATER_BACK = { foam: '#CDE7FA', mid: '#7FB6EC', body: '#4E92DA' }
const WATER_FRONT = { foam: '#A6D8F5', mid: '#3FA0EC', body: '#1B6FC4' }

const backOffset = (x, t) => Math.sin(x * 0.05 - t * 1.4) * 5 + Math.sin(x * 0.1 + t * 2.0) * 2.5
const frontOffset = (x, t) => Math.sin(x * 0.042 - t * 1.8) * 8 + Math.sin(x * 0.085 + t * 2.5) * 4

// Lumba-lumba: melompat keluar air lalu menyelam (ketutup lapisan depan).
// dir: -1 = melompat ke kiri (arah hadap natural gambar).
// 2 lumba-lumba di pojok kiri & kanan (tidak mengganggu player di tengah).
const DOLPHINS = [
  { xFrac: 0.1, period: 5.2, offset: 0.15, jumpFrac: 0.46, height: 66, travel: 40, dir: -1 },
  { xFrac: 0.9, period: 5.9, offset: 0.55, jumpFrac: 0.46, height: 72, travel: 42, dir: -1 },
]

export default function LoginWaterScene() {
  const rootRef = useRef(null)
  const backRef = useRef(null)
  const frontRef = useRef(null)
  const boatRef = useRef(null)
  const dolphinRefs = useRef([])

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

    const dw = DOLPHIN_W
    const dh = DOLPHIN_H
    const start = performance.now()
    const render = () => {
      if (cssW <= 0) return
      const t = (performance.now() - start) / 1000

      drawWater(bctx, BASE_BACK, backOffset, WATER_BACK, t) // lapis belakang
      // lumba-lumba digambar di antara (DOM, z di antara 2 canvas)
      for (let i = 0; i < DOLPHINS.length; i++) {
        const el = dolphinRefs.current[i]
        if (!el) continue
        const d = DOLPHINS[i]
        const cycle = (t / d.period + d.offset) % 1
        let xc
        let yc
        let ang
        if (cycle < d.jumpFrac) {
          const u = cycle / d.jumpFrac // 0..1 sepanjang lompatan
          const arc = Math.sin(u * Math.PI) // 0 → 1 → 0, mulus
          // mulai & selesai DI BAWAH air (DEEP) → masuk/keluar air mulus, tak ada loncatan patah
          yc = BASE_FRONT + DOLPHIN_DEEP - (DOLPHIN_DEEP + d.height) * arc
          xc = d.xFrac * cssW + (u - 0.5) * d.travel * d.dir
          // rotasi mulus sepanjang busur: moncong naik → datar di puncak → moncong turun
          // (sprite hadap kiri → CW(+) = moncong naik)
          ang = 40 * Math.cos(u * Math.PI)
        } else {
          yc = BASE_FRONT + DOLPHIN_DEEP // diam di bawah, sama dgn ujung arc → transisi mulus
          xc = d.xFrac * cssW
          ang = 0
        }
        // sprite menghadap kiri → scaleX(-dir) supaya menghadap arah lompatan
        el.style.transform = `translate(${(xc - dw / 2).toFixed(1)}px, ${(yc - dh / 2).toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scaleX(${-d.dir})`
      }
      drawWater(fctx, BASE_FRONT, frontOffset, WATER_FRONT, t) // lapis depan (menutup)

      // kapal mengikuti permukaan air depan
      if (boatRef.current) {
        const cx = cssW / 2
        const dy = frontOffset(cx, t)
        const slope = (frontOffset(cx + PIXEL, t) - frontOffset(cx - PIXEL, t)) / (2 * PIXEL)
        let a = Math.atan(slope) * (180 / Math.PI) * 0.4
        a = Math.max(-11, Math.min(11, a))
        boatRef.current.style.transform = `translateY(${dy.toFixed(2)}px) rotate(${a.toFixed(2)}deg)`
      }
    }

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
      ref={rootRef}
      className="pointer-events-none relative w-full shrink-0 overflow-hidden"
      style={{ height: SCENE_H }}
      aria-hidden="true"
    >
      {/* lapisan air BELAKANG */}
      <canvas
        ref={backRef}
        className="absolute inset-0 z-0 block w-full"
        style={{ height: SCENE_H, imageRendering: 'pixelated' }}
      />

      {/* lumba-lumba (di antara 2 lapis air) */}
      {DOLPHINS.map((d, i) => (
        <div
          key={i}
          ref={(el) => (dolphinRefs.current[i] = el)}
          className="absolute left-0 top-0 z-[15] will-change-transform bg-no-repeat"
          style={{
            width: DOLPHIN_W,
            height: DOLPHIN_H,
            backgroundImage: DOLPHIN_IMG,
            backgroundSize: `${DOLPHIN_W}px ${DOLPHIN_H}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
        />
      ))}

      {/* lapisan air DEPAN (menutup lumba-lumba saat menyelam) */}
      <canvas
        ref={frontRef}
        className="absolute inset-0 z-20 block w-full"
        style={{ height: SCENE_H, imageRendering: 'pixelated' }}
      />

      {/* kapal + orang: DI ANTARA 2 lapis air (z-10) → lambung ketutup air depan,
          jadi terlihat mengapung tenggelam sedikit (realistis) */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{ bottom: SCENE_H - BASE_FRONT - BOAT_H * (1 - BOAT_WATERLINE) }}
      >
        <div
          ref={boatRef}
          className="relative origin-bottom will-change-transform"
          style={{ width: BOAT_W, height: BOAT_H }}
        >
          {/* kapal */}
          <img
            src="/boat.png"
            alt=""
            className="absolute inset-0 h-full w-full"
            style={{ imageRendering: 'pixelated' }}
          />
          {/* orang berdiri di dek */}
          <img
            src="/player.png"
            alt=""
            className="absolute"
            style={{
              width: PLAYER_W,
              height: PLAYER_H,
              left: `${PLAYER_X * 100}%`,
              transform: 'translateX(-50%)',
              bottom: BOAT_H * (1 - PLAYER_DECK),
              imageRendering: 'pixelated',
            }}
          />
        </div>
      </div>
    </div>
  )
}
