import { useCallback, useContext, useEffect, useMemo, useRef, useState, createContext } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ConnectionLineType,
} from '@xyflow/react'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Icon } from '../components/Icons'
import ShareModal from '../components/ShareModal'
import { toast } from '../store/toast'
import { NODE_COLORS, NODE_ICONS, NODE_W, NODE_H, AUTO_SAVE_DELAY, nodeColor } from '../lib/constants'
import { sanitizeText } from '../lib/sanitize'
import { computeAutoLayout } from '../lib/layout'
import { exportFlowAsPng, downloadDataUrl } from '../lib/exportPng'
import { getMindmap, updateMindmap, setMindmapPublic, createDeck, addCard } from '../lib/storage'

const EditorCtx = createContext(null)
const useEditor = () => useContext(EditorCtx)

// ============================================================
// Node custom MindFlash
// ============================================================
function MindNode({ id, data, selected }) {
  const { mode, direction, addChild } = useEditor()
  const color = nodeColor(data.color)
  const isDown = mode === 'auto-layout' && direction === 'down'

  return (
    <div
      className="group relative rounded-2xl border-[2.5px] px-3.5 py-2.5 transition-all duration-200"
      style={{
        width: NODE_W,
        height: NODE_H,
        backgroundColor: color.bg,
        borderColor: color.border,
        boxShadow: selected
          ? `0 0 0 4px ${color.border}38, 0 14px 30px -12px ${color.border}66`
          : '0 10px 24px -14px rgba(43,35,80,0.35)',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* Handle target (koneksi masuk) */}
      <Handle
        type="target"
        position={isDown ? Position.Top : Position.Left}
        className="w-3! h-3!"
      />
      {/* Handle source (koneksi keluar) */}
      <Handle
        type="source"
        position={isDown ? Position.Bottom : Position.Right}
        className="w-3! h-3!"
      />

      <div className="flex items-start gap-2.5 h-full">
        {data.icon && <span className="text-2xl leading-none mt-0.5">{data.icon}</span>}
        <span
          className="font-extrabold text-[13.5px] leading-snug line-clamp-3 break-words"
          style={{ color: color.text }}
        >
          {data.label || 'Ketik judul…'}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          addChild(id)
        }}
        aria-label="Tambah cabang"
        className="tap absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-white border-[2px] border-brand text-brand flex items-center justify-center shadow-[0_6px_14px_-4px_rgba(124,92,252,0.6)] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Icon name="plus" size={14} strokeWidth={3} />
      </button>
    </div>
  )
}

const nodeTypes = { mind: MindNode }

