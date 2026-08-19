import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { applyTheme, getTheme } from './lib/theme'
import '@xyflow/react/dist/style.css'
import './index.css'
import App from './App.jsx'

// Apply tema SEBELUM render — cegah FOUC (flash of unstyled content)
applyTheme(getTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Daftarkan Service Worker (PWA) — hanya di build produksi,
// supaya mode dev tidak terganggu cache.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Pendaftaran service worker gagal:', err)
    })
  })
}
