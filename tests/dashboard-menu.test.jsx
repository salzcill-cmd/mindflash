// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Dashboard from '../src/pages/Dashboard'
import { useAuthStore } from '../src/store/auth'
import { useGuestStore } from '../src/store/guest'

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

afterEach(() => cleanup())

const now = new Date().toISOString()

function seedGuest() {
  useGuestStore.setState({
    mindmaps: [
      {
        id: 'mm-1',
        title: 'Mindmap Tes',
        mode: 'freeform',
        data: { nodes: [], edges: [] },
        is_public: false,
        created_at: now,
        updated_at: now,
      },
    ],
    decks: [],
    progress: {},
  })
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mindmap/:id" element={<div>Halaman Editor</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Dashboard — menu tiga titik', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    seedGuest()
  })

  it('membuka dropdown saat tombol menu diklik', async () => {
    renderDashboard()

    const btn = await screen.findByRole('button', { name: 'Menu item' })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText('Ubah Nama')).toBeTruthy()
      expect(screen.getByText('Duplikat')).toBeTruthy()
      expect(screen.getByText('Share')).toBeTruthy()
      expect(screen.getByText('Hapus')).toBeTruthy()
    })
  })

  it('menutup dropdown saat tombol menu diklik lagi', async () => {
    renderDashboard()

    const btn = await screen.findByRole('button', { name: 'Menu item' })
    fireEvent.click(btn)
    await waitFor(() => expect(screen.getByText('Duplikat')).toBeTruthy())

    fireEvent.click(btn)
    await waitFor(() => expect(screen.queryByText('Duplikat')).toBeNull())
  })

  it('klik di luar dropdown menutup menu', async () => {
    renderDashboard()

    const btn = await screen.findByRole('button', { name: 'Menu item' })
    fireEvent.click(btn)
    await waitFor(() => expect(screen.getByText('Duplikat')).toBeTruthy())

    // Di browser asli, klik di luar diawali mousedown/touchstart
    fireEvent.mouseDown(document.body)
    fireEvent.click(document.body)
    await waitFor(() => expect(screen.queryByText('Duplikat')).toBeNull())
  })

  it('mousedown pada item menu tidak menutup menu sebelum klik (regresi)', async () => {
    renderDashboard()

    const btn = await screen.findByRole('button', { name: 'Menu item' })
    fireEvent.click(btn)
    const dup = await screen.findByText('Duplikat')

    // Di browser asli urutannya: mousedown → mouseup → click.
    // mousedown pada item TIDAK boleh menutup menu, kalau tidak aksi
    // item tidak akan pernah tereksekusi (bug lama).
    fireEvent.mouseDown(dup)
    expect(screen.queryByText('Duplikat')).not.toBeNull()

    fireEvent.click(dup)
    await waitFor(() => {
      const titles = useGuestStore.getState().mindmaps.map((m) => m.title)
      expect(titles).toContain('Mindmap Tes (Salinan)')
    })
  })
})
