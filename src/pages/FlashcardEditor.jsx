import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Icon } from '../components/Icons'
import FlipCard from '../components/FlipCard'
import ShareModal from '../components/ShareModal'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { toast } from '../store/toast'
import { AUTO_SAVE_DELAY, DECK_COLORS, deckColor } from '../lib/constants'
import { sanitizeText, sanitizeContent, sanitizeUrl, isSafeUrl } from '../lib/sanitize'
import {
  getDeck,
  updateDeck,
  addCard,
  updateCard,
  deleteCard,
  reorderCards,
  setDeckPublic,
  resetDeckProgress,
  createDeck,
} from '../lib/storage'

export default function FlashcardEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [shareOpen, setShareOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [cardQuery, setCardQuery] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const importRef = useRef(null)

  const saveTimer = useRef(null)
  const loadedRef = useRef(false)

  const scheduleSave = (fn) => {
    setSaveStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await fn()
        setSaveStatus('saved')
      } catch (e) {
        setSaveStatus('error')
        toast.error(e.message)
      }
    }, AUTO_SAVE_DELAY)
  }

  // ---------- Load ----------
  useEffect(() => {
    let alive = true
    getDeck(id)
      .then((d) => {
        if (!alive) return
        if (!d) {
          toast.error('Deck tidak ditemukan.')
          navigate('/dashboard')
          return
        }
        setDeck({ id: d.id, title: d.title, color: d.color, is_public: d.is_public })
        setCards(d.cards ?? [])
        loadedRef.current = true
        setLoaded(true)
        setSelectedId(d.cards?.[0]?.id ?? null)
      })
      .catch((e) => {
        toast.error(e.message)
        navigate('/dashboard')
      })
    return () => {
      alive = false
    }
  }, [id, navigate])

  const selected = cards.find((c) => c.id === selectedId) ?? null
  const color = deckColor(deck?.color)

  // ---------- Aksi ----------
  const addNewCard = async () => {
    try {
      const card = await addCard(id, { front_text: '', back_text: '' })
      setCards((prev) => [...prev, card])
      setSelectedId(card.id)
      setFlipped(false)
      toast.success('Kartu baru ditambahkan! ✨')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const updateSelected = (patch) => {
    if (!selected) return
    const updated = { ...selected, ...patch }
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    scheduleSave(() => updateCard(id, selected.id, patch))
  }

  const removeCard = async () => {
    if (!deleting) return
    try {
      await deleteCard(id, deleting.id)
      setCards((prev) => prev.filter((c) => c.id !== deleting.id))
      if (selectedId === deleting.id) setSelectedId(null)
      toast.success('Kartu dihapus.')
      setDeleting(null)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const move = (cardId, dir) => {
    const idx = cards.findIndex((c) => c.id === cardId)
    if (idx < 0) return
    const j = idx + dir
    if (j < 0 || j >= cards.length) return
    const next = [...cards]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setCards(next.map((c, i) => ({ ...c, order_index: i })))
    scheduleSave(() => reorderCards(id, next.map((c) => c.id)))
  }

  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) return
    const from = cards.findIndex((c) => c.id === dragId)
    const to = cards.findIndex((c) => c.id === targetId)
    const next = [...cards]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setCards(next.map((c, i) => ({ ...c, order_index: i })))
    scheduleSave(() => reorderCards(id, next.map((c) => c.id)))
    setDragId(null)
  }

  const importJson = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const rawCards = Array.isArray(data) ? data : data.cards
      if (!Array.isArray(rawCards)) {
        toast.error('File JSON tidak valid — tidak ada daftar kartu.')
        return
      }
      const cardsData = rawCards
        .map((c) => ({
          front_text: String(c.front_text ?? c.front ?? ''),
          back_text: String(c.back_text ?? c.back ?? ''),
          image_url: c.image_url ?? c.image ?? null,
        }))
        .filter((c) => c.front_text || c.back_text)
      if (cardsData.length === 0) {
        toast.error('Tidak ada kartu valid di file ini.')
        return
      }
      const title = data.title ? `${data.title} (Impor)` : `${deck.title} (Impor)`
      const newDeck = await createDeck({ title, color: data.color ?? deck.color })
      for (const c of cardsData) {
        await addCard(newDeck.id, c)
      }
      toast.success(`${cardsData.length} kartu berhasil diimpor! 🎉`)
      navigate(`/flashcard/${newDeck.id}`)
    } catch {
      toast.error('File JSON tidak valid.')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  const exportJson = () => {
    const payload = {
      app: 'MindFlash',
      type: 'flashcard_deck',
      title: deck.title,
      color: deck.color,
      exported_at: new Date().toISOString(),
      cards: cards.map((c) => ({
        front_text: c.front_text,
        back_text: c.back_text,
        image_url: c.image_url,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deck.title.replace(/\s+/g, '-').toLowerCase() || 'deck'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Deck diexport sebagai JSON! 💾')
  }

  const duplicateCard = async () => {
    if (!selected) return
    try {
      const card = await addCard(id, {
        front_text: selected.front_text,
        back_text: selected.back_text,
        image_url: selected.image_url,
      })
      setCards((prev) => [...prev, card])
      setSelectedId(card.id)
      toast.success('Kartu diduplikat! 📄')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const doResetProgress = async () => {
    try {
      await resetDeckProgress(id)
      toast.success('Progres hafalan direset — semua kartu kembali baru! 🔄')
      setResetOpen(false)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const changeColor = (colorId) => {
    setDeck((d) => ({ ...d, color: colorId }))
    scheduleSave(() => updateDeck(id, { color: colorId }))
  }

  const changeTitle = (title) => {
    const safe = sanitizeText(title, { maxLength: 80 })
    setDeck((d) => ({ ...d, title: safe }))
    scheduleSave(() => updateDeck(id, { title: safe }))
  }

  const emptyCards = useMemo(() => cards.length === 0, [cards])
  const realIndex = (cardId) => cards.findIndex((c) => c.id === cardId)

  const filteredCards = useMemo(() => {
    const q = cardQuery.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(
      (c) =>
        (c.front_text || '').toLowerCase().includes(q) ||
        (c.back_text || '').toLowerCase().includes(q),
    )
  }, [cards, cardQuery])

  if (!loaded) {
    return (
      <PageTransition>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="skeleton h-16 rounded-2xl mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="skeleton h-[420px] rounded-3xl" />
            <div className="skeleton h-[420px] rounded-3xl" />
          </div>
        </div>
      </PageTransition>
    )
  }

  const saveLabel =
    saveStatus === 'saving' ? (
      <span className="text-amber flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber animate-pulse-soft" /> Menyimpan…
      </span>
    ) : saveStatus === 'error' ? (
      <span className="text-[#d63a3a] flex items-center gap-1.5">
        <Icon name="alert" size={14} /> Gagal simpan
      </span>
    ) : (
      <span className="text-mint flex items-center gap-1.5">
        <Icon name="circle-check" size={14} /> Tersimpan
      </span>
    )

  return (
    <PageTransition>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16 min-h-[calc(100vh-68px)]">
        {/* ======== Bar atas ======== */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_10px_26px_-14px_rgba(43,35,80,0.3)] pl-1.5 pr-3 py-1.5">
            <Link
              to="/dashboard"
              aria-label="Kembali"
              className="tap p-2 rounded-xl text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Icon name="arrow-left" size={18} />
            </Link>
            <input
              value={deck.title}
              onChange={(e) => changeTitle(e.target.value)}
              aria-label="Judul deck"
              className="bg-transparent font-extrabold text-ink text-[15px] w-32 sm:w-52 outline-none focus:ring-2 focus:ring-brand/30 rounded-lg px-1.5 py-0.5"
            />
            <span className="hidden sm:block text-xs font-bold text-ink-faint">{saveLabel}</span>
          </div>

          {/* Pilih warna cover */}
          <div className="flex items-center gap-1.5 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_10px_26px_-14px_rgba(43,35,80,0.3)] p-2">
            {DECK_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => changeColor(c.id)}
                aria-label={`Warna ${c.name}`}
                className="tap w-7 h-7 rounded-lg transition-transform hover:scale-115"
                style={{
                  backgroundColor: c.bg,
                  boxShadow: deck.color === c.id ? `0 0 0 2.5px white, 0 0 0 4.5px ${c.bg}` : undefined,
                }}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="white"
              size="sm"
              onClick={() => importRef.current?.click()}
              icon={<Icon name="upload" size={15} />}
              title="Import deck dari file JSON"
            >
              Import
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={importJson}
            />
            <Button variant="white" size="sm" onClick={exportJson} icon={<Icon name="download" size={15} />} title="Export deck sebagai JSON">
              Export
            </Button>
            <Button
              variant="white"
              size="sm"
              onClick={() => setResetOpen(true)}
              icon={<Icon name="refresh" size={15} />}
              title="Reset progres hafalan deck ini"
            >
              Reset Hafalan
            </Button>
            <Button variant="white" size="sm" onClick={() => setShareOpen(true)} icon={<Icon name="share" size={15} />}>
              Share
            </Button>
            <Link to={`/flashcard/${id}/study`}>
              <Button variant="mint" size="sm" icon={<Icon name="play" size={15} />}>
                Belajar
              </Button>
            </Link>
          </div>
        </div>

        {/* ======== Konten ======== */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Kiri: daftar kartu */}
          <div className="bg-surface rounded-3xl border-[1.5px] border-line shadow-[0_14px_40px_-20px_rgba(43,35,80,0.25)] p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-extrabold text-ink">
                Kartu <span className="text-ink-faint text-sm font-bold">({cards.length})</span>
              </h2>
              <Button size="sm" onClick={addNewCard} icon={<Icon name="plus" size={15} />}>
                Tambah Kartu
              </Button>
            </div>
            {cards.length > 1 && (
              <div className="relative mb-3">
                <Icon
                  name="search"
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={cardQuery}
                  onChange={(e) => setCardQuery(e.target.value)}
                  placeholder="Cari kartu…"
                  className="w-full bg-surface-2 border-[1.5px] border-line rounded-xl pl-9 pr-9 py-2 text-sm font-semibold placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 transition-all"
                />
                {cardQuery && (
                  <button
                    onClick={() => setCardQuery('')}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 tap p-1 rounded-md text-ink-faint hover:text-ink"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            )}

            {emptyCards ? (
              <EmptyState
                emoji="🃏"
                icon="cards"
                title="Belum ada kartu"
                desc="Tambahkan kartu pertanyaan-jawaban pertamamu. Setiap kartu bisa punya gambar juga!"
                action={
                  <Button variant="mint" onClick={addNewCard} icon={<Icon name="plus" size={16} />}>
                    Buat Kartu Pertama
                  </Button>
                }
              />
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-10 text-ink-faint font-bold">
                Tidak ada kartu cocok dengan "{cardQuery}".
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {filteredCards.map((c, i) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(c.id)}
                    onClick={() => {
                      setSelectedId(c.id)
                      setFlipped(false)
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-[1.5px] cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      selectedId === c.id
                        ? 'bg-brand-soft border-brand/40 shadow-[0_8px_20px_-10px_rgba(124,92,252,0.5)]'
                        : 'bg-surface border-line hover:border-brand/30 hover:bg-surface-2'
                    }`}
                  >
                    <Icon name="grip" size={17} className="text-ink-faint shrink-0" />
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                      style={{ backgroundColor: c.order_index === 0 ? '#7c5cfc' : deckColor(deck.color).bg }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-ink truncate">
                        {c.front_text || <span className="text-ink-faint italic">Kartu kosong…</span>}
                      </p>
                      <p className="text-xs text-ink-faint truncate">
                        {c.back_text || 'Belum ada jawaban'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          move(c.id, -1)
                        }}
                        disabled={realIndex(c.id) === 0}
                        aria-label="Naikkan"
                        className="tap p-1 rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                      >
                        <Icon name="chevron-down" size={13} className="rotate-180" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          move(c.id, 1)
                        }}
                        disabled={realIndex(c.id) === cards.length - 1}
                        aria-label="Turunkan"
                        className="tap p-1 rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink disabled:opacity-30"
                      >
                        <Icon name="chevron-down" size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                <p className="text-xs text-ink-faint text-center pt-1.5">
                  💡 Seret kartu untuk mengubah urutan
                </p>
              </div>
            )}
          </div>

          {/* Kanan: editor kartu terpilih */}
          <div className="space-y-4">
            {/* Preview flip */}
            <div className="h-64 sm:h-72">
              {selected ? (
                <FlipCard
                  front={selected.front_text}
                  back={selected.back_text}
                  imageUrl={selected.image_url}
                  flipped={flipped}
                  onFlip={() => setFlipped((v) => !v)}
                  color={color}
                />
              ) : (
                <div className="w-full h-full rounded-[28px] border-[2.5px] border-dashed border-line flex items-center justify-center text-ink-faint font-bold">
                  Pilih kartu untuk melihat preview
                </div>
              )}
            </div>

            {/* Form */}
            {selected ? (
              <div className="bg-surface rounded-3xl border-[1.5px] border-line shadow-[0_14px_40px_-20px_rgba(43,35,80,0.25)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-ink">Edit Kartu</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={duplicateCard}
                      className="tap px-3 py-1.5 rounded-xl text-xs font-extrabold text-brand-deep bg-brand-soft hover:bg-[#e3d9ff]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="copy" size={13} /> Duplikat
                      </span>
                    </button>
                    <button
                      onClick={() => setDeleting(selected)}
                      className="tap px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#d63a3a] bg-[#ffe9e9] hover:bg-[#ffdcdc]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="trash" size={13} /> Hapus
                      </span>
                    </button>
                  </div>
                </div>
                <label className="block">
                  <span className="block text-xs font-extrabold text-ink-soft mb-1.5 uppercase tracking-wide">
                    Sisi depan · Pertanyaan
                  </span>
                  <textarea
                    value={selected.front_text}
                    onChange={(e) => updateSelected({ front_text: sanitizeContent(e.target.value, { maxLength: 2000 }) })}
                    placeholder="mis. Apa fungsi klorofil?"
                    rows={3}
                    className="w-full bg-surface-2 border-[1.5px] border-line rounded-2xl px-4 py-3 text-[15px] font-semibold resize-none focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-extrabold text-ink-soft mb-1.5 uppercase tracking-wide">
                    Sisi belakang · Jawaban
                  </span>
                  <textarea
                    value={selected.back_text}
                    onChange={(e) => updateSelected({ back_text: sanitizeContent(e.target.value, { maxLength: 5000 }) })}
                    placeholder="mis. Menangkap cahaya matahari untuk fotosintesis"
                    rows={3}
                    className="w-full bg-surface-2 border-[1.5px] border-line rounded-2xl px-4 py-3 text-[15px] font-semibold resize-none focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-extrabold text-ink-soft mb-1.5 uppercase tracking-wide">
                    Gambar (opsional)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center text-ink-faint shrink-0">
                      <Icon name="image" size={18} />
                    </span>
                    <input
                      value={selected.image_url || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim()
                        // Hanya izinkan URL http(s) — tolak javascript:, data:, dll.
                        updateSelected({ image_url: val ? (isSafeUrl(val) ? val : '') : '' })
                      }}
                      placeholder="Tempel link gambar di sini…"
                      className="flex-1 bg-surface border-[1.5px] border-line rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 transition-all"
                    />
                  </div>
                </label>
                <div className="rounded-xl bg-brand-soft px-3.5 py-2.5 text-xs font-bold text-brand-deep flex gap-2">
                  <Icon name="zap" size={15} className="shrink-0 mt-0.5" />
                  Semua perubahan tersimpan otomatis. Klik kartu untuk membalik preview di atas.
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-[2.5px] border-dashed border-line p-8 text-center text-ink-faint font-bold">
                Pilih kartu dari daftar untuk mengeditnya
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Hapus kartu ini?"
        message="Kartu akan dihapus permanen dari deck ini."
        confirmLabel="Hapus"
        onConfirm={removeCard}
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset progres hafalan?"
        message="Semua progres SM-2 di deck ini akan dihapus. Kartu akan dianggap baru lagi dan muncul di sesi hafalan pintar berikutnya."
        confirmLabel="Ya, Reset"
        onConfirm={doResetProgress}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        type="deck"
        id={id}
        isPublic={deck.is_public}
        title={deck.title}
        onTogglePublic={async (val) => {
          const updated = await setDeckPublic(id, val)
          setDeck((d) => ({ ...d, is_public: val }))
          return updated
        }}
      />
    </PageTransition>
  )
}
