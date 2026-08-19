import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/toast'
import { Icon } from '../Icons'

const STYLES = {
  success: { bg: '#e1faf5', color: '#0e9e92', icon: 'circle-check' },
  error: { bg: '#ffe9e9', color: '#d63a3a', icon: 'circle-x' },
  info: { bg: '#e7f0ff', color: '#2f6fe0', icon: 'spark' },
}

/** Toast item dengan pause-on-hover. */
function ToastItem({ t, onDismiss }) {
  const s = STYLES[t.type] ?? STYLES.success
  const timerRef = useRef(null)

  const pause = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }
  const resume = () => {
    if (t.sticky || t.action) return
    timerRef.current = setTimeout(() => onDismiss(t.id), t.duration ?? 3500)
  }

  return (
    <motion.button
      key={t.id}
      onClick={() => onDismiss(t.id)}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="pointer-events-auto flex items-start gap-2.5 text-left px-4 py-3 rounded-2xl border-[1.5px] shadow-[0_14px_34px_-12px_rgba(43,35,80,0.35)] font-bold text-sm w-fit max-w-full"
      style={{ backgroundColor: s.bg, color: s.color, borderColor: `${s.color}44` }}
      initial={{ y: 30, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 16, opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Icon name={s.icon} size={18} className="mt-0.5 shrink-0" />
      <span className="break-words">{t.message}</span>
      {t.action && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            t.action.onClick()
            onDismiss(t.id)
          }}
          className="tap shrink-0 ml-1 px-3 py-1.5 rounded-xl bg-surface/70 hover:bg-surface text-xs font-extrabold shadow-sm"
          style={{ color: s.color }}
        >
          {t.action.label}
        </button>
      )}
    </motion.button>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