const SHORTCUTS = [
  { label: 'Undo', keys: ['Ctrl', 'Z'] },
  { label: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
  { label: 'Hapus node / garis terpilih', keys: ['Del'] },
  { label: 'Edit label (double-klik node)', keys: ['2× Klik'] },
  { label: 'Tambah cabang', keys: ['+'] },
  { label: 'Zoom / geser kanvas', keys: ['Scroll'] },
]

// ============================================================
// Editor (di dalam ReactFlowProvider)
// ============================================================
function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const rf = useReactFlow()

  const [mindmap, setMindmap] = useState(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [mode, setMode] = useState('freeform')
  const [direction, setDirection] = useState('down')
  const [edgeType, setEdgeTypeState] = useState('bezier')
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error
  const [loaded, setLoaded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const loadedRef = useRef(false)
  const stateRef = useRef({ nodes: [], edges: [] })
  const historyRef = useRef({ stack: [], index: -1 })
  const saveTimer = useRef(null)
  const labelInputRef = useRef(null)

  useEffect(() => {
    stateRef.current = { nodes, edges }
  }, [nodes, edges])

  // ---------- Load ----------
  useEffect(() => {
    let alive = true
    getMindmap(id)
      .then((mm) => {
        if (!alive) return
        if (!mm) {
          toast.error('Mindmap tidak ditemukan.')
          navigate('/dashboard')
          return
        }
        setMindmap(mm)
        setMode(mm.mode || 'freeform')
        setDirection(mm.data?.direction || 'down')
        setEdgeTypeState(mm.data?.edgeType || 'bezier')
        const d = mm.data
        if (d?.nodes?.length) {
          setNodes(d.nodes)
          setEdges(d.edges ?? [])
        } else {
          const root = {
            id: crypto.randomUUID(),
            type: 'mind',
            position: { x: 0, y: 0 },
            data: { label: 'Ide Utama', color: 'violet', icon: '💡' },
          }
          setNodes([root])
          setEdges([])
        }
        loadedRef.current = true
        setLoaded(true)
        setTimeout(() => {
          rf.fitView({ padding: 0.3, duration: 500 })
        }, 80)
      })
      .catch((e) => {
        toast.error(e.message)
        navigate('/dashboard')
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ---------- Undo / Redo ----------
  const recordBefore = useCallback(() => {
    const { stack, index } = historyRef.current
    const snapshot = {
      nodes: stateRef.current.nodes.map((n) => JSON.parse(JSON.stringify(n))),
      edges: stateRef.current.edges.map((e) => JSON.parse(JSON.stringify(e))),
    }
    const next = stack.slice(0, index + 1)
    next.push(snapshot)
    if (next.length > 80) next.shift()
    historyRef.current = { stack: next, index: next.length - 1 }
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const { stack, index } = historyRef.current
    if (index < 0) return
    const target = stack[index]
    historyRef.current = { stack, index: index - 1 }
    setNodes(target.nodes)
    setEdges(target.edges)
    setCanUndo(index - 1 >= 0)
    setCanRedo(true)
  }, [])

  const redo = useCallback(() => {
    const { stack, index } = historyRef.current
    if (index + 1 >= stack.length) return
    const target = stack[index + 1]
    historyRef.current = { stack, index: index + 1 }
    setNodes(target.nodes)
    setEdges(target.edges)
    setCanUndo(true)
    setCanRedo(index + 1 < stack.length - 1)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        const selectedNodes = nodes.filter((n) => n.selected)
        const selectedEdges = edges.filter((e) => e.selected)
        if (selectedNodes.length || selectedEdges.length) {
          recordBefore()
          setNodes((prev) => prev.filter((n) => !n.selected))
          setEdges((prev) => prev.filter((e) => !e.selected))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nodes, edges, undo, redo, recordBefore])

  // ---------- React Flow handlers ----------
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )
  const onConnect = useCallback(
    (conn) => {
      recordBefore()
      setEdges((eds) =>
        addEdge({ ...conn, type: edgeType === 'straight' ? 'straight' : undefined }, eds),
      )
    },
    [edgeType, recordBefore],
  )
  const onNodeDragStart = useCallback(() => {
    if (mode === 'auto-layout') return
    recordBefore()
  }, [mode, recordBefore])

  // Double-klik node → langsung edit label di panel
  const onNodeDoubleClick = useCallback((_, node) => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === node.id })))
    setTimeout(() => labelInputRef.current?.focus(), 140)
  }, [])

  // ---------- Auto-layout: susun otomatis saat struktur berubah ----------
  const structureSig = useMemo(
    () =>
      JSON.stringify([
        nodes.map((n) => [n.id, n.data?.label, n.data?.color, n.data?.icon]),
        edges.map((e) => [e.source, e.target]),
      ]),
    [nodes, edges],
  )

  useEffect(() => {
    if (mode !== 'auto-layout' || !loadedRef.current) return
    const t = setTimeout(() => {
      setNodes((prev) => computeAutoLayout(prev, edges, direction))
    }, 140)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureSig, mode, direction])

  // ---------- Auto-save (debounce 2 detik) ----------
  useEffect(() => {
    if (!loadedRef.current || !mindmap) return
    setSaveStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await updateMindmap(id, {
          title: mindmap.title,
          mode,
          data: { nodes, edges, edgeType, direction },
        })
        setSaveStatus('saved')
      } catch (e) {
        setSaveStatus('error')
        console.error('auto-save gagal:', e)
      }
    }, AUTO_SAVE_DELAY)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, mode, direction, edgeType, mindmap?.title])

  // ---------- Aksi ----------
  const addChild = useCallback(
    (parentId) => {
      recordBefore()
      const parent = stateRef.current.nodes.find((n) => n.id === parentId)
      const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].id
      const icon = NODE_ICONS[Math.floor(Math.random() * 6) + 1]
      const pos = parent
        ? { x: parent.position.x + NODE_W + 70, y: parent.position.y + Math.random() * 40 }
        : { x: 0, y: 0 }
      const child = {
        id: crypto.randomUUID(),
        type: 'mind',
        position: pos,
        data: { label: 'Cabang baru', color, icon },
      }
      setNodes((prev) => [...prev, child])
      setEdges((prev) =>
        parent
          ? [...prev, { id: crypto.randomUUID(), source: parentId, target: child.id, type: edgeType === 'straight' ? 'straight' : undefined }]
          : prev,
      )
      if (mode === 'auto-layout') {
        setTimeout(() => setNodes((prev) => computeAutoLayout(prev, stateRef.current.edges, direction)), 160)
      }
    },
    [recordBefore, edgeType, mode, direction],
  )

  const addFreeNode = useCallback(() => {
    recordBefore()
    const vp = rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const node = {
      id: crypto.randomUUID(),
      type: 'mind',
      position: {
        x: vp.x + Math.round((Math.random() - 0.5) * 120),
        y: vp.y + Math.round((Math.random() - 0.5) * 120),
      },
      data: {
        label: 'Ide baru',
        color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].id,
        icon: NODE_ICONS[Math.floor(Math.random() * NODE_ICONS.length)],
      },
    }
    setNodes((prev) => [...prev, node])
  }, [rf, recordBefore])

  const duplicateSelected = useCallback(() => {
    const selectedNodes = stateRef.current.nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return
    recordBefore()
    const idMap = {}
    selectedNodes.forEach((n) => {
      idMap[n.id] = crypto.randomUUID()
    })
    const newNodes = selectedNodes.map((n) => ({
      ...JSON.parse(JSON.stringify(n)),
      id: idMap[n.id],
      selected: true,
      position: { x: n.position.x + 44, y: n.position.y + 44 },
    }))
    const selIds = new Set(selectedNodes.map((n) => n.id))
    const newEdges = stateRef.current.edges
      .filter((e) => selIds.has(e.source) && selIds.has(e.target))
      .map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        source: idMap[e.source],
        target: idMap[e.target],
      }))
    setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), ...newNodes])
    setEdges((prev) => [...prev, ...newEdges])
  }, [recordBefore])

  const deleteSelected = useCallback(() => {
    const hasSel = nodes.some((n) => n.selected) || edges.some((e) => e.selected)
    if (!hasSel) return
    recordBefore()
    setNodes((prev) => prev.filter((n) => !n.selected))
    setEdges((prev) => prev.filter((e) => !e.selected))
  }, [nodes, edges, recordBefore])

  const changeEdgeType = useCallback(
    (t) => {
      recordBefore()
      setEdgeTypeState(t)
      setEdges((prev) => prev.map((e) => ({ ...e, type: t === 'straight' ? 'straight' : undefined })))
    },
    [recordBefore],
  )

  const switchMode = useCallback(
    (m) => {
      if (m === mode) return
      recordBefore()
      setMode(m)
      if (m === 'auto-layout') {
        setTimeout(() => {
          setNodes((prev) => computeAutoLayout(prev, stateRef.current.edges, direction))
          setTimeout(() => rf.fitView({ padding: 0.3, duration: 500 }), 60)
        }, 60)
      }
    },
    [mode, direction, recordBefore, rf],
  )

  const updateSelectedNode = useCallback((patch) => {
    setNodes((prev) => prev.map((n) => (n.selected ? { ...n, data: { ...n.data, ...patch } } : n)))
  }, [])

  // ---------- Konversi mindmap → flashcard (1-klik) ----------
  const convertToDeck = async () => {
    try {
      const pairs = edges
        .map((e) => {
          const parent = stateRef.current.nodes.find((n) => n.id === e.source)
          const child = stateRef.current.nodes.find((n) => n.id === e.target)
          return { parent, child }
        })
        .filter((p) => p.parent && p.child)
      if (pairs.length === 0) {
        toast.info('Mindmap belum punya cabang untuk dijadikan kartu.')
        return
      }
      const deck = await createDeck({ title: `${mindmap.title} · Kartu` })
      for (const { parent, child } of pairs) {
        await addCard(deck.id, {
          front_text: child.data?.label || '…',
          back_text: parent.data?.label || '…',
        })
      }
      toast.success(`${pairs.length} kartu berhasil dibuat! 🎉`)
      navigate(`/flashcard/${deck.id}`)
    } catch (e) {
      toast.error(e.message || 'Gagal membuat kartu.')
    }
  }

  const exportPng = async () => {
    try {
      const dataUrl = await exportFlowAsPng(rf, nodes)
      downloadDataUrl(dataUrl, `${mindmap.title.replace(/\s+/g, '-').toLowerCase() || 'mindmap'}.png`)
      toast.success('Mindmap berhasil diexport! 📸')
    } catch (e) {
      toast.error(e.message || 'Gagal export PNG.')
    }
  }

  const selectedNode = nodes.find((n) => n.selected)
  const selectedEdge = edges.find((e) => e.selected)

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton h-64 w-full max-w-2xl rounded-3xl" />
      </div>
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
    <EditorCtx.Provider value={{ mode, direction, addChild }}>
      <div className="relative h-[calc(100vh-68px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeDoubleClick={onNodeDoubleClick}
          nodesDraggable={mode !== 'auto-layout'}
          nodesConnectable
          connectionLineType={edgeType === 'straight' ? ConnectionLineType.Straight : ConnectionLineType.Bezier}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.8}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: false }}
        >
          <Background variant="dots" gap={24} size={1.6} color="#d9cff2" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) => nodeColor(n.data?.color).border}
            maskColor="rgba(43,35,80,0.08)"
            className="hidden! sm:block!"
          />
        </ReactFlow>

        {/* ======== Toolbar atas ======== */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 z-20">
          {/* Kiri: kembali + judul */}
          <div className="flex items-center gap-2 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_10px_26px_-14px_rgba(43,35,80,0.35)] pl-1.5 pr-3 py-1.5 min-w-0">
            <Link to="/dashboard" aria-label="Kembali ke dashboard" className="tap p-2 rounded-xl text-ink-soft hover:bg-surface-2 hover:text-ink">
              <Icon name="arrow-left" size={18} />
            </Link>
            <input
              value={mindmap.title}
              onChange={(e) => {
                const safe = sanitizeText(e.target.value, { maxLength: 80 })
                setMindmap((m) => ({ ...m, title: safe }))
              }}
              className="bg-transparent font-extrabold text-ink text-[15px] w-28 sm:w-44 outline-none focus:ring-2 focus:ring-brand/30 rounded-lg px-1.5 py-0.5"
              aria-label="Judul mindmap"
            />
            <span className="hidden sm:block text-xs font-bold text-ink-faint whitespace-nowrap">{saveLabel}</span>
          </div>

          {/* Tengah: mode & tools */}
          <div className="flex items-center gap-1.5 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_10px_26px_-14px_rgba(43,35,80,0.35)] p-1.5">
            <div className="flex p-0.5 rounded-xl bg-surface-2">
              <button
                onClick={() => switchMode('freeform')}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-extrabold transition-all ${mode === 'freeform' ? 'bg-surface shadow text-ink' : 'text-ink-faint'}`}
              >
                Freeform
              </button>
              <button
                onClick={() => switchMode('auto-layout')}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-extrabold transition-all ${mode === 'auto-layout' ? 'bg-surface shadow text-ink' : 'text-ink-faint'}`}
              >
                Auto-Layout
              </button>
            </div>
            <span className="w-[1.5px] h-6 bg-line mx-0.5" />
            <ToolBtn onClick={undo} disabled={!canUndo} label="Undo (Ctrl+Z)" icon="undo" />
            <ToolBtn onClick={redo} disabled={!canRedo} label="Redo (Ctrl+Shift+Z)" icon="redo" />
            <ToolBtn
              onClick={() => changeEdgeType(edgeType === 'bezier' ? 'straight' : 'bezier')}
              active={edgeType === 'straight'}
              label={edgeType === 'bezier' ? 'Garis lengkung' : 'Garis lurus'}
              icon={edgeType === 'bezier' ? 'mindmap' : 'arrow-right'}
            />
            {mode === 'auto-layout' && (
              <>
                <span className="w-[1.5px] h-6 bg-line mx-0.5" />
                <ToolBtn onClick={() => setDirection('down')} active={direction === 'down'} label="Susun ke bawah" icon="chevron-down" />
                <ToolBtn onClick={() => setDirection('right')} active={direction === 'right'} label="Susun ke kanan" icon="chevron-right" />
              </>
            )}
            <span className="hidden sm:flex items-center gap-1.5 px-2 text-xs font-extrabold text-ink-faint whitespace-nowrap">
              <Icon name="mindmap" size={15} className="text-brand" />
              {nodes.length} node · {edges.length} garis
            </span>
            <span className="w-[1.5px] h-6 bg-line mx-0.5" />
            <ToolBtn onClick={() => setHelpOpen(true)} label="Pintasan keyboard" icon="book" />
          </div>

          {/* Kanan: aksi */}
          <div className="ml-auto flex items-center gap-1.5 bg-surface rounded-2xl border-[1.5px] border-line shadow-[0_10px_26px_-14px_rgba(43,35,80,0.35)] p-1.5">
            <ToolBtn onClick={() => rf.fitView({ padding: 0.3, duration: 500 })} label="Sesuaikan tampilan (fit view)" icon="target" />
            <ToolBtn onClick={addFreeNode} label="Tambah node (di tengah layar)" icon="plus" accent />
            <ToolBtn onClick={duplicateSelected} disabled={!selectedNode} label="Duplikat node terpilih" icon="copy" />
            <ToolBtn onClick={deleteSelected} disabled={!selectedNode && !selectedEdge} label="Hapus yang dipilih" icon="trash" danger />
            <span className="w-[1.5px] h-6 bg-line mx-0.5" />
            <ToolBtn onClick={convertToDeck} label="Ubah jadi flashcard" icon="cards" accent />
            <ToolBtn onClick={exportPng} label="Export PNG" icon="download" />
            <ToolBtn onClick={() => setShareOpen(true)} label="Share" icon="share" accent />
            <span className="sm:hidden text-xs font-bold text-ink-faint px-1">{saveLabel}</span>
          </div>

          {/* Aksi terang: konversi ke flashcard */}
          <div className="w-full sm:w-auto">
            <Button
              variant="mint"
              size="sm"
              onClick={convertToDeck}
              icon={<Icon name="cards" size={15} />}
              title="Ubah mindmap ini jadi deck flashcard"
            >
              Jadikan Flashcard
            </Button>
          </div>
        </div>

        {/* ======== Panel edit node ======== */}
        {selectedNode && (
          <div className="absolute z-30 inset-x-3 bottom-3 md:inset-x-auto md:right-3 md:top-[76px] md:bottom-auto md:w-72 max-h-[46%] md:max-h-none overflow-y-auto bg-surface/95 backdrop-blur rounded-3xl border-[1.5px] border-line shadow-[0_24px_60px_-20px_rgba(43,35,80,0.4)] p-4 animate-pop">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-[15px] text-ink">Edit Node</h3>
              <button
                onClick={() =>
                  setNodes((prev) => prev.map((n) => ({ ...n, selected: false })))
                }
                className="tap p-1.5 rounded-lg text-ink-faint hover:bg-surface-2"
                aria-label="Tutup panel"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
            <input
              ref={labelInputRef}
              value={selectedNode.data.label}
              onChange={(e) => updateSelectedNode({ label: sanitizeText(e.target.value, { maxLength: 60 }) })}
              onFocus={recordBefore}
              placeholder="Teks node…"
              className="w-full bg-surface-2 border-[1.5px] border-line rounded-xl px-3.5 py-2.5 text-sm font-extrabold focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 mb-4"
            />
            <p className="text-xs font-extrabold text-ink-soft mb-2">Warna</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {NODE_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    recordBefore()
                    updateSelectedNode({ color: c.id })
                  }}
                  aria-label={c.name}
                  className="tap w-8 h-8 rounded-xl border-[2.5px] transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.bg,
                    borderColor: selectedNode.data.color === c.id ? c.border : c.bg,
                    boxShadow:
                      selectedNode.data.color === c.id ? `0 0 0 2.5px ${c.border}55` : undefined,
                  }}
                />
              ))}
            </div>
            <p className="text-xs font-extrabold text-ink-soft mb-2">Ikon</p>
            <div className="grid grid-cols-6 gap-1.5">
              {NODE_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => {
                    recordBefore()
                    updateSelectedNode({ icon: ic })
                  }}
                  className={`tap text-xl h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:bg-surface-2 ${
                    selectedNode.data.icon === ic ? 'bg-brand-soft ring-2 ring-brand/40' : ''
                  }`}
                  aria-label={`Ikon ${ic}`}
                >
                  {ic}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#fff6d9] dark:bg-[#3b3160] px-3.5 py-2.5 text-xs font-bold text-[#a06a00] dark:text-[#e8c37a]">
              💡 Tekan <kbd className="px-1.5 py-0.5 bg-surface rounded-md border border-[#e8d9a8]">Del</kbd>{' '}
              untuk menghapus node/garis yang dipilih.
            </div>
          </div>
        )}

        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          type="mindmap"
          id={id}
          isPublic={mindmap.is_public}
          title={mindmap.title}
          onTogglePublic={async (val) => {
            const updated = await setMindmapPublic(id, val)
            setMindmap((m) => ({ ...m, is_public: val }))
            return updated
          }}
        />

        {/* Pintasan keyboard */}
        <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Pintasan & Tips">
          <ul className="space-y-2.5">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-ink-soft">{s.label}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-2 py-1 bg-surface-2 rounded-lg border-[1.5px] border-line font-extrabold text-xs text-ink"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-xs text-brand-deep font-bold flex gap-2">
            <Icon name="spark" size={16} className="shrink-0 mt-0.5" />
            <span>
              Tips: pilih beberapa node dengan menahan <b>Shift</b> sambil mengklik, lalu
              duplikat sekaligus.
            </span>
          </div>
        </Modal>
      </div>
    </EditorCtx.Provider>
  )
}

function ToolBtn({ onClick, icon, label, disabled, active, accent, danger }) {
  const color = danger
    ? 'text-[#d63a3a] hover:bg-[#ffe9e9]'
    : accent
      ? 'text-brand hover:bg-brand-soft'
      : 'text-ink-soft hover:bg-surface-2'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`tap p-2 rounded-xl transition-all ${color} ${active ? 'bg-brand-soft! text-brand-deep! ring-2 ring-brand/30' : ''} disabled:opacity-35 disabled:pointer-events-none`}
    >
      <Icon name={icon} size={17} />
    </button>
  )
}

export default function MindmapEditor() {
  return (
    <PageTransition className="h-[calc(100vh-68px)]">
      <ReactFlowProvider>
        <Editor />
      </ReactFlowProvider>
    </PageTransition>
  )
}
