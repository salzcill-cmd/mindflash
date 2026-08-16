// ============================================================
// Lapisan data MindFlash
// - User login  → baca/tulis ke Supabase
// - User guest  → baca/tulis ke localStorage (useGuestStore)
// Semua fungsi async agar seragam, return data atau throw.
// ============================================================

import { supabase } from './supabase'
import { useAuthStore } from '../store/auth'
import { useGuestStore } from '../store/guest'
import { masteryLevel } from './sm2'

const currentUserId = () => useAuthStore.getState().user?.id ?? null

const err = (e, fallback = 'Terjadi kesalahan saat menyimpan data') => {
  console.error(e)
  throw new Error(e?.message || fallback)
}

// ============================================================
// MINDMAPS
// ============================================================

export async function listMindmaps() {
  if (!currentUserId()) {
    return useGuestStore.getState().mindmaps
  }
  const { data, error } = await supabase
    .from('mindmaps')
    .select('id, user_id, title, mode, data, is_public, created_at, updated_at')
    .eq('user_id', currentUserId())
    .order('created_at', { ascending: false })
  if (error) err(error)
  return data
}

export async function getMindmap(id) {
  if (!currentUserId()) {
    return useGuestStore.getState().mindmaps.find((m) => m.id === id) ?? null
  }
  const { data, error } = await supabase
    .from('mindmaps')
    .select('*')
    .eq('id', id)
    .eq('user_id', currentUserId())
    .maybeSingle()
  if (error) err(error)
  return data
}

export async function createMindmap({ title = 'Mindmap Baru', mode = 'freeform', data = null } = {}) {
  if (!currentUserId()) {
    return useGuestStore.getState().addMindmap({ title, mode, data })
  }
  const { data: row, error } = await supabase
    .from('mindmaps')
    .insert({ user_id: currentUserId(), title, mode, data, is_public: false })
    .select()
    .single()
  if (error) err(error)
  return row
}

export async function updateMindmap(id, patch) {
  if (!currentUserId()) {
    useGuestStore.getState().updateMindmap(id, patch)
    return { id, ...patch }
  }
  const { data, error } = await supabase
    .from('mindmaps')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', currentUserId())
    .select()
    .single()
  if (error) err(error)
  return data
}

export async function deleteMindmap(id) {
  if (!currentUserId()) {
    useGuestStore.getState().deleteMindmap(id)
    return
  }
  const { error } = await supabase
    .from('mindmaps')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUserId())
  if (error) err(error)
}

export async function duplicateMindmap(id) {
  if (!currentUserId()) {
    return useGuestStore.getState().duplicateMindmap(id)
  }
  const src = await getMindmap(id)
  if (!src) return null
  const { data, error } = await supabase
    .from('mindmaps')
    .insert({
      user_id: currentUserId(),
      title: `${src.title} (Salinan)`,
      mode: src.mode,
      data: src.data ? JSON.parse(JSON.stringify(src.data)) : null,
      is_public: false,
    })
    .select()
    .single()
  if (error) err(error)
  return data
}

export async function setMindmapPublic(id, isPublic) {
  return updateMindmap(id, { is_public: isPublic })
}

// ============================================================
// DECKS + CARDS
// ============================================================

export async function listDecks() {
  if (!currentUserId()) {
    return useGuestStore.getState().decks.map((d) => ({
      ...d,
      cards: undefined,
      card_count: d.cards.length,
    }))
  }
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('id, user_id, title, color, is_public, created_at, cards:flashcards(order_index)')
    .eq('user_id', currentUserId())
    .order('created_at', { ascending: false })
  if (error) err(error)
  return (data ?? []).map((d) => ({ ...d, card_count: d.cards?.length ?? 0, cards: undefined }))
}

