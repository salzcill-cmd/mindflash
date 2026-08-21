import { memo, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from './ui/Logo'
import Button from './ui/Button'
import { Icon } from './Icons'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'
import { toast } from '../store/toast'
import { getTheme, setTheme } from '../lib/theme'

// Preload route bundle saat user hover — biar navigasi terasa instan
const preloadMap = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/settings': () => import('../pages/Settings'),
}

const Navbar = memo(function Navbar() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [theme, setThemeState] = useState(getTheme)
  const menuRef = useRef(null)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const logout = async () => {
    setUserMenu(false)
    if (supabase) await supabase.auth.signOut()
    useAuthStore.getState().reset()
    toast.info('Sampai jumpa! 👋')
    navigate('/')
  }

  const initials = (profile?.full_name || user?.email || 'G')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b-[1.5px] border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[68px] flex items-center justify-between gap-3">
        <Logo />

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            onMouseEnter={() => preloadMap['/dashboard']?.()}
            className="px-4 py-2 rounded-xl text-[15px] font-bold text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
          >
            Dashboard
          </Link>
          <a
            href="/#fitur"
            className="px-4 py-2 rounded-xl text-[15px] font-bold text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
          >
            Fitur
          </a>
          <a
            href="/#cara-kerja"
            className="px-4 py-2 rounded-xl text-[15px] font-bold text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
          >
            Cara Kerja
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            className="tap p-2.5 rounded-xl text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
          </button>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu((v) => !v)}
                aria-label="Menu akun"
                className="tap flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-surface border-[1.5px] border-line shadow-[0_6px_16px_-8px_rgba(43,35,80,0.2)] hover:border-brand"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-pink text-white text-xs font-extrabold flex items-center justify-center">
                  {initials}
                </span>
                <Icon name="chevron-down" size={14} className="text-ink-faint" />
              </button>
              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-52 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_20px_50px_-16px_rgba(43,35,80,0.35)] p-2 z-50"
                  >
                    <div className="px-3 py-2 mb-1">
                      <p className="text-sm font-extrabold text-ink truncate">
                        {profile?.full_name || 'Pengguna'}
                      </p>
                      <p className="text-xs text-ink-faint truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-ink-soft hover:bg-surface-2 hover:text-ink"
                    >
                      <Icon name="grid" size={17} /> Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-ink-soft hover:bg-surface-2 hover:text-ink"
                    >
                      <Icon name="gear" size={17} /> Pengaturan
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-[#d63a3a] hover:bg-[#ffe9e9]"
                    >
                      <Icon name="logout" size={17} /> Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/auth?mode=login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button size="sm" icon={<Icon name="spark" size={16} />}>
                  Daftar Gratis
                </Button>
              </Link>
            </>
          )}
          {/* Mobile menu toggle */}
          <button
            className="tap md:hidden p-2.5 rounded-xl text-ink-soft hover:bg-surface-2"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden overflow-hidden border-t-[1.5px] border-line bg-paper"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl font-bold text-ink-soft hover:bg-surface-2"
              >
                Dashboard
              </Link>
              <a
                href="/#fitur"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl font-bold text-ink-soft hover:bg-surface-2"
              >
                Fitur
              </a>
              <a
                href="/#cara-kerja"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl font-bold text-ink-soft hover:bg-surface-2"
              >
                Cara Kerja
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
})

export default Navbar
