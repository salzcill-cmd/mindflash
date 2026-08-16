// ============================================================
// Shared constants — MindFlash
// ============================================================

/** Palette warna node mindmap. Setiap warna punya pasangan soft/border/tint. */
export const NODE_COLORS = [
  { id: 'violet', name: 'Ungu', bg: '#efeaff', border: '#7c5cfc', text: '#5b3fe8' },
  { id: 'blue', name: 'Biru', bg: '#e7f0ff', border: '#4d96ff', text: '#2f6fe0' },
  { id: 'sky', name: 'Langit', bg: '#e3f7fe', border: '#38c6f4', text: '#0f94c8' },
  { id: 'mint', name: 'Mint', bg: '#e1faf5', border: '#2ec4b6', text: '#0e9e92' },
  { id: 'green', name: 'Hijau', bg: '#e7f9ec', border: '#3ecf6e', text: '#1e9c4b' },
  { id: 'lime', name: 'Lime', bg: '#f3fbe3', border: '#a6d93b', text: '#6f9d12' },
  { id: 'amber', name: 'Kuning', bg: '#fff6d9', border: '#ffb020', text: '#c47e00' },
  { id: 'orange', name: 'Jingga', bg: '#ffefe3', border: '#ff8a4c', text: '#d95f17' },
  { id: 'coral', name: 'Koral', bg: '#ffe9e9', border: '#ff6b6b', text: '#d63a3a' },
  { id: 'pink', name: 'Pink', bg: '#ffeaf4', border: '#f75da8', text: '#c92f78' },
]

export const nodeColor = (id) =>
  NODE_COLORS.find((c) => c.id === id) ?? NODE_COLORS[0]

/** Kumpulan ikon/emoji pilihan untuk node (ramah pemula, tanpa emoji picker rumit). */
export const NODE_ICONS = [
  '🧠', '📚', '💡', '⭐', '🎯', '📝', '🔬', '🧪', '🌍', '🕰️',
  '💪', '🎨', '🎵', '🏆', '🚀', '🌱', '🔥', '💎', '✨', '📖',
  '🧮', '✏️', '🗺️', '🔍', '💬', '🎭', '⚽', '🍎', '☀️', '🌙',
]

/** Warna cover deck flashcard. */
export const DECK_COLORS = [
  { id: 'violet', bg: '#7c5cfc', soft: '#efeaff', name: 'Ungu' },
  { id: 'pink', bg: '#ff6f91', soft: '#ffeaf1', name: 'Pink' },
  { id: 'coral', bg: '#ff8a5c', soft: '#ffefe6', name: 'Koral' },
  { id: 'amber', bg: '#ffb627', soft: '#fff5dc', name: 'Kuning' },
  { id: 'mint', bg: '#2ec4b6', soft: '#e1faf6', name: 'Mint' },
  { id: 'sky', bg: '#4cc9f0', soft: '#e4f7fe', name: 'Langit' },
  { id: 'blue', bg: '#4d96ff', soft: '#e7f0ff', name: 'Biru' },
  { id: 'crimson', bg: '#ff5d8f', soft: '#ffe7ee', name: 'Merah' },
]

export const deckColor = (id) => DECK_COLORS.find((c) => c.id === id) ?? DECK_COLORS[0]

/** Ukuran dasar node mindmap (dipakai auto-layout & export). */
export const NODE_W = 190
export const NODE_H = 84

export const DEFAULT_MINDMAP_MODE = 'freeform'

export const AUTO_SAVE_DELAY = 2000 // ms setelah perubahan terakhir

export const MASTERED_INTERVAL = 21 // hari — kartu dianggap "dikuasai"
