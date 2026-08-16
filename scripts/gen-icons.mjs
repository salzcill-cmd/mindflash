// ============================================================
// Generator ikon PWA MindFlash — murni Node, tanpa library.
// Menghasilkan PNG dengan encoder PNG manual (zlib bawaan Node):
//   public/icons/icon-192.png          (192px, sudut membulat)
//   public/icons/icon-512.png          (512px, sudut membulat)
//   public/icons/maskable-512.png      (512px, persegi penuh, ikon lebih kecil)
//   public/icons/apple-touch-icon.png  (180px, sudut membulat)
// Jalankan: node scripts/gen-icons.mjs
// ============================================================

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const SS = 4 // supersampling untuk anti-aliasing halus

// ---------------- PNG encoder ----------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

const encodePng = (width, height, rgba) => {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

// ---------------- Rendering ----------------
const C1 = [124, 92, 252] // #7c5cfc
const C2 = [255, 111, 145] // #ff6f91
const WHITE = [255, 255, 255]

// Titik kilat (viewBox 24) — ikon zap MindFlash
const BOLT = [
  [13, 2],
  [4.5, 13.5],
  [11, 13.5],
  [9.5, 22],
  [19, 10],
  [12.5, 10],
]

const inPolygon = (x, y, poly) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const render = (size, { rounded = true, boltScale = 1 }) => {
  const S = size * SS
  const superBuf = Buffer.alloc(S * S * 4)
  const radius = rounded ? 0.22 * S : 0

  // Petakan kotak viewBox 24 ke area tengah
  const area = S * 0.52 * boltScale
  const scale = area / 20
  const ox = S / 2 - 11.75 * scale
  const oy = S / 2 - 12 * scale
  const boltPts = BOLT.map(([x, y]) => [x * scale + ox, y * scale + oy])

  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const idx = (py * S + px) * 4
      // mask sudut membulat
      let alpha = 1
      if (rounded) {
        const cx = Math.min(Math.max(px, radius), S - radius)
        const cy = Math.min(Math.max(py, radius), S - radius)
        const dx = px - cx
        const dy = py - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        alpha = dist <= radius ? 1 : 0
      }
      if (alpha === 0) continue
      // gradient diagonal
      const t = (px + py) / (2 * S)
      const r = Math.round(C1[0] + (C2[0] - C1[0]) * t)
      const g = Math.round(C1[1] + (C2[1] - C1[1]) * t)
      const b = Math.round(C1[2] + (C2[2] - C1[2]) * t)
      superBuf[idx] = r
      superBuf[idx + 1] = g
      superBuf[idx + 2] = b
      superBuf[idx + 3] = 255 * alpha
      // kilat putih
      if (inPolygon(px, py, boltPts)) {
        superBuf[idx] = WHITE[0]
        superBuf[idx + 1] = WHITE[1]
        superBuf[idx + 2] = WHITE[2]
        superBuf[idx + 3] = 255
      }
    }
  }

  // Downsample SS×SS → hasil akhir
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const idx = ((y * SS + sy) * S + (x * SS + sx)) * 4
          r += superBuf[idx]
          g += superBuf[idx + 1]
          b += superBuf[idx + 2]
          a += superBuf[idx + 3]
        }
      }
      const n = SS * SS
      const o = (y * size + x) * 4
      out[o] = Math.round(r / n)
      out[o + 1] = Math.round(g / n)
      out[o + 2] = Math.round(b / n)
      out[o + 3] = Math.round(a / n)
    }
  }
  return encodePng(size, size, out)
}

mkdirSync(OUT, { recursive: true })

const jobs = [
  ['icon-192.png', render(192, { rounded: true })],
  ['icon-512.png', render(512, { rounded: true })],
  ['maskable-512.png', render(512, { rounded: false, boltScale: 0.72 })],
  ['apple-touch-icon.png', render(180, { rounded: true })],
]

for (const [name, buf] of jobs) {
  writeFileSync(join(OUT, name), buf)
  console.log(`✓ ${name} — ${(buf.length / 1024).toFixed(1)} kB`)
}
console.log('Selesai. Ikon tersimpan di public/icons/')
