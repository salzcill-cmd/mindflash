import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Icon } from '../components/Icons'
import FlipCard from '../components/FlipCard'
import EmptyState from '../components/ui/EmptyState'
import Confetti from '../components/Confetti'
import { toast } from '../store/toast'
import { deckColor } from '../lib/constants'
import { gradeCard, isDue, masteryLevel, MASTERY_LABELS } from '../lib/sm2'
import { getStreak, registerStudy } from '../lib/streak'
import { getDeck, getProgressForCards, saveProgress } from '../lib/storage'
import { shuffleArr, buildOptions, checkTypedAnswer } from '../lib/quiz'

export default function Study() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState('sr') // 'simple' | 'sr'
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [progressMap, setProgressMap] = useState({})
  const [finished, setFinished] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [streak, setStreak] = useState(getStreak)
  const [busy, setBusy] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [quiz, setQuiz] = useState({}) // { [cardId]: { selected, answered } }
  const [quizScore, setQuizScore] = useState(0)
  const [quizOptions, setQuizOptions] = useState({}) // { [cardId]: [opsi] }
  const [missedIds, setMissedIds] = useState([]) // kartu yang dijawab salah / "Belum Hafal"
  const [showList, setShowList] = useState(false) // daftar kartu (overview)
  const [typedValue, setTypedValue] = useState('')
  const [typedResult, setTypedResult] = useState(null) // null | 'correct' | 'wrong'

  // ---------- Load ----------
  useEffect(() => {
    let alive = true
    getDeck(id)
      .then(async (d) => {
        if (!alive) return
        if (!d) {
          toast.error('Deck tidak ditemukan.')
          navigate('/dashboard')
          return
        }
        setDeck(d)
        setCards(d.cards ?? [])
        const progress = await getProgressForCards((d.cards ?? []).map((c) => c.id))
        if (!alive) return
        setProgressMap(progress)
        setLoaded(true)
      })
      .catch((e) => {
        toast.error(e.message)
        navigate('/dashboard')
      })
    return () => {
      alive = false
    }
  }, [id, navigate])

  // Queue: mode sr → kartu due; simple → semua kartu
  const dueQueue = useMemo(() => cards.filter((c) => isDue(progressMap[c.id])).map((c) => c.id), [cards, progressMap])
  const allQueue = useMemo(() => cards.map((c) => c.id), [cards])

  const start = (m, forceAll = false) => {
    setMode(m)
    const base = m === 'sr' && !forceAll ? dueQueue : allQueue
    setQueue(shuffle ? shuffleArr(base) : base)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
    setSessionCount(0)
    setQuiz({})
    setQuizScore(0)
    setMissedIds([])
    setTypedValue('')
    setTypedResult(null)
    if (m === 'quiz') {
      const opts = {}
      cards.forEach((c) => {
        opts[c.id] = buildOptions(c, cards)
      })
      setQuizOptions(opts)
    }
  }

  const startAt = (index) => {
    setShowList(false)
    setMode('simple')
    setQueue(cards.map((c) => c.id))
    setIndex(index)
    setFlipped(false)
    setFinished(false)
    setSessionCount(0)
    setQuiz({})
    setQuizScore(0)
    setMissedIds([])
    setTypedValue('')
    setTypedResult(null)
  }

  const replayMissed = () => {
    const ids = [...missedIds]
    if (ids.length === 0) return
    setMode('sr')
    setQueue(ids)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
    setSessionCount(0)
    setQuiz({})
    setQuizScore(0)
    setMissedIds([])
    setTypedValue('')
    setTypedResult(null)
    toast.info(`${ids.length} kartu belum hafal — ayo ulangi sampai lancar! 💪`)
  }

  const finish = () => {
    registerStudy()
    setStreak(getStreak())
    setFinished(true)
  }

  // Simpan hasil penilaian ke jadwal SM-2 (dipakai mode SR, Kuis, dan Ketik)
  const applyGrade = async (cardId, grade) => {
    const prev = progressMap[cardId]
    const next = gradeCard(grade, prev)
    setProgressMap((m) => ({ ...m, [cardId]: next }))
    try {
      await saveProgress(cardId, next)
    } catch (e) {
      toast.error(e.message)
    }
    if (grade === 0) {
      setMissedIds((ids) => (ids.includes(cardId) ? ids : [...ids, cardId]))
    }
  }

  const rate = async (grade) => {
    if (busy) return
    setBusy(true)
    const cardId = queue[index]
    await applyGrade(cardId, grade)
    setSessionCount((c) => c + 1)
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1)
      setFlipped(false)
    } else {
      finish()
    }
    setBusy(false)
  }

  const answerQuiz = (opt) => {
    if (!current || quiz[current.id]?.answered) return
    const isCorrect = opt === (current.back_text || '…')
    setQuiz((q) => ({ ...q, [current.id]: { selected: opt, answered: true } }))
    if (isCorrect) setQuizScore((s) => s + 1)
    setSessionCount((c) => c + 1)
    // Jawaban kuis ikut menjadwalkan review hafalan pintar
    applyGrade(current.id, isCorrect ? 2 : 0)
  }

  const submitTyped = () => {
    if (!current || typedResult || !typedValue.trim()) return
    const isCorrect = checkTypedAnswer(typedValue, current.back_text || '')
    setTypedResult(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) setQuizScore((s) => s + 1)
    setSessionCount((c) => c + 1)
    applyGrade(current.id, isCorrect ? 2 : 0)
  }

  const nextCard = () => {
    setTypedValue('')
    setTypedResult(null)
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1)
      setFlipped(false)
    } else {
      finish()
    }
  }

  // Keyboard: spasi = flip, panah = navigasi, angka = rating (SR)
  useEffect(() => {
    if (finished || queue.length === 0) return
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (mode === 'quiz' || mode === 'typed') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((v) => !v)
      } else if (e.key === 'ArrowRight' && mode === 'simple' && index < queue.length - 1) {
        setIndex((i) => i + 1)
        setFlipped(false)
      } else if (e.key === 'ArrowLeft' && mode === 'simple' && index > 0) {
        setIndex((i) => i - 1)
        setFlipped(false)
      } else if (mode === 'sr' && flipped && !busy) {
        // Angka 1/2/3 = rating cepat saat kartu terbuka
        if (e.key === '1') rate(0)
        else if (e.key === '2') rate(1)
        else if (e.key === '3') rate(2)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, queue, index, mode, flipped, busy])

  // Swipe gesture (mobile): geser kartu kiri/kanan
  const touchRef = useRef({ x: 0, y: 0 })
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (finished || queue.length === 0) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchRef.current.x
    const dy = t.clientY - touchRef.current.y
    // Hanya trigger kalau horizontal swipe lebih dominan dari vertikal
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (mode === 'quiz' || mode === 'typed') return
    if (mode === 'simple') {
      if (dx < 0 && index < queue.length - 1) {
        setIndex((i) => i + 1)
        setFlipped(false)
      } else if (dx > 0 && index > 0) {
        setIndex((i) => i - 1)
        setFlipped(false)
      }
    } else if (mode === 'sr') {
      // Swipe left pada SR = flip kartu; swipe right = kembali
      if (dx < 0 && !flipped) {
        setFlipped(true)
      } else if (dx > 0 && flipped && !busy && index > 0) {
        setIndex((i) => i - 1)
        setFlipped(false)
      }
    }
  }, [finished, queue, index, mode, flipped, busy])

  const color = deckColor(deck?.color)

  // ============================================================
  // Render
  // ============================================================
  if (!loaded) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="skeleton h-14 rounded-2xl mb-6" />
          <div className="skeleton h-[440px] rounded-[32px]" />
        </div>
      </PageTransition>
    )
  }

  const total = cards.length
  const masteredCount = cards.filter((c) => masteryLevel(progressMap[c.id]) === 'mastered').length
  const masteredPct = total ? Math.round((masteredCount / total) * 100) : 0

  if (total === 0) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <EmptyState
            emoji="🎴"
            icon="cards"
            title="Deck masih kosong"
            desc="Tambahkan kartu dulu di editor sebelum mulai belajar."
            action={
              <Link to={`/flashcard/${id}`}>
                <Button variant="mint" icon={<Icon name="pen" size={16} />}>
                  Isi Kartu Sekarang
                </Button>
              </Link>
            }
          />
        </div>
      </PageTransition>
    )
  }

  // ---------- Layar selesai ----------
  if (finished) {
    const isQuiz = mode === 'quiz'
    const missed = missedIds.length
    return (
      <PageTransition>
        {!isQuiz && <Confetti />}
        <div className="max-w-xl mx-auto px-4 py-14 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="w-24 h-24 mx-auto rounded-[30px] bg-gradient-to-br from-mint to-sky flex items-center justify-center text-5xl shadow-[0_20px_50px_-16px_rgba(46,196,182,0.7)] mb-6"
          >
            {isQuiz ? (quizScore / (sessionCount || 1) >= 0.7 ? '🏆' : '💪') : '🎉'}
          </motion.div>
          <h1 className="text-4xl font-extrabold mb-2">
            {isQuiz ? 'Kuis selesai!' : 'Sesi selesai!'}
          </h1>
          <p className="text-ink-soft text-lg mb-8">
            {isQuiz ? (
              <>
                Skor kamu:{' '}
                <b className="text-ink">
                  {quizScore} benar dari {sessionCount} soal
                </b>{' '}
                {quizScore / (sessionCount || 1) >= 0.7 ? 'Luar biasa! 🚀' : 'Terus berlatih!'}
              </>
            ) : (
              <>
                Kamu mengulang <b className="text-ink">{sessionCount} kartu</b> hari ini. Hebat! 💪
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              emoji={isQuiz ? '✅' : '🎯'}
              label={isQuiz ? 'Jawaban benar' : 'Kartu dikuasai'}
              value={isQuiz ? `${quizScore}/${sessionCount}` : `${masteredPct}%`}
              color="#7c5cfc"
              bg="#efeaff"
            />
            <StatCard emoji="🔥" label="Streak belajar" value={`${streak} hari`} color="#ff8a5c" bg="#ffefe6" />
            <StatCard emoji="📊" label="Dari total" value={`${masteredCount}/${total}`} color="#2ec4b6" bg="#e1faf5" />
            <StatCard emoji="🧠" label={isQuiz ? 'Akurasi' : 'Review hari ini'} value={isQuiz ? `${Math.round((quizScore / (sessionCount || 1)) * 100)}%` : `${sessionCount} kartu`} color="#4cc9f0" bg="#e4f7fe" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-surface rounded-3xl border-[1.5px] border-line p-5 mb-8 text-left shadow-[0_10px_30px_-16px_rgba(43,35,80,0.2)]"
          >
            <p className="text-sm font-extrabold text-ink mb-3">📊 Distribusi penguasaan</p>
            <MasteryBar cards={cards} progressMap={progressMap} />
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/flashcard/${id}`}>
              <Button variant="white" size="lg" icon={<Icon name="pen" size={17} />}>
                Edit Deck
              </Button>
            </Link>
            {missed > 0 ? (
              <Button
                size="lg"
                variant="pink"
                icon={<Icon name="refresh" size={17} />}
                onClick={replayMissed}
              >
                Ulangi {missed} Kartu Belum Hafal
              </Button>
            ) : (
              <Button
                size="lg"
                variant="primary"
                icon={<Icon name="refresh" size={17} />}
                onClick={() => start(mode)}
              >
                {isQuiz ? 'Kuis Lagi' : 'Belajar Lagi'}
              </Button>
            )}
          </div>
        </div>
      </PageTransition>
    )
  }

  // ---------- Mode SR: tidak ada kartu due ----------
  if (mode === 'sr' && queue.length === 0) {
    return (
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <StudyHeader
            deck={deck}
            color={color}
            total={total}
            masteredPct={masteredPct}
            streak={streak}
            onOpenList={() => setShowList(true)}
          />
          <CardListOverlay
            open={showList}
            onClose={() => setShowList(false)}
            cards={cards}
            progressMap={progressMap}
            color={color}
            onPick={startAt}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-[32px] border-[1.5px] border-line p-10 text-center shadow-[0_20px_60px_-24px_rgba(43,35,80,0.3)]"
          >
            <div className="text-6xl mb-4 animate-bob">😌</div>
            <h2 className="text-2xl font-extrabold mb-2">Semua kartu sudah siap!</h2>
            <p className="text-ink-soft mb-7">
              Tidak ada kartu yang harus diulang hari ini. Sistem akan mengingatkanmu sesuai jadwal
              hafalan pintar (SM-2).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="white" size="lg" icon={<Icon name="play" size={17} />} onClick={() => start('simple')}>
                Review Cepat
              </Button>
              <Button variant="mint" size="lg" icon={<Icon name="play" size={17} />} onClick={() => start('sr', true)}>
                Tetap Belajar Semua
              </Button>
              <Button variant="pink" size="lg" icon={<Icon name="target" size={17} />} onClick={() => start('quiz')}>
                Kuis Cepat
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  // ---------- Sesi aktif ----------
  const current = cards.find((c) => c.id === queue[index])
  const isSimple = mode === 'simple'
  const isQuiz = mode === 'quiz'
  const quizItem = quiz[current?.id]
  const quizAnswered = Boolean(quizItem?.answered)
  const quizSelected = quizItem?.selected ?? null
  const quizOptionsList = quizOptions[current?.id] ?? []
  const progressPct = queue.length ? Math.round((index / queue.length) * 100) : 0

  return (
    <PageTransition>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-16 min-h-[calc(100vh-68px)] flex flex-col">
        <StudyHeader
          deck={deck}
          color={color}
          total={total}
          masteredPct={masteredPct}
          streak={streak}
          onOpenList={() => setShowList(true)}
        />
        <CardListOverlay
          open={showList}
          onClose={() => setShowList(false)}
          cards={cards}
          progressMap={progressMap}
          color={color}
          onPick={startAt}
        />

        {/* Mode tabs + acak */}
        <div className="flex justify-center items-center gap-2 mb-5">
          <div className="flex p-1.5 rounded-2xl bg-surface-2">
            {[
              ['sr', '🧠 Hafalan Pintar'],
              ['simple', '🔄 Simpel'],
              ['quiz', '🎯 Kuis'],
              ['typed', '⌨️ Ketik'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => start(key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 ${
                  mode === key ? 'bg-surface shadow-[0_4px_12px_-4px_rgba(43,35,80,0.2)] text-ink' : 'text-ink-faint hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShuffle((v) => !v)}
            aria-pressed={shuffle}
            title="Acak urutan kartu"
            className={`tap flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-sm font-extrabold border-[1.5px] transition-all duration-200 ${
              shuffle
                ? 'bg-brand text-white border-brand shadow-[0_8px_20px_-8px_rgba(124,92,252,0.6)]'
                : 'bg-surface text-ink-soft border-line hover:border-brand/40'
            }`}
          >
            <span className={shuffle ? '' : 'grayscale opacity-60'}>🔀</span>
            <span className="hidden sm:inline">Acak</span>
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-extrabold text-ink-faint whitespace-nowrap">
            {index + 1} / {queue.length}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand to-pink"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-extrabold text-ink-faint whitespace-nowrap">{progressPct}%</span>
        </div>

        {/* Kartu / pertanyaan */}
        <div
          className="flex-1 min-h-[340px] sm:min-h-[400px] relative"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + (isQuiz ? '-q' : flipped ? '-f' : '')}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {isQuiz || mode === 'typed' ? (
                <div
                  className="w-full h-full rounded-[28px] border-[2.5px] overflow-hidden shadow-[0_24px_60px_-24px_rgba(43,35,80,0.45)] flex flex-col bg-surface"
                  style={{ borderColor: color.bg }}
                >
                  <div className="flex items-center justify-between px-5 pt-4">
                    <span
                      className="text-[10px] font-extrabold tracking-[0.18em]"
                      style={{ color: color.bg }}
                    >
                      PERTANYAAN
                    </span>
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color.soft }}
                    >
                      <Icon name={isQuiz ? 'target' : 'pen'} size={14} style={{ color: color.bg }} />
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-4 overflow-auto">
                    {current.image_url && (
                      <img
                        src={current.image_url}
                        alt=""
                        className="max-h-36 w-auto max-w-full object-contain rounded-xl shrink-0"
                      />
                    )}
                    <p className="text-ink font-display font-extrabold text-xl sm:text-2xl text-center leading-snug break-words">
                      {current.front_text || '…'}
                    </p>
                    {mode === 'typed' && typedResult && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-sm font-extrabold ${typedResult === 'correct' ? 'text-[#0e9e92]' : 'text-[#d63a3a]'}`}
                      >
                        {typedResult === 'correct' ? '✅ Jawabanmu tepat!' : `❌ Jawaban: ${current.back_text}`}
                      </motion.p>
                    )}
                  </div>
                  <div className="pb-4 flex justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-surface-2 text-ink-soft text-[11px] font-extrabold flex items-center gap-1.5">
                      <Icon name="spark" size={13} />{' '}
                      {isQuiz ? 'Pilih jawaban yang tepat' : 'Ketik jawaban lalu tekan Enter'}
                    </span>
                  </div>
                </div>
              ) : (
                <FlipCard
                  front={current.front_text}
                  back={current.back_text}
                  imageUrl={current.image_url}
                  flipped={flipped}
                  onFlip={() => setFlipped((v) => !v)}
                  color={color}
                  showFlipHint={!flipped}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Kontrol */}
        <div className="mt-6">
          {isQuiz ? (
            quizAnswered ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className={`w-full rounded-2xl px-5 py-4 text-center font-extrabold text-[15px] border-[1.5px] ${
                    quizSelected === (current.back_text || '…')
                      ? 'bg-[#e1faf5] text-[#0e9e92] border-mint/40'
                      : 'bg-[#ffe9e9] text-[#d63a3a] border-[#ffc9c9]'
                  }`}
                >
                  {quizSelected === (current.back_text || '…') ? (
                    <>🎉 Benar! Jawaban: {current.back_text}</>
                  ) : (
                    <>
                      ❌ Kurang tepat. Jawaban benar:{' '}
                      <b className="text-ink">{current.back_text}</b>
                    </>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={nextCard}
                  icon={<Icon name={index < queue.length - 1 ? 'chevron-right' : 'circle-check'} size={18} />}
                >
                  {index < queue.length - 1 ? 'Lanjut' : 'Lihat Hasil'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid sm:grid-cols-2 gap-2.5"
              >
                {quizOptionsList.map((opt, i) => {
                  const isCorrect = opt === (current.back_text || '…')
                  const isWrongPick = quizAnswered && quizSelected === opt && !isCorrect
                  const dim = quizAnswered && !isCorrect && quizSelected !== opt
                  return (
                    <button
                      key={i}
                      onClick={() => answerQuiz(opt)}
                      disabled={quizAnswered}
                      className={`tap flex items-center gap-3 px-4 py-3.5 rounded-2xl border-[1.5px] font-bold text-[15px] text-left transition-all duration-200 ${
                        isCorrect
                          ? 'bg-[#e1faf5] border-mint/50 text-[#0e9e92]'
                          : isWrongPick
                            ? 'bg-[#ffe9e9] border-[#ffc9c9] text-[#d63a3a]'
                            : 'bg-surface border-line text-ink-soft hover:border-brand/50 hover:bg-surface-2'
                      } ${dim ? 'opacity-40' : ''}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                          isCorrect ? 'bg-mint text-white' : isWrongPick ? 'bg-[#ff5d5d] text-white' : 'bg-surface-2 text-ink-faint'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="leading-snug">{opt}</span>
                      {isCorrect && <Icon name="circle-check" size={18} className="ml-auto shrink-0" />}
                      {isWrongPick && <Icon name="circle-x" size={18} className="ml-auto shrink-0" />}
                    </button>
                  )
                })}
              </motion.div>
            )
          ) : mode === 'typed' ? (
            typedResult ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className={`w-full rounded-2xl px-5 py-4 text-center font-extrabold text-[15px] border-[1.5px] ${
                    typedResult === 'correct'
                      ? 'bg-[#e1faf5] text-[#0e9e92] border-mint/40'
                      : 'bg-[#ffe9e9] text-[#d63a3a] border-[#ffc9c9]'
                  }`}
                >
                  {typedResult === 'correct' ? (
                    <>🎉 Benar! Jawabanmu: {typedValue.trim()}</>
                  ) : (
                    <>
                      ❌ Kurang tepat. Jawaban benar:{' '}
                      <b className="text-ink">{current.back_text}</b>
                    </>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={nextCard}
                  icon={<Icon name={index < queue.length - 1 ? 'chevron-right' : 'circle-check'} size={18} />}
                >
                  {index < queue.length - 1 ? 'Lanjut' : 'Lihat Hasil'}
                </Button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  submitTyped()
                }}
                className="flex flex-col gap-3"
              >
                <input
                  key={current.id}
                  autoFocus
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  placeholder="Ketik jawabanmu di sini…"
                  aria-label="Jawabanmu"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full bg-surface border-[2px] border-line rounded-2xl px-5 py-4 text-center text-lg font-extrabold text-ink placeholder:text-ink-faint/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 transition-all"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!typedValue.trim()}
                  icon={<Icon name="check" size={18} />}
                >
                  Periksa Jawaban
                </Button>
              </motion.form>
            )
          ) : isSimple ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="white"
                size="lg"
                onClick={() => {
                  setIndex((i) => Math.max(0, i - 1))
                  setFlipped(false)
                }}
                disabled={index === 0}
                icon={<Icon name="chevron-left" size={18} />}
              >
                Sebelumnya
              </Button>
              {index < queue.length - 1 ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setIndex((i) => i + 1)
                    setFlipped(false)
                  }}
                  icon={<Icon name="chevron-right" size={18} />}
                >
                  Berikutnya
                </Button>
              ) : (
                <Button variant="mint" size="lg" onClick={finish} icon={<Icon name="circle-check" size={18} />}>
                  Selesai
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {flipped ? (
                <motion.div
                  key="ratings"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-3 gap-2.5 sm:gap-3"
                >
                  <RatingBtn
                    label="Belum Hafal"
                    emoji="😵"
                    sub="ulang besok"
                    className="from-[#ff5d5d] to-[#ff8a5c]"
                    onClick={() => rate(0)}
                    busy={busy}
                  />
                  <RatingBtn
                    label="Ragu-ragu"
                    emoji="🤔"
                    sub="ulang sebentar lagi"
                    className="from-amber to-coral"
                    onClick={() => rate(1)}
                    busy={busy}
                  />
                  <RatingBtn
                    label="Sudah Hafal"
                    emoji="😎"
                    sub="makin jarang diulang"
                    className="from-mint to-sky"
                    onClick={() => rate(2)}
                    busy={busy}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="flip-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <Button
                    variant="white"
                    size="lg"
                    onClick={() => setFlipped(true)}
                    icon={<Icon name="eye" size={18} />}
                  >
                    Lihat Jawaban
                  </Button>
                  <p className="text-xs text-ink-faint mt-2.5 font-bold">
                    Tekan Spasi untuk membalik kartu
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

const StudyHeader = memo(function StudyHeader({ deck, color, total, masteredPct, streak, onOpenList }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        to={`/flashcard/${deck.id}`}
        aria-label="Kembali"
        className="tap p-2.5 rounded-xl bg-surface border-[1.5px] border-line text-ink-soft hover:text-ink shadow-[0_8px_20px_-12px_rgba(43,35,80,0.3)]"
      >
        <Icon name="arrow-left" size={18} />
      </Link>
      <div className="min-w-0">
        <h1 className="font-extrabold text-xl truncate">{deck.title}</h1>
        <p className="text-xs text-ink-faint font-bold">
          {total} kartu · {masteredPct}% dikuasai
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenList}
          aria-label="Lihat daftar kartu"
          title="Daftar kartu"
          className="tap p-2.5 rounded-xl bg-surface border-[1.5px] border-line text-ink-soft hover:text-ink hover:border-brand/40 shadow-[0_8px_20px_-12px_rgba(43,35,80,0.3)] transition-colors"
        >
          <Icon name="grid" size={18} />
        </button>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#fff6d9] text-[#c47e00] text-xs font-extrabold border-[1.5px] border-[#ffe3a3]">
            <Icon name="flame" size={15} filled /> {streak} hari
          </span>
        )}
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg shadow-md"
          style={{ backgroundColor: color.bg }}
        >
          <Icon name="cards" size={19} />
        </span>
      </div>
    </div>
  )
})

const StatCard = memo(function StatCard({ emoji, label, value, color, bg }) {
  return (
    <div className="rounded-3xl border-[1.5px] border-line bg-surface p-5 text-left shadow-[0_10px_30px_-16px_rgba(43,35,80,0.25)]">
      <span
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3"
        style={{ backgroundColor: bg }}
      >
        {emoji}
      </span>
      <p className="text-2xl font-extrabold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-bold text-ink-soft mt-0.5">{label}</p>
    </div>
  )
})

const MasteryBar = memo(function MasteryBar({ cards, progressMap }) {
  const levels = [
    { key: 'new', label: 'Baru', color: '#9b94b6' },
    { key: 'learning', label: 'Belajar', color: '#ff8a5c' },
    { key: 'strong', label: 'Kuat', color: '#4cc9f0' },
    { key: 'mastered', label: 'Dikuasai', color: '#2ec4b6' },
  ]
  const counts = levels.map(
    (l) => cards.filter((c) => masteryLevel(progressMap[c.id]) === l.key).length,
  )
  const total = cards.length || 1
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-surface-2">
        {counts.map((c, i) =>
          c > 0 ? (
            <motion.div
              key={levels[i].key}
              initial={{ width: 0 }}
              animate={{ width: `${(c / total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundColor: levels[i].color }}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {levels.map((l, i) => (
          <span key={l.key} className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label} <b className="text-ink">{counts[i]}</b>
          </span>
        ))}
      </div>
    </div>
  )
})

function CardListOverlay({ open, onClose, cards, progressMap, color, onPick }) {
  if (!open) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[85] bg-paper/95 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Daftar kartu"
    >
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold">
            📋 Daftar Kartu{' '}
            <span className="text-ink-faint text-sm font-bold">({cards.length})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup daftar"
            className="tap p-2.5 rounded-xl bg-surface border-[1.5px] border-line text-ink-soft hover:text-ink flex items-center gap-1.5"
          >
            <Icon name="close" size={18} /> Tutup
          </button>
        </div>
        <p className="text-sm text-ink-soft mb-5">
          Ketuk kartu untuk langsung mulai mempelajarinya (mode Simpel).
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c, i) => {
            const level = MASTERY_LABELS[masteryLevel(progressMap[c.id])]
            return (
              <motion.button
                key={c.id}
                onClick={() => onPick(i)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.35) }}
                className="tap text-left bg-surface rounded-2xl border-[1.5px] border-line hover:border-brand/50 p-4 flex flex-col gap-2.5 transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_-14px_rgba(43,35,80,0.2)]"
              >
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-24 object-cover rounded-xl"
                  />
                )}
                <span className="text-[10px] font-extrabold tracking-wide text-ink-faint">
                  KARTU {i + 1}
                </span>
                <p className="text-sm font-extrabold text-ink leading-snug line-clamp-2">
                  {c.front_text || '…'}
                </p>
                <p className="text-xs text-ink-soft leading-snug line-clamp-2">
                  {c.back_text || 'Belum ada jawaban'}
                </p>
                <span
                  className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                  style={{ backgroundColor: `${level.color}22`, color: level.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: level.color }} />
                  {level.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

const RatingBtn = memo(function RatingBtn({ label, emoji, sub, className, onClick, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`tap shine bg-gradient-to-br ${className} text-white rounded-2xl px-3 py-4 sm:py-5 flex flex-col items-center gap-1 shadow-[0_14px_30px_-12px_rgba(43,35,80,0.4)] disabled:opacity-60`}
    >
      <span className="text-2xl sm:text-3xl">{emoji}</span>
      <span className="text-sm sm:text-[15px] font-extrabold leading-tight text-center">{label}</span>
      <span className="text-[10px] sm:text-[11px] font-bold text-white/80">{sub}</span>
    </button>
  )
})
