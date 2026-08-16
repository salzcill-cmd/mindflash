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
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

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
              onClick={() => window.location.reload()}
            >
              Muat Ulang
            </Button>
            <a href="/dashboard">
              <Button variant="white" icon={<Icon name="home" size={16} />}>
                Ke Dashboard
              </Button>
            </a>
          </div>
          <div className="mt-8 opacity-40">
            <Logo size={22} />
          </div>
        </div>
      </div>
    )
  }
}
