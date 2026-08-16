import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/toast'
import { Icon } from '../Icons'

const STYLES = {
  success: { bg: '#e1faf5', color: '#0e9e92', icon: 'circle-check' },
  error: { bg: '#ffe9e9', color: '#d63a3a', icon: 'circle-x' },
  info: { bg: '#e7f0ff', color: '#2f6fe0', icon: 'spark' },
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = STYLES[t.type] ?? STYLES.success
          return (
            <motion.button
              key={t.id}
              onClick={() => dismiss(t.id)}
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
                    dismiss(t.id)
                  }}
                  className="tap shrink-0 ml-1 px-3 py-1.5 rounded-xl bg-surface/70 hover:bg-surface text-xs font-extrabold shadow-sm"
                  style={{ color: s.color }}
                >
                  {t.action.label}
                </button>
              )}
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
