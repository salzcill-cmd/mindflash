import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Blobs from '../components/Blobs'
import Button from '../components/ui/Button'
import { Icon } from '../components/Icons'

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

const FEATURES = [
  {
    icon: 'mindmap',
    color: '#7c5cfc',
    bg: '#efeaff',
    title: 'Mindmap Seret & Lepas',
    desc: 'Buat peta pikiran semudah main game. Tarik garis, warnai node, atur rapi otomatis.',
  },
  {
    icon: 'cards',
    color: '#ff6f91',
    bg: '#ffeaf4',
    title: 'Flashcard Flip 3D',
    desc: 'Kartu hafalan dengan animasi membalik nyata. Bikin deck sendiri dengan warna favoritmu.',
  },
  {
    icon: 'zap',
    color: '#ffb627',
    bg: '#fff6d9',
    title: 'Hafalan Pintar (SM-2)',
    desc: 'Sistem spaced repetition ala Anki: kartu yang belum hafal muncul lebih sering.',
  },
  {
    icon: 'eye',
    color: '#2ec4b6',
    bg: '#e1faf5',
    title: 'Share Tanpa Ribet',
    desc: 'Bagikan link ke teman atau guru. Mereka lihat tanpa login, kamu tetap pegang kendali.',
  },
  {
    icon: 'download',
    color: '#4cc9f0',
    bg: '#e4f7fe',
    title: 'Export PNG',
    desc: 'Simpan mindmap jadi gambar HD untuk dicetak atau dikirim ke grup kelas.',
  },
  {
    icon: 'shield',
    color: '#4d96ff',
    bg: '#e7f0ff',
    title: 'Data Aman & Auto-save',
    desc: 'Semua tersimpan otomatis ke akunmu. Buka dari HP, laptop, atau warnet — tetap ada.',
  },
]

const STEPS = [
  {
    num: '1',
    emoji: '🧠',
    color: '#7c5cfc',
    title: 'Bikin Peta Pikiran',
    desc: 'Tulis ide utama, tambah cabang, warnai dan kasih ikon. Mode auto-layout bikin rapi otomatis.',
  },
  {
    num: '2',
    emoji: '🃏',
    color: '#ff6f91',
    title: 'Ubah Jadi Flashcard',
    desc: 'Dari catatanmu, buat kartu tanya-jawab. Tambahkan gambar supaya makin gampang diingat.',
  },
  {
    num: '3',
    emoji: '🚀',
    color: '#2ec4b6',
    title: 'Belajar & Taklukkan Ujian',
    desc: 'Review kartu tiap hari. Sistem pintar mengulang yang belum hafal — kamu tinggal fokus.',
  },
]

const STATS = [
  { value: '10+', label: 'Palet warna node', emoji: '🎨', color: '#7c5cfc', bg: '#efeaff' },
  { value: '30+', label: 'Ikon & emoji pilihan', emoji: '✨', color: '#ff6f91', bg: '#ffeaf4' },
  { value: '2', label: 'Mode belajar hafalan', emoji: '🧠', color: '#2ec4b6', bg: '#e1faf5' },
  { value: '100%', label: 'Gratis untuk pelajar', emoji: '🎁', color: '#ffb627', bg: '#fff6d9' },
]

const MARQUEE_ITEMS = [
  'Mindmap', 'Flashcard', 'SM-2', 'Drag & Drop', 'Auto-Layout', 'Flip 3D',
  'Export PNG', 'Share Link', 'Streak Harian', 'Spaced Repetition', 'Tanpa AI', 'Gratis',
]

