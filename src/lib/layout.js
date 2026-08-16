import { NODE_W, NODE_H } from './constants'

/**
 * Menyusun node mindmap menjadi struktur pohon rapi (top-down atau left-right).
 * Akar = node tanpa edge masuk; bila ada beberapa akar, disusun berdampingan.
 *
 * @param {Array} nodes  React Flow nodes
 * @param {Array} edges  React Flow edges
 * @param {'down'|'right'} direction arah pertumbuhan
 * @returns {Array} nodes baru dengan posisi yang sudah dihitung
 */
export function computeAutoLayout(nodes, edges, direction = 'down') {
  if (nodes.length === 0) return nodes

  const idMap = new Map(nodes.map((n) => [n.id, n]))
  const children = new Map()
  const hasParent = new Set()

  for (const e of edges) {
    if (!children.has(e.source)) children.set(e.source, [])
    children.get(e.source).push(e.target)
    hasParent.add(e.target)
  }

  const roots = nodes.filter((n) => !hasParent.has(n.id))
  const isDown = direction === 'down'
  const SIB_GAP = isDown ? 70 : 54 // jarak antar saudara
  const DEPTH_GAP = isDown ? 96 : 100 // jarak antar tingkat

  // Ukuran "kotak" yang ditempati sebuah subtree.
  const measure = (id) => {
    const node = idMap.get(id)
    const nw = node?.data?.width ?? NODE_W
    const nh = node?.data?.height ?? NODE_H
    const kids = children.get(id) ?? []
    if (kids.length === 0) return { w: nw, h: nh }
    let w = 0
    let h = 0
    kids.forEach((k) => {
      const s = measure(k)
      if (isDown) {
        w += s.w
        h = Math.max(h, s.h)
      } else {
        h += s.h
        w = Math.max(w, s.w)
      }
    })
    if (isDown) {
      w += SIB_GAP * (kids.length - 1)
      h += nh + DEPTH_GAP
    } else {
      h += SIB_GAP * (kids.length - 1)
      w += nw + DEPTH_GAP
    }
    return { w: Math.max(w, nw), h: Math.max(h, nh) }
  }

  const positions = new Map()

  const place = (id, x, y) => {
    const node = idMap.get(id)
    const nw = node?.data?.width ?? NODE_W
    const nh = node?.data?.height ?? NODE_H
    positions.set(id, { x, y })
    const kids = children.get(id) ?? []
    if (kids.length === 0) return
    const sizes = kids.map((k) => measure(k))
    if (isDown) {
      const total = sizes.reduce((a, s) => a + s.w, 0) + SIB_GAP * (kids.length - 1)
      let cursor = x + nw / 2 - total / 2
      kids.forEach((k, i) => {
        place(k, cursor, y + nh + DEPTH_GAP)
        cursor += sizes[i].w + SIB_GAP
      })
    } else {
      const total = sizes.reduce((a, s) => a + s.h, 0) + SIB_GAP * (kids.length - 1)
      let cursor = y + nh / 2 - total / 2
      kids.forEach((k, i) => {
        place(k, x + nw + DEPTH_GAP, cursor)
        cursor += sizes[i].h + SIB_GAP
      })
    }
  }

  const rootSizes = roots.map((r) => measure(r.id))
  let rx = 0
  let ry = 0
  roots.forEach((r, i) => {
    place(r.id, rx, ry)
    if (isDown) rx += rootSizes[i].w + 90
    else ry += rootSizes[i].h + 90
  })

  // Normalisasi ke koordinat >= 0
  let minX = Infinity
  let minY = Infinity
  positions.forEach((p) => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
  })
  const ox = minX === Infinity ? 0 : minX
  const oy = minY === Infinity ? 0 : minY

  return nodes.map((n) => {
    const p = positions.get(n.id) ?? { x: 0, y: 0 }
    return { ...n, position: { x: p.x - ox, y: p.y - oy } }
  })
}
