import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Blobs from '../components/Blobs'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Icon } from '../components/Icons'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import ConfirmDialog from '../components/ConfirmDialog'
import ShareModal from '../components/ShareModal'
import TiltCard from '../components/TiltCard'
import { useAuthStore } from '../store/auth'
import { toast } from '../store/toast'
import { getStreak } from '../lib/streak'
import { deckColor, nodeColor } from '../lib/constants'
import { MINDMAP_TEMPLATES, buildTemplate } from '../lib/templates'
import {
  listMindmaps,
  listDecks,
  createMindmap,
  createDeck,
  getDeck,
  addCard,
  deleteMindmap,
  deleteDeck,
  duplicateMindmap,
  duplicateDeck,
  updateMindmap,
  updateDeck,
  setMindmapPublic,
  setDeckPublic,
  getDecksMastery,
} from '../lib/storage'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()

  const [mindmaps, setMindmaps] = useState([])
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('semua')
  const [query, setQuery] = useState('')
  const [streak] = useState(getStreak)

  const [renaming, setRenaming] = useState(null) // { type, id, title }
  const [deleting, setDeleting] = useState(null) // { type, id, title }
  const [sharing, setSharing] = useState(null) // { type, item }
  const [templateOpen, setTemplateOpen] = useState(false)
  const [sort, setSort] = useState('baru') // baru | lama | az
  const [deckMastery, setDeckMastery] = useState({})
  const lastDeletedRef = useRef(null) // backup item terhapus untuk undo

  const refresh = async () => {
    try {
      const [mms, dks] = await Promise.all([listMindmaps(), listDecks()])
      setMindmaps(mms ?? [])
      setDecks(dks ?? [])
      const mastery = await getDecksMastery((dks ?? []).map((d) => d.id))
      setDeckMastery(mastery)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [])

  const makeMindmap = async () => {
    setTemplateOpen(true)
  }

  const pickTemplate = async (tpl) => {
    setTemplateOpen(false)
    try {
      const built = tpl.id === 'blank' ? null : buildTemplate(tpl.id)
      const mm = await createMindmap({
        title: built?.title ?? 'Mindmap Baru',
        mode: built?.mode ?? 'freeform',
        data: built?.data ?? null,
      })
      toast.success(built ? `Template "${built.title}" siap! ✨` : 'Mindmap baru dibuat! ✨')
      navigate(`/mindmap/${mm.id}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const makeDeck = async () => {
    try {
      const deck = await createDeck({ title: 'Deck Baru' })
      toast.success('Deck baru dibuat! 🎴')
      navigate(`/flashcard/${deck.id}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const doDelete = async () => {
    if (!deleting) return
    try {
      // Simpan backup untuk bisa dibatalkan
      let backup = null
      if (deleting.type === 'deck') {
        const full = await getDeck(deleting.id)
        backup = full ? { cards: full.cards ?? [], color: full.color } : null
      } else {
        const item = mindmaps.find((m) => m.id === deleting.id)
        backup = item ? { data: item.data, mode: item.mode } : null
      }
      if (deleting.type === 'mindmap') await deleteMindmap(deleting.id)
      else await deleteDeck(deleting.id)
      setDeleting(null)
      refresh()
      lastDeletedRef.current = { type: deleting.type, title: deleting.title, backup }
      toast.success(`"${deleting.title}" dihapus.`, {
        action: { label: 'Batalkan', onClick: restoreDeleted },
      })
    } catch (e) {
      toast.error(e.message)
    }
  }

  const restoreDeleted = async () => {
    const d = lastDeletedRef.current
    if (!d) return
    try {
      if (d.type === 'mindmap') {
        await createMindmap({
          title: d.title,
          mode: d.backup?.mode ?? 'freeform',
          data: d.backup?.data ?? null,
        })
      } else {
        const deck = await createDeck({ title: d.title, color: d.backup?.color ?? 'violet' })
        for (const c of d.backup?.cards ?? []) {
          await addCard(deck.id, {
            front_text: c.front_text,
            back_text: c.back_text,
            image_url: c.image_url,
          })
        }
      }
      lastDeletedRef.current = null
      toast.success('Item berhasil dikembalikan! ♻️')
      refresh()
    } catch (e) {
      toast.error(e.message || 'Gagal mengembalikan item.')
    }
  }

  const doRename = async () => {
    if (!renaming) return
    try {
      if (renaming.type === 'mindmap') await updateMindmap(renaming.id, { title: renaming.title })
      else await updateDeck(renaming.id, { title: renaming.title })
      toast.success('Nama diperbarui.')
      setRenaming(null)
      refresh()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const doDuplicate = async (type, item) => {
    try {
      if (type === 'mindmap') await duplicateMindmap(item.id)
      else await duplicateDeck(item.id)
      toast.success('Berhasil diduplikat! 📄')
      refresh()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const togglePublic = async (type, item, val) => {
    if (type === 'mindmap') await setMindmapPublic(item.id, val)
    else await setDeckPublic(item.id, val)
    refresh()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byTitle = (a, b) => a.title.localeCompare(b.title)
    const byNew = (a, b) => new Date(b.created_at) - new Date(a.created_at)
    const byOld = (a, b) => new Date(a.created_at) - new Date(b.created_at)
    const cmp = sort === 'az' ? byTitle : sort === 'lama' ? byOld : byNew
    const mms = mindmaps
      .filter((m) => !q || m.title.toLowerCase().includes(q))
      .map((m) => ({ ...m, kind: 'mindmap' }))
    const dks = decks
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .map((d) => ({ ...d, kind: 'deck' }))
    const arr = tab === 'mindmap' ? mms : tab === 'flashcard' ? dks : [...mms, ...dks]
    return arr.sort(cmp)
  }, [mindmaps, decks, tab, query, sort])

  const totalItems = mindmaps.length + decks.length
  const totalCards = decks.reduce((a, d) => a + (d.card_count ?? 0), 0)
  const statPills = [
    { label: 'Mindmap', value: mindmaps.length, emoji: '🗺️', bg: '#efeaff', color: '#5b3fe8' },
    { label: 'Deck', value: decks.length, emoji: '🎴', bg: '#ffeaf4', color: '#c92f78' },
    { label: 'Kartu', value: totalCards, emoji: '🃏', bg: '#e1faf5', color: '#0e9e92' },
    { label: 'Streak', value: `${streak} hari`, emoji: '🔥', bg: '#fff6d9', color: '#c47e00' },
  ]

  return (
    <PageTransition>
      <div className="relative min-h-[calc(100vh-68px)]">
        <Blobs variant="rich" />

        {/* Header */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-sm font-extrabold text-ink-faint mb-1">
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fff6d9] text-[#c47e00]">
                    <Icon name="flame" size={14} filled /> Streak {streak} hari
                  </span>
                )}
                {totalItems > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e1faf5] text-[#0e9e92]">
                    <Icon name="circle-check" size={14} /> {totalItems} item
                  </span>
                )}
              </p>
              <h1 className="text-3xl sm:text-[38px] font-extrabold">
                Halo,{' '}
                <span className="text-gradient">
                  {profile?.full_name?.split(' ')[0] || (user ? 'Pelajar' : 'Tamu')}
                </span>{' '}
                👋
              </h1>
              <p className="text-ink-soft mt-1">
                {user ? 'Mau belajar apa hari ini?' : 'Coba bikin mindmap atau flashcard pertamamu!'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="pink" size="md" onClick={makeMindmap} icon={<Icon name="mindmap" size={18} />}>
                + Buat Mindmap
              </Button>
              <Button variant="mint" size="md" onClick={makeDeck} icon={<Icon name="cards" size={18} />}>
                + Buat Flashcard
              </Button>
            </div>
          </div>

          {/* Statistik ringkas */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statPills.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                className="flex items-center gap-3 bg-surface rounded-2xl border-[1.5px] border-line px-4 py-3 shadow-[0_8px_22px_-14px_rgba(43,35,80,0.2)]"
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: s.bg }}
                >
                  {s.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-none" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-[11px] font-bold text-ink-faint mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Guest banner */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 flex flex-col sm:flex-row items-center gap-4 rounded-3xl bg-gradient-to-r from-[#fff6d9] to-[#ffeaf4] dark:from-[#3b3160] dark:to-[#4a2e4e] border-[1.5px] border-[#ffe3a3] dark:border-[#4a4179] px-5 py-4"
            >
              <span className="text-3xl animate-bob">🛟</span>
              <div className="flex-1 text-center sm:text-left">
                <p className="font-extrabold text-ink">Kamu sedang dalam mode guest.</p>
                <p className="text-sm text-ink-soft">
                  Datamu tersimpan sementara di browser ini. Daftar sekarang supaya tidak hilang!
                </p>
              </div>
              <Link to="/auth?mode=register">
                <Button size="md" icon={<Icon name="spark" size={16} />}>
                  Daftar Sekarang
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Controls */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="flex p-1.5 rounded-2xl bg-surface-2 w-fit">
              {[
                ['semua', 'Semua'],
                ['mindmap', 'Mindmap'],
                ['flashcard', 'Flashcard'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                    tab === key ? 'bg-surface shadow-[0_4px_12px_-4px_rgba(43,35,80,0.2)] text-ink' : 'text-ink-faint hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Icon
                  name="search"
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul…"
                  className="w-full bg-surface border-[1.5px] border-line rounded-2xl pl-11 pr-4 py-2.5 text-[15px] font-semibold placeholder:text-ink-faint focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none transition-all"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Urutkan item"
                className="shrink-0 bg-surface border-[1.5px] border-line rounded-2xl px-3.5 py-2.5 text-sm font-bold text-ink-soft focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 transition-all cursor-pointer"
              >
                <option value="baru">Terbaru</option>
                <option value="lama">Terlama</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-20">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-52 rounded-3xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              emoji={tab === 'flashcard' ? '🎴' : tab === 'mindmap' ? '🗺️' : '🎈'}
              icon={tab === 'flashcard' ? 'cards' : 'mindmap'}
              title={query ? 'Tidak ditemukan' : 'Masih kosong di sini'}
              desc={
                query
                  ? `Tidak ada hasil untuk "${query}". Coba kata kunci lain.`
                  : tab === 'flashcard'
                    ? 'Buat deck flashcard pertamamu dan mulai hafalan pintar!'
                    : 'Buat mindmap pertamamu — catatan visual yang seru!'
              }
              action={
                !query ? (
                  tab === 'flashcard' ? (
                    <Button variant="mint" onClick={makeDeck} icon={<Icon name="plus" size={16} />}>
                      Buat Flashcard
                    </Button>
                  ) : (
                    <Button variant="pink" onClick={makeMindmap} icon={<Icon name="plus" size={16} />}>
                      Buat Mindmap
                    </Button>
                  )
                ) : undefined
              }
            />
          ) : (
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((item, i) =>
                  item.kind === 'mindmap' ? (
                    <MindmapCard
                      key={item.id}
                      item={item}
                      index={i}
                      onOpen={() => navigate(`/mindmap/${item.id}`)}
                      onRename={() => setRenaming({ type: 'mindmap', id: item.id, title: item.title })}
                      onDuplicate={() => doDuplicate('mindmap', item)}
                      onShare={() => setSharing({ type: 'mindmap', item })}
                      onDelete={() => setDeleting({ type: 'mindmap', id: item.id, title: item.title })}
                    />
                  ) : (
                    <DeckCard
                      key={item.id}
                      item={item}
                      index={i}
                      mastery={deckMastery[item.id]}
                      onOpen={() => navigate(`/flashcard/${item.id}`)}
                      onRename={() => setRenaming({ type: 'deck', id: item.id, title: item.title })}
                      onDuplicate={() => doDuplicate('deck', item)}
                      onShare={() => setSharing({ type: 'deck', item })}
                      onDelete={() => setDeleting({ type: 'deck', id: item.id, title: item.title })}
                    />
                  ),
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Template modal */}
      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Buat Mindmap Baru"
        width="max-w-2xl"
      >
        <p className="text-sm text-ink-soft mb-4">
          Mulai dari kosong, atau pakai template siap pakai — bisa kamu ubah bebas setelahnya.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MINDMAP_TEMPLATES.map((tpl, i) => (
            <motion.button
              key={tpl.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => pickTemplate(tpl)}
              className="tap group flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-surface border-[1.5px] border-line hover:border-brand/50 hover:shadow-[0_14px_34px_-14px_rgba(124,92,252,0.4)] hover:-translate-y-0.5 transition-all text-left"
            >
              <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-soft to-[#ffeaf4] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {tpl.emoji}
              </span>
              <span>
                <span className="block font-extrabold text-sm text-ink">{tpl.name}</span>
                <span className="block text-xs text-ink-faint font-bold mt-0.5">{tpl.desc}</span>
              </span>
              <span
                className={`mt-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  tpl.mode === 'auto-layout' ? 'bg-[#e1faf5] text-[#0e9e92]' : 'bg-[#efeaff] text-brand-deep'
                }`}
              >
                {tpl.mode === 'auto-layout' ? 'Auto-Layout' : 'Bebas'}
              </span>
            </motion.button>
          ))}
        </div>
      </Modal>

      {/* Rename modal */}
      <Modal
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title="Ubah Nama"
        footer={
          <>
            <Button variant="white" onClick={() => setRenaming(null)}>
              Batal
            </Button>
            <Button onClick={doRename} icon={<Icon name="check" size={16} />}>
              Simpan
            </Button>
          </>
        }
      >
        <Input
          label="Nama baru"
          value={renaming?.title ?? ''}
          onChange={(e) => setRenaming((r) => (r ? { ...r, title: e.target.value } : r))}
          onKeyDown={(e) => e.key === 'Enter' && doRename()}
          autoFocus
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus item ini?"
        message={`"${deleting?.title ?? ''}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        onConfirm={doDelete}
      />

      {/* Share modal */}
      <ShareModal
        open={Boolean(sharing)}
        onClose={() => setSharing(null)}
        type={sharing?.type}
        id={sharing?.item?.id}
        isPublic={sharing?.item?.is_public}
        title={sharing?.item?.title}
        onTogglePublic={(val) => togglePublic(sharing.type, sharing.item, val)}
      />
    </PageTransition>
  )
}

/* ============================================================
   Mindmap card + thumbnail preview
   ============================================================ */
function MindmapThumb({ data }) {
  const nodes = data?.nodes ?? []
  if (nodes.length === 0) return null
  const xs = nodes.map((n) => n.position?.x ?? 0)
  const ys = nodes.map((n) => n.position?.y ?? 0)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs) + 200
  const maxY = Math.max(...ys) + 90
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  return (
    <div className="absolute inset-0 dot-grid">
      <svg className="absolute inset-0 w-full h-full" aria-hidden>
        {(data?.edges ?? []).map((e, i) => {
          const s = nodes.find((n) => n.id === e.source)
          const t = nodes.find((n) => n.id === e.target)
          if (!s || !t) return null
          const x1 = (((s.position?.x ?? 0) - minX + 100) / w) * 100
          const y1 = (((s.position?.y ?? 0) - minY + 40) / h) * 100
          const x2 = (((t.position?.x ?? 0) - minX + 100) / w) * 100
          const y2 = (((t.position?.y ?? 0) - minY + 40) / h) * 100
          const mx = (x1 + x2) / 2
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
              stroke="#c9bcec"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      {nodes.slice(0, 12).map((n) => {
        const c = nodeColor(n.data?.color)
        const left = (((n.position?.x ?? 0) - minX + 100) / w) * 100
        const top = (((n.position?.y ?? 0) - minY + 40) / h) * 100
        return (
          <span
            key={n.id}
            className="absolute rounded-lg border-[1.5px] text-[9px] font-extrabold flex items-center justify-center px-1.5 py-1 max-w-[54%] truncate shadow-sm"
            style={{
              left: `${Math.min(left, 82)}%`,
              top: `${Math.min(top, 78)}%`,
              backgroundColor: c.bg,
              borderColor: c.border,
              color: c.text,
            }}
          >
            {n.data?.icon ? `${n.data.icon} ` : ''}
            {String(n.data?.label ?? '').slice(0, 14)}
          </span>
        )
      })}
    </div>
  )
}

function CardMenu({ onOpen, onRename, onDuplicate, onShare, onDelete }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const items = [
    { label: 'Buka', icon: 'eye', fn: onOpen },
    { label: 'Ubah Nama', icon: 'pen', fn: onRename },
    { label: 'Duplikat', icon: 'copy', fn: onDuplicate },
    { label: 'Share', icon: 'share', fn: onShare },
    { label: 'Hapus', icon: 'trash', fn: onDelete, danger: true },
  ]

  const toggle = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      // Posisi dihitung dari tombol, lalu dropdown di-render via portal ke
      // <body> — supaya tidak terpotong oleh overflow-hidden kartu (bug HP).
      const r = btnRef.current.getBoundingClientRect()
      const W = 176 // w-44
      const left = Math.min(Math.max(r.right - W, 8), window.innerWidth - W - 8)
      setPos({ top: r.bottom + 6, left })
    }
    setOpen((v) => !v)
  }

  // Tutup saat klik di luar atau halaman di-scroll/resize (posisi fixed jadi basi)
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('touchstart', onClick)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('touchstart', onClick)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  return (
    <>
      <div ref={btnRef} className="relative">
        <button
          onClick={toggle}
          aria-label="Menu item"
          className="tap w-9 h-9 rounded-xl flex items-center justify-center text-ink-faint hover:bg-surface-2 hover:text-ink"
        >
          <Icon name="menu" size={18} />
        </button>
      </div>
      {open &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[70] w-44 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_18px_44px_-14px_rgba(43,35,80,0.35)] p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => {
                  setOpen(false)
                  it.fn()
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                  it.danger ? 'text-[#d63a3a] hover:bg-[#ffe9e9]' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon name={it.icon} size={16} />
                {it.label}
              </button>
            ))}
          </motion.div>,
          document.body,
        )}
    </>
  )
}

function MindmapCard({ item, index, onOpen, onRename, onDuplicate, onShare, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      onClick={onOpen}
      className="lift group bg-surface rounded-3xl border-[1.5px] border-line overflow-hidden cursor-pointer shadow-[0_10px_30px_-16px_rgba(43,35,80,0.18)]"
    >
      <TiltCard>
      <div className="relative h-40 bg-gradient-to-br from-[#f6f0ff] to-[#fff0f6]">
        <MindmapThumb data={item.data} />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface/85 backdrop-blur text-[11px] font-extrabold text-brand flex items-center gap-1.5 border-[1.5px] border-brand/20">
          <Icon name="mindmap" size={13} />
          {item.mode === 'auto-layout' ? 'Auto-Layout' : 'Freeform'}
        </span>
        {item.is_public && (
          <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#e1faf5] text-[#0e9e92] flex items-center justify-center border-[1.5px] border-mint/30">
            <Icon name="eye" size={15} />
          </span>
        )}
      </div>
      <div className="px-4 py-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-extrabold text-[15px] truncate group-hover:text-brand transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-ink-faint mt-0.5">
            {new Date(item.updated_at || item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}{' '}
            · {(item.data?.nodes ?? []).length} node
          </p>
        </div>
        <CardMenu onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} onShare={onShare} onDelete={onDelete} />
      </div>
      </TiltCard>
    </motion.div>
  )
}

function MasteryRing({ pct, size = 26, stroke = 3.5 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#efe9fa" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#2ec4b6"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        strokeLinecap="round"
      />
    </svg>
  )
}

function DeckCard({ item, index, mastery, onOpen, onRename, onDuplicate, onShare, onDelete }) {
  const c = deckColor(item.color)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      onClick={onOpen}
      className="lift group bg-surface rounded-3xl border-[1.5px] border-line overflow-hidden cursor-pointer shadow-[0_10px_30px_-16px_rgba(43,35,80,0.18)]"
    >
      <TiltCard>
      <div
        className="relative h-40 flex items-center justify-center"
        style={{ backgroundColor: c.soft }}
      >
        <div className="relative" style={{ transform: 'rotate(-4deg)' }}>
          <div
            className="absolute inset-0 rounded-2xl translate-x-2 translate-y-2 opacity-40"
            style={{ backgroundColor: c.bg }}
          />
          <div
            className="relative w-24 h-32 rounded-2xl border-[2px] border-white/80 shadow-[0_14px_30px_-10px_rgba(43,35,80,0.35)] flex flex-col items-center justify-center gap-1.5 text-white"
            style={{ backgroundColor: c.bg }}
          >
            <Icon name="cards" size={26} />
            <span className="text-[10px] font-extrabold tracking-wide">FLASHCARD</span>
          </div>
        </div>
        {item.is_public && (
          <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-surface/90 text-[#0e9e92] flex items-center justify-center border-[1.5px] border-mint/40">
            <Icon name="eye" size={15} />
          </span>
        )}
        {mastery && mastery.total > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-surface/90 backdrop-blur rounded-full pl-2 pr-2.5 py-1.5 border-[1.5px] border-line shadow-sm" title={`${mastery.mastered} dari ${mastery.total} kartu dikuasai`}>
            <MasteryRing pct={mastery.pct} size={24} />
            <span className="text-[11px] font-extrabold text-[#0e9e92]">{mastery.pct}%</span>
          </span>
        )}
      </div>
      <div className="px-4 py-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-extrabold text-[15px] truncate group-hover:text-brand transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-ink-faint mt-0.5">
            {item.card_count} kartu
            {mastery && mastery.total > 0 ? ` · ${mastery.pct}% dikuasai` : ''}
          </p>
        </div>
        <CardMenu onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} onShare={onShare} onDelete={onDelete} />
      </div>
      </TiltCard>
    </motion.div>
  )
}