const FAQS = [
  {
    q: 'Apakah MindFlash benar-benar gratis?',
    a: 'Ya, 100% gratis untuk semua pelajar — tanpa kartu kredit, tanpa batas waktu. Cukup buka websitenya dan langsung bisa dipakai.',
  },
  {
    q: 'Bisa dipakai tanpa daftar akun?',
    a: 'Bisa! Mode guest menyimpan data sementara di browser-mu. Kalau sudah siap, daftar sekali dan semua data otomatis dipindahkan ke akunmu.',
  },
  {
    q: 'Apa itu spaced repetition (SM-2)?',
    a: 'Sistem hafalan pintar ala Anki: kartu yang belum hafal muncul lebih sering, yang sudah hafal makin jarang. Otakmu jadi ingat lebih lama tanpa nge-stuff semalaman.',
  },
  {
    q: 'Apakah dataku aman?',
    a: 'Aman. Data tersimpan di Supabase dengan Row Level Security — hanya kamu yang bisa membaca atau mengedit datamu sendiri, kecuali item yang sengaja kamu bagikan.',
  },
  {
    q: 'Bisakah aku share hasil belajarku?',
    a: 'Tentu! Aktifkan link share, kirim ke teman atau guru. Mereka bisa melihat tanpa login, dan kamu bisa mematikan link-nya kapan saja.',
  },
]

const PERSONAS = [
  {
    name: 'Rani · 14 th',
    emoji: '🎨',
    color: '#ff6f91',
    bg: '#ffeaf4',
    quote: 'Biasanya aku gampang bosan catat, tapi mindmap MindFlash kayak main game. Warnanya lucu!',
  },
  {
    name: 'Bima · 17 th',
    emoji: '🧬',
    color: '#7c5cfc',
    bg: '#efeaff',
    quote: 'Rumus biologi yang susah banget jadi kebawa terus. Fitur spaced repetition-nya nempel banget.',
  },
  {
    name: 'Pak Doni · Guru',
    emoji: '📚',
    color: '#2ec4b6',
    bg: '#e1faf5',
    quote: 'Saya share mindmap materi lewat link, murid langsung bisa buka tanpa daftar akun. Praktis!',
  },
]