export async function getDeck(id) {
  if (!currentUserId()) {
    return useGuestStore.getState().decks.find((d) => d.id === id) ?? null
  }
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('*, cards:flashcards(*)')
    .eq('id', id)
    .eq('user_id', currentUserId())
    .maybeSingle()
  if (error) err(error)
  if (data?.cards) {
    data.cards.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  }
  return data
}

export async function createDeck({ title = 'Deck Baru', color = 'violet' } = {}) {
  if (!currentUserId()) {
    return useGuestStore.getState().addDeck({ title, color })
  }
  const { data, error } = await supabase
    .from('flashcard_decks')
    .insert({ user_id: currentUserId(), title, color, is_public: false })
    .select()
    .single()
  if (error) err(error)
  return data
}

export async function updateDeck(id, patch) {
  if (!currentUserId()) {
    useGuestStore.getState().updateDeck(id, patch)
    return { id, ...patch }
  }
  const { data, error } = await supabase
    .from('flashcard_decks')
    .update(patch)
    .eq('id', id)
    .eq('user_id', currentUserId())
    .select()
    .single()
  if (error) err(error)
  return data
}

export async function deleteDeck(id) {
  if (!currentUserId()) {
    useGuestStore.getState().deleteDeck(id)
    return
  }
  const { error } = await supabase
    .from('flashcard_decks')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUserId())
  if (error) err(error)
}

export async function duplicateDeck(id) {
  if (!currentUserId()) {
    return useGuestStore.getState().duplicateDeck(id)
  }
  const src = await getDeck(id)
  if (!src) return null
  const { data: deck, error: deckErr } = await supabase
    .from('flashcard_decks')
    .insert({
      user_id: currentUserId(),
      title: `${src.title} (Salinan)`,
      color: src.color,
      is_public: false,
    })
    .select()
    .single()
  if (deckErr) err(deckErr)
  if ((src.cards ?? []).length > 0) {
    const rows = src.cards.map((c) => ({
      deck_id: deck.id,
      front_text: c.front_text,
      back_text: c.back_text,
      image_url: c.image_url,
      order_index: c.order_index,
    }))
    const { error: cardErr } = await supabase.from('flashcards').insert(rows)
    if (cardErr) err(cardErr)
  }
  return deck
}

export async function addCard(deckId, { front_text = '', back_text = '', image_url = null } = {}) {
  if (!currentUserId()) {
    return useGuestStore.getState().addCard(deckId, { front_text, back_text, image_url })
  }
  const deck = await getDeck(deckId)
  const order_index = deck?.cards?.length ?? 0
  const { data, error } = await supabase
    .from('flashcards')
    .insert({ deck_id: deckId, front_text, back_text, image_url, order_index })
    .select()
    .single()
  if (error) err(error)
  return data
}

export async function updateCard(deckId, cardId, patch) {
  if (!currentUserId()) {
    useGuestStore.getState().updateCard(deckId, cardId, patch)
    return { id: cardId, ...patch }
  }
  const { data, error } = await supabase
    .from('flashcards')
    .update(patch)
    .eq('id', cardId)
    .eq('deck_id', deckId)
    .select()
    .single()
  if (error) err(error)
  return data
}

export async function deleteCard(deckId, cardId) {
  if (!currentUserId()) {
    useGuestStore.getState().deleteCard(deckId, cardId)
    return
  }
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId)
    .eq('deck_id', deckId)
  if (error) err(error)
}

export async function reorderCards(deckId, orderedIds) {
  if (!currentUserId()) {
    useGuestStore.getState().reorderCards(deckId, orderedIds)
    return
  }
  const updates = orderedIds.map((id, i) => ({
    id,
    deck_id: deckId,
    order_index: i,
  }))
  const { error } = await supabase.from('flashcards').upsert(updates)
  if (error) err(error)
}

export async function setDeckPublic(id, isPublic) {
  return updateDeck(id, { is_public: isPublic })
}

// ============================================================
// AKSES PUBLIK (share link, read-only)
// ============================================================

