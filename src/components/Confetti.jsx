import { useEffect, useRef } from 'react'

const COLORS = ['#7c5cfc', '#ff6f91', '#ffb627', '#2ec4b6', '#4cc9f0', '#ff8a5c', '#a78bfa']

/**
 * Confetti ringan tanpa library eksternal — satu canvas sekali pakai,
 * partikel dihitung ringan (transform + fill, tanpa blur), otomatis
 * membersihkan diri setelah animasi selesai.
 */
export default function Confetti({ count = 110 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(dpr, dpr)

    const parts = Array.from({ length: count }, () => ({
      x: W * 0.5 + (Math.random() - 0.5) * 140,
      y: H * 0.22 + (Math.random() - 0.5) * 70,
      vx: (Math.random() - 0.5) * 9,
      vy: -(Math.random() * 9 + 4),
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      circle: Math.random() < 0.28,
    }))

    let raf
    const start = performance.now()

    const tick = (t) => {
      const elapsed = (t - start) / 1000
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.34
        p.rot += p.vr
        if (p.y < H + 40) alive = true
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.circle) {
          ctx.beginPath()
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }
        ctx.restore()
      }
      if (alive && elapsed < 6) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, W, H)
        canvas.remove()
      }
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      canvas.remove()
    }
  }, [count])

  return <canvas ref={ref} className="fixed inset-0 z-[110] pointer-events-none" aria-hidden="true" />
}
