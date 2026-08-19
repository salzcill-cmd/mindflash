// ============================================================
// Demo Content — materi contoh untuk user pertama kali
// Agar pengguna langsung paham gunanya MindFlash tanpa harus
// bikin dari nol dulu.
// ============================================================

import { useGuestStore } from '../store/guest'

// Cache in-memory agar seedDemoContent() hanya dicek sekali per sesi browser
let _seeded = null
const DEMO_KEY = 'mindflash:demo-seeded'

/**
 * Cek apakah demo sudah pernah di-seed.
 */
export function isDemoSeeded() {
  if (_seeded !== null) return _seeded
  try {
    _seeded = localStorage.getItem(DEMO_KEY) === 'true'
  } catch {
    _seeded = false
  }
  return _seeded
}

/**
 * Tandai bahwa demo sudah di-seed.
 */
function markSeeded() {
  _seeded = true
  try {
    localStorage.setItem(DEMO_KEY, 'true')
  } catch { /* ignore */ }
}

/**
 * Seed demo mindmap: "Fotosintesis" — struktur simpel yang langsung
 * memperlihatkan cara kerja mindmap (node + edge).
 */
const DEMO_MINDMAP = {
  title: 'Fotosintesis (Demo) 🌱',
  mode: 'auto-layout',
  data: {
    edgeType: 'bezier',
    direction: 'down',
    nodes: [
      { id: 'n1', type: 'mind', position: { x: 250, y: 0 }, data: { label: 'Fotosintesis', color: 'violet', icon: '🌱' } },
      { id: 'n2', type: 'mind', position: { x: 50, y: 120 }, data: { label: 'Cahaya Matahari', color: 'amber', icon: '☀️' } },
      { id: 'n3', type: 'mind', position: { x: 450, y: 120 }, data: { label: 'Klorofil', color: 'mint', icon: '💚' } },
      { id: 'n4', type: 'mind', position: { x: 50, y: 240 }, data: { label: 'Air (H₂O)', color: 'sky', icon: '💧' } },
      { id: 'n5', type: 'mind', position: { x: 250, y: 240 }, data: { label: 'CO₂ dari Udara', color: 'blue', icon: '🌬️' } },
      { id: 'n6', type: 'mind', position: { x: 450, y: 240 }, data: { label: 'Glukosa (C₆H₁₂O₆)', color: 'coral', icon: '🍬' } },
      { id: 'n7', type: 'mind', position: { x: 150, y: 360 }, data: { label: 'Oksigen (O₂)', color: 'pink', icon: '🫧' } },
      { id: 'n8', type: 'mind', position: { x: 350, y: 360 }, data: { label: 'Energi tersimpan', color: 'green', icon: '⚡' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n1', target: 'n3' },
      { id: 'e3', source: 'n2', target: 'n4' },
      { id: 'e4', source: 'n2', target: 'n5' },
      { id: 'e5', source: 'n3', target: 'n6' },
      { id: 'e6', source: 'n1', target: 'n7' },
      { id: 'e7', source: 'n6', target: 'n8' },
    ],
  },
}

/**
 * Seed demo flashcard: "Istilah Biologi" — 6 kartu yang langsung
 * memperlihatkan cara kerja flashcard.
 */
const DEMO_DECK = {
  title: 'Istilah Biologi (Demo) 🧬',
  color: 'violet',
  cards: [
    {
      front_text: 'Fotosintesis',
      back_text: 'Proses tumbuhan mengubah cahaya matahari, air, dan CO₂ menjadi glukosa + oksigen.',
    },
    {
      front_text: 'Klorofil',
      back_text: 'Pigmen hijau di daun yang menyerap cahaya matahari untuk fotosintesis.',
    },
    {
      front_text: 'Mitokondria',
      back_text: 'Organel sel yang mengubah glukosa menjadi energi (ATP) melalui respirasi seluler.',
    },
    {
      front_text: 'DNA',
      back_text: 'Asam deoksiribonukleat — molekul pembawa informasi genetik di semua makhluk hidup.',
    },
    {
      front_text: 'Osmosis',
      back_text: 'Pergerakan molekul air melalui membran semipermeable dari larutan encer ke pekat.',
    },
    {
      front_text: 'Ekosistem',
      back_text: 'Sistem interaksi antara makhluk hidup dan lingkungan fisik di suatu wilayah.',
    },
  ],
}

/**
 * Seed semua demo content ke guest store.
 * Hanya berjalan sekali (dicek via localStorage key).
 */
export function seedDemoContent() {
  // Cek cepat via cache in-memory — hindari localStorage read di tiap render
  if (_seeded === true) return false
  if (isDemoSeeded()) return false
  const store = useGuestStore.getState()

  // Jika user sudah punya data, jangan timpa
  if (store.mindmaps.length > 0 || store.decks.length > 0) {
    markSeeded()
    return false
  }

  // Seed mindmap demo
  const mm = store.addMindmap({
    title: DEMO_MINDMAP.title,
    mode: DEMO_MINDMAP.mode,
    data: DEMO_MINDMAP.data,
  })

  // Seed deck demo
  const deck = store.addDeck({
    title: DEMO_DECK.title,
    color: DEMO_DECK.color,
  })

  // Tambah kartu-kartu demo
  for (const card of DEMO_DECK.cards) {
    store.addCard(deck.id, {
      front_text: card.front_text,
      back_text: card.back_text,
    })
  }

  markSeeded()
  return true // returns true if demo was seeded
}

/**
 * Demo data untuk halaman Share (read-only) — tidak perlu akun/guest.
 */
export function getDemoMindmapData() {
  return DEMO_MINDMAP
}

export function getDemoDeckData() {
  return DEMO_DECK
}