export default function Landing() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [faqOpen, setFaqOpen] = useState(0)
  const rafRef = useRef(null)

  // Throttle via requestAnimationFrame — setState maksimal sekali per frame
  const onHeroMove = (e) => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      setParallax({
        x: (e.clientX / window.innerWidth - 0.5) * 18,
        y: (e.clientY / window.innerHeight - 0.5) * 14,
      })
    })
  }

  return (
    <div className="relative">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden" onMouseMove={onHeroMove}>
        <Blobs variant="rich" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-20 sm:pt-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-soft border-[1.5px] border-brand/25 text-brand-deep text-sm font-extrabold shadow-[0_6px_16px_-8px_rgba(124,92,252,0.5)]">
                <Icon name="spark" size={15} />
                Gratis selamanya untuk pelajar
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 text-[42px] sm:text-[56px] lg:text-[62px] leading-[1.05] font-extrabold tracking-tight"
            >
              Catat Lebih Cepat.
              <br />
              <span className="text-gradient">Hafal Lebih Lama.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-5 text-lg text-ink-soft max-w-lg leading-relaxed"
            >
              MindFlash menggabungkan <b className="text-ink">mindmap</b> &{' '}
              <b className="text-ink">flashcard pintar</b> dalam satu tempat — biar belajar jelang
              ulangan jadi cepat, seru, dan nggak gampang lupa.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link to="/dashboard">
                <Button size="lg" icon={<Icon name="zap" size={19} />} className="w-full sm:w-auto">
                  Coba Gratis Sekarang
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button size="lg" variant="white" icon={<Icon name="user" size={18} />} className="w-full sm:w-auto">
                  Daftar dengan Email
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-extrabold text-ink-soft"
            >
              <span className="flex items-center gap-2">
                <Icon name="circle-check" size={17} className="text-mint" /> Tanpa kartu kredit
              </span>
              <span className="flex items-center gap-2">
                <Icon name="circle-check" size={17} className="text-mint" /> Tanpa install
              </span>
              <span className="flex items-center gap-2">
                <Icon name="circle-check" size={17} className="text-mint" /> Tanpa AI — murni hasil otakmu
              </span>
            </motion.div>
          </div>

          {/* Dekorasi produk (parallax halus mengikuti mouse) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden md:block h-[460px]"
          >
            <div
              className="w-full h-full"
              style={{
                transform: `translate(${parallax.x}px, ${parallax.y}px)`,
                transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
            >
              <HeroMock />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section className="relative border-y-[1.5px] border-line bg-surface/70 backdrop-blur py-4 overflow-hidden marquee-mask" aria-hidden>
        <div className="flex w-max animate-marquee gap-3">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-[1.5px] font-extrabold text-sm whitespace-nowrap"
              style={{
                backgroundColor: ['#efeaff', '#ffeaf4', '#e1faf5', '#fff6d9', '#e7f0ff'][i % 5],
                borderColor: ['#d9ccf5', '#ffc9dd', '#bfeee7', '#ffe3a3', '#cddffa'][i % 5],
                color: ['#5b3fe8', '#c92f78', '#0e9e92', '#c47e00', '#2f6fe0'][i % 5],
              }}
            >
              <Icon name="spark" size={13} />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ============ STATS BAND ============ */}
      <section className="relative py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="lift bg-surface rounded-3xl border-[1.5px] border-line p-5 flex items-center gap-4 shadow-[0_10px_30px_-14px_rgba(43,35,80,0.15)]"
              >
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: s.bg }}
                >
                  {s.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-xs font-bold text-ink-soft mt-1">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FITUR ============ */}
      <section id="fitur" className="relative py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="squiggle inline-block text-2xl font-extrabold text-brand">
              Kenapa MindFlash?
            </span>
            <h2 className="mt-3 text-4xl sm:text-[44px] font-extrabold">
              Semua alat belajar, <span className="text-gradient">satu tempat</span>
            </h2>
            <p className="mt-3 text-ink-soft max-w-xl mx-auto text-lg">
              Didesain khusus untuk pelajar: simpel dipakai, colorful, dan bikin betah belajar.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.09 }}
                className="lift group bg-surface rounded-3xl border-[1.5px] border-line p-6 shadow-[0_10px_30px_-14px_rgba(43,35,80,0.15)]"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: f.bg, color: f.color }}
                >
                  <Icon name={f.icon} size={24} />
                </div>
                <h3 className="text-lg font-extrabold mb-1.5">{f.title}</h3>
                <p className="text-[15px] text-ink-soft leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CARA KERJA ============ */}
      <section id="cara-kerja" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="squiggle inline-block text-2xl font-extrabold text-pink">
              Cara Kerja
            </span>
            <h2 className="mt-3 text-4xl sm:text-[44px] font-extrabold">
              3 langkah menuju <span className="text-gradient">nilai terbaik</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative bg-surface rounded-3xl border-[1.5px] border-line p-7 shadow-[0_14px_36px_-16px_rgba(43,35,80,0.18)]"
              >
                <div
                  className="absolute -top-4 -right-2 w-11 h-11 rounded-full text-white font-display font-extrabold text-lg flex items-center justify-center shadow-lg animate-bob"
                  style={{ backgroundColor: s.color, animationDelay: `${i * 0.4}s` }}
                >
                  {s.num}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ backgroundColor: `${s.color}18` }}
                >
                  {s.emoji}
                </div>
                <h3 className="text-xl font-extrabold mb-2">{s.title}</h3>
                <p className="text-ink-soft leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PERSONA / TESTIMONI ============ */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="squiggle inline-block text-2xl font-extrabold text-mint">
              Kata Mereka
            </span>
            <h2 className="mt-3 text-4xl sm:text-[44px] font-extrabold">
              Disukai pelajar & <span className="text-gradient">guru</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {PERSONAS.map((p, i) => (
              <motion.figure
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="bg-surface rounded-3xl border-[1.5px] border-line p-6 shadow-[0_10px_30px_-14px_rgba(43,35,80,0.15)] hover:shadow-[0_18px_44px_-16px_rgba(124,92,252,0.35)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4 text-amber">
                  {[...Array(5)].map((_, j) => (
                    <Icon key={j} name="spark" size={16} filled />
                  ))}
                </div>
                <blockquote className="text-[15px] leading-relaxed text-ink-soft mb-5">
                  “{p.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: p.bg }}
                  >
                    {p.emoji}
                  </span>
                  <span className="font-extrabold text-ink">{p.name}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="relative py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="squiggle inline-block text-2xl font-extrabold text-brand">
              Tanya Jawab
            </span>
            <h2 className="mt-3 text-4xl sm:text-[44px] font-extrabold">
              Masih <span className="text-gradient">penasaran</span>?
            </h2>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = faqOpen === i
              return (
                <motion.div
                  key={f.q}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`bg-surface rounded-3xl border-[1.5px] overflow-hidden transition-shadow duration-300 ${
                    open ? 'border-brand/40 shadow-[0_16px_40px_-16px_rgba(124,92,252,0.4)]' : 'border-line shadow-[0_8px_24px_-14px_rgba(43,35,80,0.15)]'
                  }`}
                >
                  <button
                    onClick={() => setFaqOpen(open ? -1 : i)}
                    className="w-full flex items-center gap-4 px-5 sm:px-6 py-5 text-left"
                    aria-expanded={open}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        open ? 'bg-brand text-white' : 'bg-brand-soft text-brand'
                      }`}
                    >
                      <Icon name="spark" size={16} />
                    </span>
                    <span className="flex-1 font-extrabold text-[15px] sm:text-base">{f.q}</span>
                    <motion.span
                      animate={{ rotate: open ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-8 h-8 rounded-xl bg-surface-2 text-ink-soft flex items-center justify-center shrink-0"
                    >
                      <Icon name="plus" size={16} strokeWidth={2.5} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 sm:px-6 pb-5 pl-[76px] text-[15px] text-ink-soft leading-relaxed">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA AKHIR ============ */}
      <section className="relative py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="relative mx-auto max-w-4xl rounded-[36px] bg-gradient-to-br from-brand via-[#8f6bff] to-pink p-[2px] shadow-[0_30px_80px_-24px_rgba(124,92,252,0.55)]"
        >
          <div className="rounded-[34px] bg-gradient-to-br from-[#6d4ef0] to-[#ff6f91] px-6 py-14 sm:py-16 text-center relative overflow-hidden">
            <div className="absolute w-48 h-48 rounded-full bg-white/10 blur-2xl -top-10 -left-10 animate-blob" />
            <div className="absolute w-40 h-40 rounded-full bg-white/10 blur-2xl -bottom-12 -right-8 animate-blob" style={{ animationDelay: '-8s' }} />
            <h2 className="relative text-3xl sm:text-[44px] font-extrabold text-white mb-3">
              Siap mulai belajar lebih pintar? 🚀
            </h2>
            <p className="relative text-white/85 text-lg max-w-md mx-auto mb-8">
              Bikin mindmap pertamamu dalam 30 detik — tanpa daftar akun pun bisa.
            </p>
            <div className="relative flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/dashboard">
                <Button
                  size="lg"
                  variant="white"
                  icon={<Icon name="zap" size={19} />}
                  className="w-full sm:w-auto text-brand-deep!"
                >
                  Mulai Sekarang
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto text-white! hover:bg-white/15!"
                >
                  Buat Akun Gratis
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------
   Mockup produk di hero (dekoratif, tanpa library berat)
   ------------------------------------------------------------ */
function HeroMock() {
  const nodes = [
    { id: 'a', x: 200, y: 160, label: 'Fotosintesis', icon: '🌱', color: 'violet' },
    { id: 'b', x: 60, y: 40, label: 'Cahaya', icon: '☀️', color: 'amber' },
    { id: 'c', x: 60, y: 280, label: 'Klorofil', icon: '💚', color: 'mint' },
    { id: 'd', x: 340, y: 60, label: 'Air & CO₂', icon: '💧', color: 'sky' },
    { id: 'e', x: 340, y: 260, label: 'Oksigen', icon: '🫧', color: 'pink' },
  ]
  const edges = [
    ['a', 'b'],
    ['a', 'c'],
    ['a', 'd'],
    ['a', 'e'],
  ]
  const colorMap = {
    violet: { bg: '#efeaff', border: '#7c5cfc', text: '#5b3fe8' },
    amber: { bg: '#fff6d9', border: '#ffb020', text: '#c47e00' },
    mint: { bg: '#e1faf5', border: '#2ec4b6', text: '#0e9e92' },
    sky: { bg: '#e3f7fe', border: '#38c6f4', text: '#0f94c8' },
    pink: { bg: '#ffeaf4', border: '#f75da8', text: '#c92f78' },
  }

  return (
    <div className="absolute inset-0">
      {/* Canvas card */}
      <div className="absolute inset-x-6 top-6 bottom-16 bg-surface/90 backdrop-blur rounded-[28px] border-[1.5px] border-line shadow-[0_30px_70px_-24px_rgba(43,35,80,0.35)] overflow-hidden dot-grid">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 480 380" fill="none" aria-hidden>
          {edges.map(([s, t], i) => {
            const a = nodes.find((n) => n.id === s)
            const b = nodes.find((n) => n.id === t)
            const x1 = a.x + 95
            const y1 = a.y + 42
            const x2 = b.x + 95
            const y2 = b.y + 42
            const mx = (x1 + x2) / 2
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                stroke="#a99ad9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )
          })}
        </svg>
        {nodes.map((n, i) => {
          const c = colorMap[n.color]
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute flex items-center gap-2 px-4 py-2.5 rounded-2xl border-[2px] shadow-[0_10px_24px_-10px_rgba(43,35,80,0.3)]"
              style={{
                left: n.x,
                top: n.y,
                backgroundColor: c.bg,
                borderColor: c.border,
              }}
            >
              <span className="text-lg">{n.icon}</span>
              <span className="text-[13px] font-extrabold" style={{ color: c.text }}>
                {n.label}
              </span>
            </motion.div>
          )
        })}
        {/* Toolbar fake */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface rounded-2xl border-[1.5px] border-line px-2.5 py-1.5 shadow-[0_8px_20px_-10px_rgba(43,35,80,0.3)]">
          <span className="w-6 h-6 rounded-lg bg-[#efeaff] flex items-center justify-center text-[11px]">↩</span>
          <span className="w-6 h-6 rounded-lg bg-[#ffeaf4] flex items-center justify-center text-[11px]">↪</span>
          <span className="w-6 h-6 rounded-lg bg-[#e1faf5] flex items-center justify-center text-[11px]">+</span>
          <span className="ml-1 text-[10px] font-extrabold text-mint flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-soft" /> Tersimpan
          </span>
        </div>
      </div>

      {/* Floating flashcard */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="absolute -right-2 bottom-0 w-48 rounded-2xl bg-gradient-to-br from-pink to-coral text-white p-4 shadow-[0_24px_50px_-16px_rgba(255,111,145,0.6)] rotate-3"
      >
        <p className="text-[10px] font-bold opacity-80 mb-1">FLASHCARD · BIOLOGI</p>
        <p className="font-display font-extrabold text-lg leading-tight">Apa fungsi klorofil? 🤔</p>
        <div className="mt-3 h-1.5 rounded-full bg-white/30">
          <div className="h-full w-2/3 rounded-full bg-white" />
        </div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
        className="absolute left-0 top-0 bg-surface rounded-2xl border-[1.5px] border-line px-3.5 py-2.5 shadow-[0_16px_36px_-14px_rgba(43,35,80,0.35)] -rotate-3 flex items-center gap-2"
      >
        <span className="text-xl">🔥</span>
        <div>
          <p className="text-[10px] font-bold text-ink-faint">Streak belajar</p>
          <p className="text-sm font-extrabold text-ink">7 hari berturut-turut!</p>
        </div>
      </motion.div>
    </div>
  )
}
