import { useRef, useState } from 'react'

/**
 * Efek miring 3D halus saat hover (desktop saja — dinonaktifkan di layar
 * sentuh). Hanya memakai transform, jadi GPU-friendly.
 */
export default function TiltCard({ children, className = '', max = 7, ...rest }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [enabled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
  )

  const onMove = (e) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: py * -max, y: px * max })
  }

  const reset = () => setTilt({ x: 0, y: 0 })

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={className}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
