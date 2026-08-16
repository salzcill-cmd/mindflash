import { motion } from 'framer-motion'
import { Icon } from '../Icons'

export default function EmptyState({ icon = 'spark', title, desc, action, emoji = '🎈' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="relative mb-4">
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-[26px] bg-gradient-to-br from-brand-soft to-[#ffeaf4] border-[1.5px] border-line flex items-center justify-center text-4xl shadow-[0_16px_40px_-16px_rgba(124,92,252,0.5)]"
        >
          {emoji}
        </motion.div>
        <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber shadow-[0_6px_14px_-4px_rgba(255,182,39,0.7)] flex items-center justify-center animate-bob">
          <Icon name={icon} size={16} className="text-white" />
        </span>
      </div>
      <h3 className="text-xl font-extrabold text-ink mb-1">{title}</h3>
      <p className="text-ink-soft text-[15px] max-w-xs mb-5">{desc}</p>
      {action}
    </motion.div>
  )
}
