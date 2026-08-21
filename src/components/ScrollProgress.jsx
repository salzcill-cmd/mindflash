import { memo } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Progress bar tipis di atas halaman — mengikuti posisi scroll.
 * GPU-friendly (hanya transform scaleX) dan menonaktifkan diri saat
 * halaman tidak bisa discroll (mis. editor mindmap full-height).
 */
const ScrollProgress = memo(function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[96] origin-left bg-gradient-to-r from-brand via-pink to-amber"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
})

export default ScrollProgress
