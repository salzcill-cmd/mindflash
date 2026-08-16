// ============================================================
// Spaced Repetition — SM-2 sederhana (versi PRD MindFlash)
//
// Setiap kartu punya:
//   ease_factor   → mulai dari 2.5, seberapa "gampang" kartu diingat
//   interval_days → berapa hari lagi kartu muncul kembali
//   next_review_at→ tanggal review berikutnya
//
// Penilaian:
//   "Belum Hafal" (0) → interval di-reset ke 1 hari
//   "Ragu-ragu"  (1) → interval x1.2, ease dikurangi sedikit
//   "Sudah Hafal" (2) → interval x ease_factor, ease naik sedikit
// ============================================================

export const DEFAULT_EASE = 2.5
export const DAY_MS = 24 * 60 * 60 * 1000

const round1 = (n) => Math.round(n * 10) / 10

/**
 * @param {0|1|2} grade 0=belum hafal, 1=ragu-ragu, 2=sudah hafal
 * @param {{ease_factor?: number, interval_days?: number}} progress progres lama (opsional)
 * @returns {{ease_factor: number, interval_days: number, next_review_at: string, last_reviewed_at: string}}
 */
export function gradeCard(grade, progress = {}) {
  const ease = progress.ease_factor ?? DEFAULT_EASE
  const interval = progress.interval_days ?? 0
  const now = Date.now()

  const build = (intervalDays, easeOverride) => ({
    ease_factor: easeOverride ?? ease,
    interval_days: intervalDays,
    next_review_at: new Date(now + intervalDays * DAY_MS).toISOString(),
    last_reviewed_at: new Date(now).toISOString(),
  })

  if (grade === 0) {
    // Belum hafal → ulang besok, ease di-reset ke nilai awal agar kartu "dimulai lagi"
    return build(1, DEFAULT_EASE)
  }
  if (grade === 1) {
    // Ragu-ragu → interval naik sedikit, ease turun sedikit
    return build(Math.max(1, Math.round(interval * 1.2)), Math.max(1.3, round1(ease - 0.15)))
  }
  // Sudah hafal → interval dikali ease, ease naik sedikit
  return build(Math.max(1, Math.round(interval * ease)), Math.min(3.0, round1(ease + 0.1)))
}

/** Apakah kartu sudah waktunya direview (belum punya progres = due). */
export function isDue(progress, now = new Date()) {
  if (!progress || progress.next_review_at == null) return true
  return new Date(progress.next_review_at).getTime() <= now.getTime()
}

/** Tingkat penguasaan kartu berdasarkan interval. */
export function masteryLevel(progress) {
  if (!progress || progress.interval_days == null) return 'new'
  const i = progress.interval_days
  if (i >= 21) return 'mastered'
  if (i >= 7) return 'strong'
  if (i >= 2) return 'learning'
  return 'new'
}

/** Label UI untuk tingkat penguasaan. */
export const MASTERY_LABELS = {
  new: { label: 'Baru', color: '#9b94b6' },
  learning: { label: 'Belajar', color: '#ff8a5c' },
  strong: { label: 'Kuat', color: '#4cc9f0' },
  mastered: { label: 'Dikuasai', color: '#2ec4b6' },
}
