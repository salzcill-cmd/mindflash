import { memo } from 'react'
import { motion } from 'framer-motion'

const PageTransition = memo(function PageTransition({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.main>
  )
})

export default PageTransition
