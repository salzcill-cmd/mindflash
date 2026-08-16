// ============================================================
// Template Mindmap — mulai cepat dengan struktur siap pakai
// ============================================================

export const MINDMAP_TEMPLATES = [
  {
    id: 'blank',
    name: 'Mulai Kosong',
    desc: 'Kanvas polos, bebas berkreasi',
    emoji: '🎨',
    mode: 'freeform',
  },
  {
    id: 'konsep',
    name: 'Peta Konsep',
    desc: 'Topik → sub topik → detail',
    emoji: '🗺️',
    mode: 'auto-layout',
  },
  {
    id: 'belajar',
    name: 'Rencana Belajar',
    desc: 'Target, materi, dan jadwal harian',
    emoji: '📅',
    mode: 'auto-layout',
  },
  {
    id: 'rumus',
    name: 'Rumus & Formula',
    desc: 'Kumpulan rumus penting',
    emoji: '🧮',
    mode: 'auto-layout',
  },
  {
    id: 'tugas',
    name: 'Daftar Tugas',
    desc: 'PR & tugas dengan prioritas',
    emoji: '✅',
    mode: 'auto-layout',
  },
  {
    id: 'bab',
    name: 'Struktur Bab',
    desc: 'Bab → sub-bab → poin materi',
    emoji: '📖',
    mode: 'auto-layout',
  },
]

const uid = () => crypto.randomUUID()

const buildTree = (label, color, icon, children = []) => ({ label, color, icon, children })

const TREES = {
  konsep: buildTree('Topik Utama', 'violet', '🧠', [
    buildTree('Sub Topik 1', 'blue', '📚', [
      buildTree('Detail A', 'sky', '💡'),
      buildTree('Detail B', 'sky', '📝'),
    ]),
    buildTree('Sub Topik 2', 'pink', '🎯', [buildTree('Detail C', 'amber', '⭐')]),
    buildTree('Sub Topik 3', 'mint', '🌱', [
      buildTree('Detail D', 'green', '✨'),
      buildTree('Detail E', 'green', '📖'),
    ]),
  ]),
  belajar: buildTree('Rencana Belajar', 'violet', '🎯', [
    buildTree('Target', 'coral', '🚀', [
      buildTree('Nilai impian', 'pink', '⭐'),
      buildTree('Topik utama', 'pink', '🧠'),
    ]),
    buildTree('Materi', 'blue', '📚', [
      buildTree('BAB 1', 'sky', '📖'),
      buildTree('BAB 2', 'sky', '📖'),
    ]),
    buildTree('Jadwal', 'mint', '📅', [
      buildTree('Senin', 'green', '☀️'),
      buildTree('Selasa', 'green', '☀️'),
      buildTree('Rabu', 'green', '☀️'),
    ]),
  ]),
  rumus: buildTree('Rumus Penting', 'violet', '🧮', [
    buildTree('Matematika', 'blue', '📐', [
      buildTree('Rumus 1', 'sky', '✏️'),
      buildTree('Rumus 2', 'sky', '✏️'),
    ]),
    buildTree('Fisika', 'pink', '⚡', [
      buildTree('Rumus 3', 'coral', '🔬'),
      buildTree('Rumus 4', 'coral', '🔬'),
    ]),
    buildTree('Kimia', 'mint', '🧪', [
      buildTree('Rumus 5', 'green', '💧'),
      buildTree('Rumus 6', 'green', '💧'),
    ]),
  ]),
  tugas: buildTree('Daftar Tugas', 'violet', '✅', [
    buildTree('PR Matematika', 'blue', '📐', [buildTree('Soal 1–5', 'sky', '✏️')]),
    buildTree('Tugas Biologi', 'mint', '🌱', [buildTree('Laporan praktikum', 'green', '📝')]),
    buildTree('Baca Buku', 'amber', '📖', [buildTree('Bab 3', 'coral', '⭐')]),
  ]),
  bab: buildTree('Mata Pelajaran', 'violet', '📚', [
    buildTree('Bab 1', 'blue', '📖', [
      buildTree('Sub-bab 1.1', 'sky', '🔍'),
      buildTree('Sub-bab 1.2', 'sky', '🔍'),
      buildTree('Sub-bab 1.3', 'sky', '🔍'),
    ]),
    buildTree('Bab 2', 'pink', '📖', [
      buildTree('Sub-bab 2.1', 'coral', '🔍'),
      buildTree('Sub-bab 2.2', 'coral', '🔍'),
    ]),
    buildTree('Bab 3', 'mint', '📖', [buildTree('Sub-bab 3.1', 'green', '🔍')]),
  ]),
}

/**
 * Membangun node+edges React Flow dari template pohon.
 * Mode auto-layout akan merapikan posisi otomatis saat editor dibuka.
 */
export function buildTemplate(templateId) {
  const root = TREES[templateId]
  if (!root) return null

  const nodes = []
  const edges = []

  const walk = (node, parentId) => {
    const id = uid()
    nodes.push({
      id,
      type: 'mind',
      position: { x: 0, y: 0 },
      data: { label: node.label, color: node.color, icon: node.icon },
    })
    if (parentId) edges.push({ id: uid(), source: parentId, target: id })
    node.children.forEach((c) => walk(c, id))
  }

  walk(root, null)

  return {
    title: root.label,
    mode: 'auto-layout',
    data: { nodes, edges, edgeType: 'bezier', direction: 'down' },
  }
}
