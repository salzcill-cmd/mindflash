import { create } from 'zustand'

let seed = 0

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (message, type = 'success', opts = {}) => {
    const id = ++seed
    const toast = { id, message, type, ...opts }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    if (!opts.sticky) {
      // Toast ber-aksi diberi waktu lebih lama agar sempat diklik
      const duration = opts.action ? 8000 : (opts.duration ?? 3500)
      setTimeout(() => get().dismiss(id), duration)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (m, o) => useToastStore.getState().push(m, 'success', o),
  error: (m, o) => useToastStore.getState().push(m, 'error', o),
  info: (m, o) => useToastStore.getState().push(m, 'info', o),
}
