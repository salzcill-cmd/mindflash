// ============================================================
// Sanitize — XSS Prevention Utility
// MindFlash tidak pakai dangerouslySetInnerHTML, tapi teks user
// tetap perlu dibersihkan untuk menghindari:
//   1. Injection via judul mindmap / deck / flashcard yang masuk ke
//      DOM attributes (title, alt, aria-label)
//   2. Stored XSS jika ada fitur export/import di masa depan
//   3. Script injection via clipboard paste
// ============================================================

/**
 * Hapus semua tag HTML dari string. Aman untuk text content.
 * Mengubah `<script>alert(1)</script>` jadi `scriptalert(1)/script`.
 */
export function stripHtml(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Escape karakter spesial HTML agar aman ditampilkan.
 * '&' → '&amp;', '<' → '&lt;', '>' → '&gt;', '"' → '&quot;', "'" → '&#x27;'
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }
  return str.replace(/[&<>"']/g, (c) => map[c])
}

/**
 * Sanitize teks input user — gabungan strip + trim + limitasi panjang.
 * Cocok untuk judul mindmap, nama deck, nama file, dll.
 */
export function sanitizeText(str, { maxLength = 200 } = {}) {
  if (typeof str !== 'string') return ''
  return stripHtml(str).trim().slice(0, maxLength)
}

/**
 * Sanitize teks panjang — untuk konten flashcard (front/back text).
 * Lebih longgar dari sanitizeText karena konten lebih bebas.
 */
export function sanitizeContent(str, { maxLength = 5000 } = {}) {
  if (typeof str !== 'string') return ''
  return stripHtml(str).trim().slice(0, maxLength)
}

/**
 * Validasi URL — pastikan hanya http/https, bukan javascript: atau data:
 * Mengembalikan true jika valid, false jika berbahaya.
 */
export function isSafeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitize URL — kembalikan URL asli jika aman, '' jika tidak.
 */
export function sanitizeUrl(url) {
  return isSafeUrl(url) ? url.trim() : ''
}

/**
 * Validasi & batasi ukuran dan tipe file upload.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, { maxSizeMB = 2, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = {}) {
  if (!file) return { valid: false, error: 'Tidak ada file dipilih.' }
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Tipe file tidak didukung. Gunakan: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}.` }
  }
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `Ukuran file terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal ${maxSizeMB}MB.` }
  }
  return { valid: true }
}

/**
 * Rate limiter sederhana di sisi client.
 * Membatasi jumlah percobaan dalam rentang waktu tertentu.
 */
export function createRateLimiter({ maxAttempts = 5, windowMs = 60_000 } = {}) {
  const attempts = []

  return {
    /** Cek apakah masih boleh mencoba. */
    canAttempt() {
      const now = Date.now()
      // Buang percobaan yang sudah lewat window
      while (attempts.length > 0 && attempts[0] <= now - windowMs) {
        attempts.shift()
      }
      return attempts.length < maxAttempts
    },

    /** Catat satu percobaan. */
    record() {
      attempts.push(Date.now())
    },

    /** Sisa waktu tunggu dalam milidetik (0 = boleh coba). */
    cooldownMs() {
      if (attempts.length < maxAttempts) return 0
      const oldest = attempts[0]
      return Math.max(0, oldest + windowMs - Date.now())
    },

    /** Jumlah percobaan dalam window saat ini. */
    get attemptsLeft() {
      const now = Date.now()
      while (attempts.length > 0 && attempts[0] <= now - windowMs) {
        attempts.shift()
      }
      return Math.max(0, maxAttempts - attempts.length)
    },
  }
}
