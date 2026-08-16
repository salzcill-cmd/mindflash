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
      },
    })
  : null

export const AUTH_REDIRECT = `${window.location.origin}/dashboard`
