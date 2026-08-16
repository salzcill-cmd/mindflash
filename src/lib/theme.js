// ============================================================
// Tema (light / dark) — persist di localStorage, fallback ke
// preferensi sistem. Kelas .dark diterapkan pada <html>.
// ============================================================

const KEY = 'mindflash:theme'

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'dark' || t === 'light') return t
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage tidak tersedia — abaikan */
  }
  applyTheme(theme)
}
