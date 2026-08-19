import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Button from './ui/Button'
import { Icon } from './Icons'

const ONBOARD_KEY = 'mindflash:onboarded'

const STEPS = [
  {
    emoji: '🧠',
    title: 'Selamat Datang di MindFlash!',
    desc: 'Tempat bikin mindmap & flashcard supaya belajar jadi cepat, seru, dan nggak gampang lupa.',
    color: '#7c5cfc',
    bg: '#efeaff',
  },
  {
    emoji: '🗺️',
    title: 'Buat Peta Pikiran',
    desc: 'Sudah ada demo materi "Fotosintesis" di dashboard-mu. Buka, edit, dan rasakan sendiri betapa mudahnya!',
    color: '#ff6f91',
    bg: '#ffeaf4',
  },
  {
    emoji: '🃏',
    title: 'Hafal dengan Flashcard',
    desc: 'Ada juga deck demo "Istilah Biologi". Balik kartunya, lalu coba mode Spaced Repetition!',
    color: '#2ec4b6',
    bg: '#e1faf5',
  },
]

/**
 * Modal selamat datang untuk pengguna baru pertama kali.
 * Menjelaskan apa itu MindFlash dalam 3 langkah simpel.
 */
export default function Onboarding() {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(ONBOARD_KEY) !== 'true'
    } catch {
      return true
    }
  })
  const [step, setStep] = useState(0)

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARD_KEY, 'true')
    } catch { /* ignore */ }
    setShow(false)
  }

  // Memoisasi agar tidak re-create tiap render
  const steps = STEPS

  // Memoisasi current step object
  const s = useMemo(() => steps[step], [step, steps])

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(43, 35, 80, 0.55)', backdropFilter: 'blur(6px)' }}
        onClick={dismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-surface rounded-[32px] border-[1.5px] border-line shadow-[0_32px_80px_-20px_rgba(43,35,80,0.5)] w-full max-w-md overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label="Tutup"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-surface-2 text-ink-soft flex items-center justify-center hover:bg-line transition-colors"
          >
            <Icon name="close" size={16} />
          </button>

          {/* Hero area */}
          <div
            className="relative px-6 pt-10 pb-6 text-center overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${s.bg} 0%, var(--color-surface) 100%)` }}
          >
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] text-4xl mb-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${s.bg}, ${s.color}22)`,
                border: `2.5px solid ${s.color}33`,
              }}
            >
              {s.emoji}
            </motion.div>
            <motion.h2
              key={`t-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-2xl font-extrabold"
            >
              {s.title}
            </motion.h2>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <motion.p
              key={`d-${step}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-ink-soft text-[15px] leading-relaxed text-center"
            >
              {s.desc}
            </motion.p>

            {/* Step indicator */}
            <div className="flex justify-center gap-2 mt-5 mb-5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 28 : 8,
                    backgroundColor: i === step ? s.color : 'var(--color-line)',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="w-full"
                  size="md"
                >
                  Lanjut
                </Button>
              ) : (
                <Link to="/dashboard" onClick={dismiss}>
                  <Button className="w-full" size="md" icon={<Icon name="zap" size={18} />}>
                    Lihat Demo di Dashboard
                  </Button>
                </Link>
              )}
              <button
                onClick={dismiss}
                className="w-full text-center text-sm font-bold text-ink-faint hover:text-ink transition-colors py-2"
              >
                {step < steps.length - 1 ? 'Lewati' : 'Nanti aja'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
