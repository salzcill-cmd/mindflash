import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
} from '@xyflow/react'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Icon } from '../components/Icons'
import FlipCard from '../components/FlipCard'
import Logo from '../components/ui/Logo'
import { nodeColor, deckColor, NODE_W, NODE_H } from '../lib/constants'
import { getPublicMindmap, getPublicDeck } from '../lib/storage'
import { toast } from '../store/toast'

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Link disalin! 📋')
  } catch {
    toast.error('Gagal menyalin link.')
  }
}

// ============================================================
// Halaman Share — publik, read-only, tanpa login
// ============================================================
export default function Share() {
  const { type, id } = useParams()

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-68px)] flex flex-col">
        <div className="border-b-[1.5px] border-line bg-surface/70 backdrop-blur px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e1faf5] text-[#0e9e92] text-xs font-extrabold border-[1.5px] border-mint/30">
            <Icon name="eye" size={13} /> Mode Baca Saja
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="white" onClick={copyUrl} icon={<Icon name="copy" size={14} />}>
              Salin Link
            </Button>
            <Link to="/dashboard">
              <Button size="sm" variant="white" icon={<Icon name="zap" size={14} />}>
                Buat Punyamu
              </Button>
            </Link>
            <Logo size={26} className="hidden sm:inline-flex" />
          </div>
        </div>
        <div className="flex-1">
          {type === 'mindmap' ? <PublicMindmap id={id} /> : <PublicDeck id={id} />}
        </div>
        <div className="text-center py-5 text-xs font-bold text-ink-faint">
          Dibagikan lewat <span className="text-brand">MindFlash</span> · Dibuat dengan 💜 untuk
          pelajar
        </div>
      </div>
    </PageTransition>
  )
}

// ============================================================
// Not found / link nonaktif
// ============================================================
function NotFound({ type }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-extrabold mb-2">
        {type === 'off' ? 'Link share dimatikan' : 'Tidak ditemukan'}
      </h1>
      <p className="text-ink-soft max-w-sm mb-6">
        {type === 'off'
          ? 'Pemilik mematikan link ini. Minta link baru dari mereka ya.'
          : 'Link tidak valid atau item-nya sudah dihapus.'}
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={<Icon name="zap" size={16} />}>
          Mulai Belajar Sendiri
        </Button>
      </Link>
    </div>
  )
}

// ============================================================
// Mindmap publik
// ============================================================
function ReadonlyNode({ data }) {
  const color = nodeColor(data.color)
  return (
    <div
      className="rounded-2xl border-[2.5px] px-3.5 py-2.5"
      style={{
        width: NODE_W,
        height: NODE_H,
        backgroundColor: color.bg,
        borderColor: color.border,
        boxShadow: '0 10px 24px -14px rgba(43,35,80,0.35)',
      }}
    >
      <Handle type="target" position={Position.Left} className="hidden!" />
      <Handle type="source" position={Position.Right} className="hidden!" />
      <div className="flex items-start gap-2.5 h-full">
        {data.icon && <span className="text-2xl leading-none mt-0.5">{data.icon}</span>}
        <span
          className="font-extrabold text-[13.5px] leading-snug line-clamp-3 break-words"
          style={{ color: color.text }}
        >
          {data.label || ''}
        </span>
      </div>
    </div>
  )
}

const readonlyNodeTypes = { readonly: ReadonlyNode }

function PublicMindmap({ id }) {
  const [mindmap, setMindmap] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ok | missing | off

  useEffect(() => {
    let alive = true
    getPublicMindmap(id)
      .then((m) => {
        if (!alive) return
        if (!m) {
          setStatus('missing')
          return
        }
        setMindmap(m)
        setStatus('ok')
      })
      .catch(() => alive && setStatus('missing'))
    return () => {
      alive = false
    }
  }, [id])

  const nodes = useMemo(
    () =>
      (mindmap?.data?.nodes ?? []).map((n) => ({
        ...n,
        type: 'readonly',
        draggable: false,
        selectable: false,
        connectable: false,
      })),
    [mindmap],
  )
  const edges = useMemo(() => {
    const et = mindmap?.data?.edgeType
    return (mindmap?.data?.edges ?? []).map((e) => ({
      ...e,
      type: et === 'straight' ? 'straight' : undefined,
      selectable: false,
      focusable: false,
    }))
  }, [mindmap])

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="skeleton h-10 rounded-2xl w-64 mb-5" />
        <div className="skeleton h-[420px] rounded-[28px]" />
      </div>
    )
  }
  if (status !== 'ok' || !mindmap) return <NotFound />

  return (
    <div className="h-[calc(100vh-200px)]">
      <div className="px-4 sm:px-6 pt-5 pb-3 flex items-center gap-3">
        <h1 className="font-extrabold text-xl sm:text-2xl truncate">{mindmap.title}</h1>
        <span className="shrink-0 px-3 py-1 rounded-full bg-brand-soft text-brand-deep text-xs font-extrabold">
          {mindmap.mode === 'auto-layout' ? 'Auto-Layout' : 'Freeform'} · {(mindmap.data?.nodes ?? []).length} node
        </span>
      </div>
      <ReactFlowProvider>
        <div className="w-full h-full rounded-t-[28px] overflow-hidden border-[1.5px] border-line">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={readonlyNodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.2}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant="dots" gap={24} size={1.6} color="#d9cff2" />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  )
}

