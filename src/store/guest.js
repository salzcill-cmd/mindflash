import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const uid = () => crypto.randomUUID()

/**
 * Data guest disimpan sementara di localStorage browser.
 * Struktur meniru tabel Supabase supaya migrasi ke akun jadi mudah.
 */
export const useGuestStore = create(
  persist(
    (set, get) => ({
      mindmaps: [],
      decks: [], // deck berisi cards di dalamnya
      progress: {}, // { [flashcardId]: { ease_factor, interval_days, next_review_at, last_reviewed_at } }

      // ---------- Mindmaps ----------
      addMindmap: ({ title = 'Mindmap Baru', mode = 'freeform', data = null } = {}) => {
        const now = new Date().toISOString()
        const mm = { id: uid(), user_id: 'guest', title, mode, data, is_public: false, created_at: now, updated_at: now }
        set((s) => ({ mindmaps: [mm, ...s.mindmaps] }))
        return mm
      },
      updateMindmap: (id, patch) =>
        set((s) => ({
          mindmaps: s.mindmaps.map((m) =>
            m.id === id ? { ...m, ...patch, updated_at: new Date().toISOString() } : m,
          ),
        })),
      deleteMindmap: (id) => set((s) => ({ mindmaps: s.mindmaps.filter((m) => m.id !== id) })),
      duplicateMindmap: (id) => {
        const src = get().mindmaps.find((m) => m.id === id)
        if (!src) return null
        const now = new Date().toISOString()
        const copy = {
          ...src,
          id: uid(),
          title: `${src.title} (Salinan)`,
          data: src.data ? JSON.parse(JSON.stringify(src.data)) : null,
          is_public: false,
          created_at: now,
          updated_at: now,
        }
        set((s) => ({ mindmaps: [copy, ...s.mindmaps] }))
        return copy
      },

      // ---------- Decks ----------
      addDeck: ({ title = 'Deck Baru', color = 'violet' } = {}) => {
        const now = new Date().toISOString()
        const deck = { id: uid(), user_id: 'guest', title, color, is_public: false, created_at: now, cards: [] }
        set((s) => ({ decks: [deck, ...s.decks] }))
        return deck
      },
      updateDeck: (id, patch) =>
        set((s) => ({ decks: s.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDeck: (id) => set((s) => ({ decks: s.decks.filter((d) => d.id !== id) })),
      duplicateDeck: (id) => {
        const src = get().decks.find((d) => d.id === id)
        if (!src) return null
        const now = new Date().toISOString()
        const copy = {
          ...src,
          id: uid(),
          title: `${src.title} (Salinan)`,
          is_public: false,
          created_at: now,
          cards: src.cards.map((c) => ({ ...c, id: uid(), deck_id: '' })),
        }
        copy.cards.forEach((c) => (c.deck_id = copy.id))
        set((s) => ({ decks: [copy, ...s.decks] }))
        return copy
      },

      // ---------- Cards ----------
      addCard: (deckId, { front_text = '', back_text = '', image_url = null } = {}) => {
        const card = {
          id: uid(),
          deck_id: deckId,
          front_text,
          back_text,
          image_url,
          order_index: get().decks.find((d) => d.id === deckId)?.cards.length ?? 0,
        }
        set((s) => ({
          decks: s.decks.map((d) => (d.id === deckId ? { ...d, cards: [...d.cards, card] } : d)),
        }))
        return card
      },
      updateCard: (deckId, cardId, patch) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? { ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)) }
              : d,
          ),
        })),
      deleteCard: (deckId, cardId) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? { ...d, cards: d.cards.filter((c) => c.id !== cardId).map((c, i) => ({ ...c, order_index: i })) }
              : d,
          ),
        })),
      reorderCards: (deckId, orderedIds) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: orderedIds
                    .map((id) => d.cards.find((c) => c.id === id))
                    .filter(Boolean)
                    .map((c, i) => ({ ...c, order_index: i })),
                }
              : d,
          ),
        })),

      // ---------- Progress SM-2 ----------
      setProgress: (cardId, progress) =>
        set((s) => ({ progress: { ...s.progress, [cardId]: progress } })),
      resetProgress: (cardIds) =>
        set((s) => {
          const progress = { ...s.progress }
          cardIds.forEach((id) => delete progress[id])
          return { progress }
        }),

      // ---------- Migrasi / reset ----------
      hasData: () => {
        const s = get()
        return s.mindmaps.length > 0 || s.decks.length > 0 || Object.keys(s.progress).length > 0
      },
      clearAll: () => set({ mindmaps: [], decks: [], progress: {} }),
    }),
    { name: 'mindflash:guest' },
  ),
)
