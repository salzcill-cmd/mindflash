// ============================================================
// Helper mode Kuis — dipisah dari file komponen agar aman
// untuk fast-refresh (Vite) dan mudah diuji unit.
// ============================================================

/** Fisher–Yates shuffle (array baru, tidak mengubah input). */
export const shuffleArr = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Bangun 4 opsi kuis: jawaban benar + 3 pengecoh unik dari kartu lain. */
export const buildOptions = (card, cards) => {
  const correct = card.back_text || '…'
  const others = cards
    .filter((c) => c.id !== card.id && c.back_text && c.back_text !== correct)
    .map((c) => c.back_text)
  const distractors = shuffleArr([...new Set(others)]).slice(0, 3)
  return shuffleArr([correct, ...distractors])
}
