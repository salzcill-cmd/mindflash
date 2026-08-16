import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Blobs from '../components/Blobs'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Input, Field } from '../components/ui/Input'
import { Icon } from '../components/Icons'
import { supabase, isSupabaseConfigured, AUTH_REDIRECT } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { toast } from '../store/toast'

export default function Auth() {  const [params, setParams] = useSearchParams()
  // Mode berasal dari URL (?mode=login|register) — satu sumber kebenaran,
  // sehingga link navbar & tab selalu sinkron tanpa state duplikat.
  const mode = params.get('mode') === 'login' ? 'login' : 'register'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const submit = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      toast.error('Supabase belum dikonfigurasi. Coba mode guest dulu, atau isi .env.')
      return
    }
    if (!email || !password) {
      toast.error('Email dan password wajib diisi.')
      return
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name || email.split('@')[0] } },
        })
        if (error) throw error
        if (data.session) {
          toast.success('Akun berhasil dibuat! Selamat datang 🎉')
          navigate('/dashboard')
        } else {
          toast.info('Cek emailmu untuk verifikasi, lalu masuk. 📩')
          setParams({ mode: 'login' }, { replace: true })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (error.message.toLowerCase().includes('invalid login')) {
            throw new Error('Email atau password salah.')
          }
          throw error
        }
        toast.success('Berhasil masuk! 👋')
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const sendReset = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      toast.error('Supabase belum dikonfigurasi.')
      return
    }
    if (!resetEmail.trim()) {
      toast.error('Masukkan email dulu.')
      return
    }
    setResetBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: AUTH_REDIRECT,
      })
      if (error) throw error
      toast.success('Link reset password terkirim! Cek emailmu 📩')
      setResetMode(false)
      setResetEmail('')
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim link reset.')
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <PageTransition>
      <div className="relative min-h-[calc(100vh-68px)] flex items-center justify-center py-12 px-4">
        <Blobs />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative w-full max-w-md bg-surface/90 backdrop-blur rounded-[32px] border-[1.5px] border-line shadow-[0_30px_80px_-28px_rgba(43,35,80,0.4)] p-7 sm:p-9"
        >
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-[20px] bg-gradient-to-br from-brand to-pink text-white shadow-[0_12px_28px_-8px_rgba(124,92,252,0.6)] mb-4 animate-bob">
              <Icon name="spark" size={26} />
            </div>
            <h1 className="text-3xl font-extrabold">
              {mode === 'login' ? 'Selamat datang kembali! 👋' : 'Bikin akun gratis!'}
            </h1>
            <p className="text-ink-soft text-[15px] mt-1.5">
              {mode === 'login'
                ? 'Lanjutkan belajar, jangan putus streak-mu.'
                : 'Simpan mindmap & flashcard-mu selamanya.'}
            </p>
          </div>

          {/* Tab */}
          <div className="flex p-1.5 rounded-2xl bg-surface-2 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setParams({ mode: m })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                  mode === m ? 'bg-surface shadow-[0_4px_12px_-4px_rgba(43,35,80,0.2)] text-ink' : 'text-ink-faint hover:text-ink'
                }`}
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {resetMode ? (
            <form onSubmit={sendReset} className="space-y-4">
              <p className="text-sm text-ink-soft leading-relaxed">
                Masukkan email yang terdaftar — kami kirimkan link untuk membuat password baru.
              </p>
              <Input
                label="Email"
                type="email"
                placeholder="kamu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
              <Button type="submit" fullWidth size="lg" loading={resetBusy}>
                Kirim Link Reset
              </Button>
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="w-full text-center text-xs font-extrabold text-ink-faint hover:text-ink transition-colors"
              >
                ← Kembali ke masuk
              </button>
            </form>
          ) : (
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Nama panggilan"
                placeholder="mis. Rani"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<Icon name="user" size={16} />}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Password kamu'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-2.5 pr-11 text-[15px] text-ink placeholder:text-ink-faint transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Sembunyikan password' : 'Lihat password'}
                  className="tap absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-ink-faint hover:text-ink"
                >
                  <Icon name={showPw ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            </Field>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="text-xs font-extrabold text-brand hover:text-brand-deep transition-colors -mt-1"
              >
                Lupa password?
              </button>
            )}
            <Button type="submit" fullWidth size="lg" loading={busy}>
              {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
            </Button>
          </form>
          )}

          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-[1.5px] bg-line" />
            <span className="text-xs font-bold text-ink-faint">BELUM MAU DAFTAR?</span>
            <span className="flex-1 h-[1.5px] bg-line" />
          </div>

          <Link to="/dashboard">
            <Button variant="amber" fullWidth size="lg" icon={<Icon name="zap" size={18} />}>
              Coba Gratis — Tanpa Akun
            </Button>
          </Link>
          <p className="text-xs text-ink-faint text-center mt-3">
            Mode guest menyimpan data sementara di browser-mu. Daftar kapan pun biar datanya aman.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-5 rounded-2xl bg-[#fff6d9] dark:bg-[#3b3160] border-[1.5px] border-[#ffe3a3] dark:border-[#4a4179] px-4 py-3 text-xs font-bold text-[#a06a00] dark:text-[#e8c37a] flex gap-2">
              <Icon name="alert" size={16} className="shrink-0 mt-0.5" />
              <span>
                Supabase belum dikonfigurasi (isi <code>.env</code>). Kamu tetap bisa pakai mode
                guest.
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}
