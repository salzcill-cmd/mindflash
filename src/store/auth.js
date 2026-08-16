import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null, // Supabase User | null
  profile: null, // baris tabel profiles | null
  loading: true, // sedang memeriksa sesi
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, profile: null, loading: false }),
}))