export async function getPublicMindmap(id) {
  if (supabase) {
    const { data, error } = await supabase
      .from('mindmaps')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .maybeSingle()
    if (error) console.warn('getPublicMindmap:', error.message)
    if (data) return data
  }
  // Fallback: data guest di browser yang sama
  return useGuestStore.getState().mindmaps.find((m) => m.id === id && m.is_public) ?? null
}

export async function getPublicDeck(id) {
  if (supabase) {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*, cards:flashcards(*)')
      .eq('id', id)
      .eq('is_public', true)
      .maybeSingle()
    if (error) console.warn('getPublicDeck:', error.message)
    if (data) {
      data.cards.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      return data
    }
  }
  const deck = useGuestStore.getState().decks.find((d) => d.id === id && d.is_public) ?? null
  return deck ? { ...deck, cards: [...(deck.cards ?? [])].sort((a, b) => a.order_index - b.order_index) } : null
}

// ============================================================
// PROGRES SM-2
// ============================================================

export async function getProgressForCards(cardIds) {
  if (!currentUserId()) {
    const all = useGuestStore.getState().progress
    const map = {}
    cardIds.forEach((cid) => {
      if (all[cid]) map[cid] = all[cid]
    })
    return map
  }
  const ids = [...new Set(cardIds)]
  if (ids.length === 0) return {}
  const { data, error } = await supabase
    .from('flashcard_progress')
    .select('*')
    .eq('user_id', currentUserId())
    .in('flashcard_id', ids)
  if (error) err(error)
  const map = {}
  ;(data ?? []).forEach((p) => {
    map[p.flashcard_id] = p
  })
  return map
}

/** Hapus seluruh progres SM-2 untuk semua kartu dalam satu deck. */
export async function resetDeckProgress(deckId) {
  const deck = await getDeck(deckId)
  const cardIds = (deck?.cards ?? []).map((c) => c.id)
  if (cardIds.length === 0) return
  if (!currentUserId()) {
    useGuestStore.getState().resetProgress(cardIds)
    return
  }
  const { error } = await supabase
    .from('flashcard_progress')
    .delete()
    .eq('user_id', currentUserId())
    .in('flashcard_id', cardIds)
  if (error) err(error)
}

/** Ringkasan penguasaan per deck (total kartu & persen dikuasai). */
export async function getDecksMastery(deckIds) {
  const result = {}
  const ids = [...new Set(deckIds)].filter(Boolean)
  if (ids.length === 0) return result

  if (!currentUserId()) {
    const decks = useGuestStore.getState().decks.filter((d) => ids.includes(d.id))
    for (const d of decks) {
      const cards = d.cards ?? []
      const progress = useGuestStore.getState().progress
      const mastered = cards.filter((c) => masteryLevel(progress[c.id]) === 'mastered').length
      result[d.id] = {
        total: cards.length,
        mastered,
        pct: cards.length ? Math.round((mastered / cards.length) * 100) : 0,
      }
    }
    return result
  }

  const { data: cards } = await supabase.from('flashcards').select('id, deck_id').in('deck_id', ids)
  if (cards && cards.length > 0) {
    const cardIds = cards.map((c) => c.id)
    const { data: prog } = await supabase
      .from('flashcard_progress')
      .select('flashcard_id, ease_factor, interval_days, next_review_at, last_reviewed_at')
      .eq('user_id', currentUserId())
      .in('flashcard_id', cardIds)
    if (prog && prog.length > 0) {
      const pm = {}
      ;(prog ?? []).forEach((p) => {
        pm[p.flashcard_id] = p
      })
      const counts = {}
      cards.forEach((c) => {
        counts[c.deck_id] = counts[c.deck_id] ?? { total: 0, mastered: 0 }
        counts[c.deck_id].total += 1
        if (masteryLevel(pm[c.id]) === 'mastered') counts[c.deck_id].mastered += 1
      })
      Object.entries(counts).forEach(([deckId, c]) => {
        result[deckId] = {
          total: c.total,
          mastered: c.mastered,
          pct: c.total ? Math.round((c.mastered / c.total) * 100) : 0,
        }
      })
    }
  }
  return result
}