// ============================================================
// Deck publik
// ============================================================
function PublicDeck({ id }) {
  const [deck, setDeck] = useState(null)
  const [status, setStatus] = useState('loading')
  const [flippedMap, setFlippedMap] = useState({})
  const [viewing, setViewing] = useState(null) // index kartu saat mode mainkan

  useEffect(() => {
    let alive = true
    getPublicDeck(id)
      .then((d) => {
        if (!alive) return
        if (!d) {
          setStatus('missing')
          return
        }
        setDeck(d)
        setStatus('ok')
      })
      .catch(() => alive && setStatus('missing'))
    return () => {
      alive = false
    }
  }, [id])

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="skeleton h-10 rounded-2xl w-64 mb-5" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="skeleton h-64 rounded-[28px]" />
          <div className="skeleton h-64 rounded-[28px]" />
        </div>
      </div>
    )
  }
  if (status !== 'ok' || !deck) return <NotFound />

  const color = deckColor(deck.color)
  const cards = deck.cards ?? []

  // Mode mainkan (flip-through sederhana, tanpa simpan progres)
  if (viewing !== null) {
    const card = cards[viewing]
    return (
      <div className="max-w-xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewing(null)}
            className="tap px-3.5 py-2 rounded-xl bg-surface border-[1.5px] border-line text-sm font-extrabold text-ink-soft hover:text-ink flex items-center gap-1.5"
          >
            <Icon name="grid" size={15} /> Semua Kartu
          </button>
          <span className="text-sm font-extrabold text-ink-faint">
            {viewing + 1} / {cards.length}
          </span>
        </div>
        <div className="h-[380px]">
          <FlipCard
            front={card.front_text}
            back={card.back_text}
            imageUrl={card.image_url}
            flipped={flippedMap[card.id]}
            onFlip={() => setFlippedMap((m) => ({ ...m, [card.id]: !m[card.id] }))}
            color={color}
          />
        </div>
        <div className="flex justify-center gap-3 mt-5">
          <Button
            variant="white"
            size="lg"
            disabled={viewing === 0}
            onClick={() => {
              setViewing((v) => v - 1)
              setFlippedMap((m) => ({ ...m, [cards[viewing]?.id]: false }))
            }}
            icon={<Icon name="chevron-left" size={18} />}
          >
            Sebelumnya
          </Button>
          <Button
            variant="primary"
            size="lg"
            disabled={viewing === cards.length - 1}
            onClick={() => {
              setViewing((v) => v + 1)
              setFlippedMap((m) => ({ ...m, [cards[viewing]?.id]: false }))
            }}
            icon={<Icon name="chevron-right" size={18} />}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-14">
      <div className="flex flex-wrap items-center gap-3 mb-7">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
          style={{ backgroundColor: color.bg }}
        >
          <Icon name="cards" size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="font-extrabold text-xl sm:text-2xl truncate">{deck.title}</h1>
          <p className="text-xs font-bold text-ink-faint">{cards.length} kartu</p>
        </div>
        {cards.length > 0 && (
          <Button
            className="ml-auto"
            variant="pink"
            size="sm"
            onClick={() => {
              setViewing(0)
              setFlippedMap({})
            }}
            icon={<Icon name="play" size={15} />}
          >
            Mainkan
          </Button>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16 text-ink-faint font-bold">Deck ini belum berisi kartu.</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className="h-60"
            >
              <FlipCard
                front={c.front_text}
                back={c.back_text}
                imageUrl={c.image_url}
                flipped={flippedMap[c.id]}
                onFlip={() => setFlippedMap((m) => ({ ...m, [c.id]: !m[c.id] }))}
                color={color}
                rounded="rounded-3xl"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
