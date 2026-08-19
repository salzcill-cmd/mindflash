import { Component } from 'react'
import Logo from './ui/Logo'
import Button from './ui/Button'
import { Icon } from './Icons'

/**
 * Penjaga aplikasi: kalau ada error runtime tak terduga, tampilkan
 * layar pemulihan yang ramah alih-alih layar putih kosong.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error untuk debugging (production bisa kirim ke service monitoring)
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  // Reset error state — biar user bisa coba lagi tanpa hard reload
  reset = () => {
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    const isDev = import.meta.env?.DEV

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[26px] bg-gradient-to-br from-brand to-pink text-white text-4xl shadow-[0_18px_44px_-14px_rgba(124,92,252,0.6)] mb-6 animate-bob">
            🛠️
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Waduh, ada yang kusut!</h1>
          <p className="text-ink-soft mb-6">
            Terjadi kesalahan tak terduga. Jangan khawatir — datamu aman. Coba muat ulang halaman
            ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              icon={<Icon name="refresh" size={16} />}
              onClick={this.reset}
            >
              Coba Lagi
            </Button>
            <Button
              variant="white"
              icon={<Icon name="home" size={16} />}
              onClick={() => window.location.reload()}
            >
              Muat Ulang
            </Button>
          </div>
          {/* Tampilkan detail error di dev mode saja */}
          {isDev && this.state.errorInfo && (
            <details className="mt-6 text-left bg-surface-2 rounded-2xl border-[1.5px] border-line p-4 text-xs text-ink-soft overflow-auto max-h-48">
              <summary className="cursor-pointer font-extrabold text-ink mb-2">Detail Error (Dev)</summary>
              <pre className="whitespace-pre-wrap break-words">
                {this.state.error?.message}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div className="mt-8 opacity-40">
            <Logo size={22} />
          </div>
        </div>
      </div>
    )
  }
}
