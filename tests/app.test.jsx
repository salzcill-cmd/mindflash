// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import { useAuthStore } from '../src/store/auth'

// jsdom belum mengimplementasikan API browser ini — mock minimal
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = (q) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

describe('App — layar loading', () => {
  it('tidak macet: loading hilang setelah AuthProvider ter-mount', async () => {
    // Mulai dari kondisi "sedang memeriksa sesi"
    useAuthStore.setState({ loading: true, user: null, profile: null })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    // AuthProvider selalu ter-mount → efek berjalan → loading dimatikan.
    // (Dengan bug lama — early-return saat loading — provider tidak pernah
    // ter-mount dan layar loading akan macet selamanya; test ini akan timeout.)
    await waitFor(
      () => {
        expect(screen.queryByText('MindFlash sedang menyiapkan segalanya…')).toBeNull()
      },
      { timeout: 3000 },
    )

    // Konten aplikasi muncul (Navbar dengan tombol daftar)
    expect(screen.getByText('Daftar Gratis')).toBeTruthy()
  })
})
