import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useAuthStore } from './store/auth'
import { useGuestStore } from './store/guest'
import { getProfile, migrateGuestToAccount } from './lib/storage'
import { seedDemoContent } from './lib/demo'
import { toast } from './store/toast'
import ToastContainer from './components/ui/ToastContainer'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'
import ErrorBoundary from './components/ErrorBoundary'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import NotFound from './pages/NotFound'

// Halaman berat di-load sesuai kebutuhan (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MindmapEditor = lazy(() => import('./pages/MindmapEditor'))
const FlashcardEditor = lazy(() => import('./pages/FlashcardEditor'))
const Study = lazy(() => import('./pages/Study'))
const Share = lazy(() => import('./pages/Share'))
const Settings = lazy(() => import('./pages/Settings'))
const Onboarding = lazy(() => import('./components/Onboarding'))

// ------------------------------------------------------------
// AuthProvider — menjaga sesi Supabase & profil tetap sinkron,
// plus migrasi otomatis data guest setelah login/daftar.
// ------------------------------------------------------------
function AuthProvider({ children }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const loadProfile = async (userId) => {
      try {
        const profile = await getProfile(userId)
        setProfile(profile)
      } catch (e) {
        console.warn('gagal memuat profil:', e)
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user ?? null
        setUser(user)
        setLoading(false)
        if (user) loadProfile(user.id)
      })
      .catch((e) => {
        // Supabase tidak bisa dihubungi — tetap biarkan aplikasi berjalan (mode guest)
        console.warn('gagal membaca sesi:', e)
        setLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null
      setUser(user)
      if (user) {
        await loadProfile(user.id)
        // Migrasi data guest → akun (sekali saja)
        try {
          if (useGuestStore.getState().hasData()) {
            const { migrated } = await migrateGuestToAccount()
            if (migrated > 0) {
              toast.success(`Data guest-mu (${migrated} item) berhasil dipindahkan ke akun! 🎉`)
            }
          }
        } catch (e) {
          console.warn('migrasi guest gagal:', e)
        }
      } else {
        setProfile(null)
      }
    })

    // Pengaman: jangan biarkan layar loading menggantung selamanya
    const safety = setTimeout(() => setLoading(false), 8000)
    return () => {
      clearTimeout(safety)
      sub.subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading])

  return children
}

function LoadingScreen({ full = false }) {
  return (
    <div className={`${full ? 'min-h-screen' : 'min-h-[60vh]'} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-pink animate-bob shadow-[0_12px_30px_-8px_rgba(124,92,252,0.6)]" />
        <p className="text-sm font-extrabold text-ink-soft animate-pulse-soft">
          {full ? 'MindFlash sedang menyiapkan segalanya…' : 'Sebentar ya…'}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const loading = useAuthStore((s) => s.loading)

  // Selalu mulai dari atas saat pindah halaman
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Seed demo content untuk user pertama kali (guest)
  useEffect(() => {
    seedDemoContent()
  }, [])

  return (
    <ErrorBoundary>
      {/* AuthProvider WAJIB selalu ter-mount: dialah yang mematikan layar
          loading setelah sesi dicek. Kalau loading disimpan sebagai early-return
          di luar provider, aplikasi akan macet di layar loading selamanya. */}
      <AuthProvider>
        {loading ? (
          <LoadingScreen full />
        ) : (
        <div className="min-h-screen flex flex-col">
          <ScrollProgress />
          <Navbar />
          <Suspense fallback={null}>
            <Onboarding />
          </Suspense>
          <Suspense fallback={<LoadingScreen />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mindmap/:id" element={<MindmapEditor />} />
                <Route path="/flashcard/:id" element={<FlashcardEditor />} />
                <Route path="/flashcard/:id/study" element={<Study />} />
                <Route path="/share/:type/:id" element={<Share />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
          <Footer />
          <ToastContainer />
        </div>
        )}
      </AuthProvider>
    </ErrorBoundary>
  )
}