export async function saveProgress(cardId, progress) {
  if (!currentUserId()) {
    useGuestStore.getState().setProgress(cardId, progress)
    return { flashcard_id: cardId, ...progress }
  }
  const { data, error } = await supabase
    .from('flashcard_progress')
    .upsert(
      { user_id: currentUserId(), flashcard_id: cardId, ...progress },
      { onConflict: 'user_id,flashcard_id' },
    )
    .select()
    .single()
  if (error) err(error)
  return data
}

// ============================================================
// PROFIL
// ============================================================

export async function getProfile(userId) {
  if (!userId) return null
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) err(error)
  if (!data) {
    const meta = useAuthStore.getState().user?.user_metadata ?? {}
    const res = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: meta.full_name || meta.name || meta.preferred_username || 'Pelajar MindFlash',
        avatar_url: meta.avatar_url || meta.picture || null,
      })
      .select()
      .single()
    if (res.error) err(res.error, 'Gagal membuat profil')
    data = res.data
  }
  return data
}

export async function updateProfile(patch) {
  const uid = currentUserId()
  if (!uid) throw new Error('Harus login untuk mengubah profil')
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', uid)
    .select()
    .single()
  if (error) err(error)
  return data
}

// ============================================================
// MIGRASI DATA GUEST → AKUN
// ============================================================

export async function migrateGuestToAccount() {
  const uid = currentUserId()
  if (!uid) return { migrated: 0 }
  const guest = useGuestStore.getState()
  let migrated = 0

  for (const mm of guest.mindmaps) {
    const { error } = await supabase.from('mindmaps').insert({
      id: mm.id,
      user_id: uid,
      title: mm.title,
      mode: mm.mode,
      data: mm.data,
      is_public: mm.is_public,
      created_at: mm.created_at,
      updated_at: mm.updated_at,
    })
    if (error) console.warn('migrasi mindmap gagal:', error.message)
    else migrated++
  }

  for (const deck of guest.decks) {
    const { error: deckErr } = await supabase.from('flashcard_decks').insert({
      id: deck.id,
      user_id: uid,
      title: deck.title,
      color: deck.color,
      is_public: deck.is_public,
      created_at: deck.created_at,
    })
    if (deckErr) {
      console.warn('migrasi deck gagal:', deckErr.message)
      continue
    }
    migrated++
    for (const card of deck.cards ?? []) {
      const { error: cardErr } = await supabase.from('flashcards').insert({
        id: card.id,
        deck_id: deck.id,
        front_text: card.front_text,
        back_text: card.back_text,
        image_url: card.image_url,
        order_index: card.order_index,
      })
      if (cardErr) console.warn('migrasi kartu gagal:', cardErr.message)
      else migrated++
    }
  }

  for (const [cardId, progress] of Object.entries(guest.progress)) {
    const { error } = await supabase.from('flashcard_progress').upsert(
      { user_id: uid, flashcard_id: cardId, ...progress },
      { onConflict: 'user_id,flashcard_id' },
    )
    if (error) console.warn('migrasi progres gagal:', error.message)
    else migrated++
  }

  if (migrated > 0) useGuestStore.getState().clearAll()
  return { migrated }
}

// ============================================================
// HAPUS SEMUA DATA (untuk hapus akun)
// ============================================================

export async function deleteAllUserData() {
  const uid = currentUserId()
  if (!uid) return
  // Semua tabel punya foreign key ON DELETE CASCADE ke profiles,
  // jadi menghapus profil otomatis menghapus mindmap, deck, kartu, & progres.
  const { error } = await supabase.from('profiles').delete().eq('id', uid)
  if (error) throw error
}
