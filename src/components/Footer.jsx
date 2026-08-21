import { memo } from 'react'
import { Link } from 'react-router-dom'
import Logo from './ui/Logo'

const Footer = memo(function Footer() {
  return (
    <footer className="relative mt-auto border-t-[1.5px] border-line bg-surface/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <Logo />
          <p className="text-sm text-ink-soft max-w-xs text-center sm:text-left">
            Belajar makin seru dengan mindmap & flashcard pintar. Gratis untuk semua pelajar. ✨
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-ink-soft">
          <Link to="/dashboard" className="hover:text-brand transition-colors">
            Dashboard
          </Link>
          <Link to="/auth?mode=register" className="hover:text-brand transition-colors">
            Daftar
          </Link>
          <Link to="/auth?mode=login" className="hover:text-brand transition-colors">
            Masuk
          </Link>
        </div>
      </div>
      <div className="border-t-[1.5px] border-line py-4 text-center text-xs text-ink-faint">
        © {new Date().getFullYear()} MindFlash · Dibuat dengan 💜 untuk pelajar Indonesia
      </div>
    </footer>
  )
})

export default Footer
