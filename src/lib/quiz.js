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

/** Bangun 4 opsi kuis: jawaban benar + 3 pengecoh unik dari kartu lain.
 *  Kalau kartu kurang dari 4, opsi yang tersedia saja yang ditampilkan.
 *  Kalau ada jawaban sama, dide-duplikat. */
export const buildOptions = (card, cards) => {
  const correct = card.back_text || '…'
  const others = cards
    .filter((c) => c.id !== card.id && c.back_text && c.back_text !== correct)
    .map((c) => c.back_text)
  const unique = [...new Set(others)]
  const distractors = shuffleArr(unique).slice(0, 3)
  // Jika kurang dari 4 opsi (deck kecil), tetap tampilkan apa adanya
  return shuffleArr([correct, ...distractors])
}

// ============================================================
// Helper mode Ketik Jawaban
// ============================================================

/** Normalisasi teks jawaban: huruf kecil, rapikan spasi, buang tanda baca ujung. */
export const normalizeAnswer = (str) =>
  String(str ?? '')
    .toLowerCase()
    .trim()
    .replace(/[.!?…]+$/, '')
    .replace(/\s+/g, ' ')

/** Jarak Levenshtein sederhana (toleransi typo). */
const levenshtein = (a, b) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = curr
  }
  return prev[b.length]
}

/** Cek jawaban ketik. Jawaban boleh punya alternatif dipisah "/" atau ";".
 *  Toleransi 1 typo untuk kata ≥5 huruf (mis. "fotosintesa" ≈ "fotosintesis" tidak lolos,
 *  tapi "fotosintesis" lolos). */
export const checkTypedAnswer = (input, answer) => {
  const guess = normalizeAnswer(input)
  if (!guess) return false
  const alternatives = String(answer ?? '')
    .split(/[/;]/)
    .map((a) => normalizeAnswer(a))
    .filter(Boolean)
  return alternatives.some((alt) => {
    if (guess === alt) return true
    // Toleransi typo hanya untuk jawaban cukup panjang
    if (alt.length >= 5 && Math.abs(guess.length - alt.length) <= 1) {
      return levenshtein(guess, alt) <= 1
    }
    return false
  })
}
