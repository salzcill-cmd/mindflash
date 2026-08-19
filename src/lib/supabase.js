import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// PKCE flow = praktik terbaik untuk OAuth (Google) di SPA.
// detectSessionInUrl = otomatis membaca token saat redirect balik dari Google.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // Batasi session lifetime — token di-refresh otomatis,
        // tapi kalau idle > 24 jam user harus login ulang.
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      // Global: batasi retry untuk hindari abuse
      global: {
        headers: {
          'X-Client-Info': 'mindflash-web',
        },
      },
    })
  : null

// Hanya izinkan redirect ke origin sendiri (cegah open redirect)
const ALLOWED_ORIGINS = [window.location.origin]

export function safeRedirect(path) {
  try {
    const url = new URL(path, window.location.origin)
    if (ALLOWED_ORIGINS.includes(url.origin)) {
      return url.pathname + url.search + url.hash
    }
  } catch { /* ignore */ }
  return '/dashboard'
}

export const AUTH_REDIRECT = `${window.location.origin}/dashboard`
