import { toPng } from 'html-to-image'

/**
 * Export seluruh kanvas mindmap menjadi gambar PNG.
 * Mengatur viewport agar semua node terlihat (zoom 1), menangkap
 * elemen .react-flow__viewport, lalu mengembalikan viewport semula.
 */
export async function exportFlowAsPng(reactFlowInstance, nodes, { padding = 60, bg = '#fffbf4' } = {}) {
  const bounds = reactFlowInstance.getNodesBounds(nodes)
  if (bounds.width === 0 && bounds.height === 0) {
    throw new Error('Mindmap masih kosong')
  }

  const prev = reactFlowInstance.getViewport()
  const viewportEl = document.querySelector('.react-flow__viewport')
  if (!viewportEl) throw new Error('Canvas tidak ditemukan')

  reactFlowInstance.setViewport({ x: -bounds.x + padding, y: -bounds.y + padding, zoom: 1 })
  await new Promise((r) => setTimeout(r, 120))

  try {
    const dataUrl = await toPng(viewportEl, {
      backgroundColor: bg,
      width: Math.ceil(bounds.width + padding * 2),
      height: Math.ceil(bounds.height + padding * 2),
      pixelRatio: 2,
      style: { fontFamily: "'Nunito', 'Baloo 2', sans-serif" },
    })
    return dataUrl
  } finally {
    reactFlowInstance.setViewport(prev)
  }
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
