import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Blobs from '../components/Blobs'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Icon } from '../components/Icons'

export default function NotFound() {
  return (
    <PageTransition>
      <div className="relative min-h-[calc(100vh-68px)] flex items-center justify-center px-4 py-16">
        <Blobs variant="rich" />
        <div className="relative text-center">
          {/* Node mindmap melayang (dekorasi on-brand) */}
          {[
            { e: '🧠', cls: '-left-16 top-6', bg: '#efeaff', border: '#7c5cfc' },
            { e: '💡', cls: '-right-14 top-2', bg: '#fff6d9', border: '#ffb020' },
            { e: '📚', cls: '-left-10 bottom-10', bg: '#ffeaf4', border: '#f75da8' },
            { e: '⭐', cls: '-right-12 bottom-16', bg: '#e1faf5', border: '#2ec4b6' },
          ].map((n, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -14, 0], rotate: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 4.5 + i, ease: 'easeInOut', delay: i * 0.5 }}
              className={`absolute hidden sm:flex w-14 h-14 rounded-2xl border-[2.5px] items-center justify-center text-2xl shadow-[0_14px_30px_-12px_rgba(43,35,80,0.4)] ${n.cls}`}
              style={{ backgroundColor: n.bg, borderColor: n.border }}
              aria-hidden
            >
              {n.e}
            </motion.span>
          ))}

          <motion.div
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="inline-block text-8xl mb-6"
          >
            🧭
          </motion.div>
          <h1 className="text-[88px] leading-none font-extrabold text-gradient">404</h1>
          <h2 className="text-2xl font-extrabold mt-2 mb-2">Ups, halaman ini nyasar!</h2>
          <p className="text-ink-soft max-w-sm mx-auto mb-8">
            Halaman yang kamu cari tidak ada, atau mungkin sudah dipindahkan. Yuk kembali ke jalur
            belajar! 💪
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="primary" size="lg" icon={<Icon name="home" size={18} />}>
                Ke Beranda
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="white" size="lg" icon={<Icon name="grid" size={18} />}>
                Ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
