import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../Icons'

export default function Modal({ open, onClose, title, children, width = 'max-w-md', footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-[#2b2350]/45 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${width} bg-paper rounded-t-[28px] sm:rounded-[28px] border-[1.5px] border-line shadow-[0_30px_80px_-20px_rgba(43,35,80,0.5)] p-6 max-h-[88vh] overflow-y-auto`}
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold text-ink">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="tap p-2 rounded-xl text-ink-faint hover:bg-surface-2 hover:text-ink"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div>{children}</div>
            {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
