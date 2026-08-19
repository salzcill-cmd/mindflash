import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-router'))) return 'vendor-react'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('@xyflow')) return 'vendor-flow'
            if (id.includes('@supabase')) return 'vendor-supabase'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
