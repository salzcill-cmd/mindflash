import { memo } from 'react'
import { Icon } from './Icons'

/**
 * Kartu flashcard dengan animasi flip 3D.
 * Dipakai di Flashcard Editor, Study Mode, dan halaman Share.
 */
const FlipCard = memo(function FlipCard({
  front,
  back,
  imageUrl,
  flipped,
  onFlip,
  color,
  className = '',
  frontHint = 'PERTANYAAN',
  backHint = 'JAWABAN',
  showFlipHint = true,
  rounded = 'rounded-[28px]',
}) {
  const c = color ?? { bg: '#7c5cfc', soft: '#efeaff' }
  const hasImage = Boolean(imageUrl)

  return (
    <div
      className={`perspective-1200 w-full h-full cursor-pointer select-none ${className}`}
      onClick={onFlip}
      role="button"
      aria-pressed={flipped}
      aria-label={flipped ? 'Balik ke pertanyaan' : 'Balik lihat jawaban'}
    >
      <div
        className="relative w-full h-full preserve-3d transition-transform duration-[650ms]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transitionTimingFunction: 'cubic-bezier(.25,.9,.3,1.1)' }}
      >
        {/* ===== SISI DEPAN ===== */}
        <div
          className={`absolute inset-0 backface-hidden ${rounded} border-[2.5px] overflow-hidden shadow-[0_24px_60px_-24px_rgba(43,35,80,0.45)] flex flex-col`}
          style={{
            background: `linear-gradient(160deg, ${c.bg} 0%, ${c.bg}cc 60%, ${c.bg}99 100%)`,
            borderColor: `${c.bg}55`,
          }}
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-[10px] font-extrabold tracking-[0.18em] text-white/80">{frontHint}</span>
            <Icon name="cards" size={15} className="text-white/70" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-4 overflow-auto">
            {hasImage && (
              <img
                src={imageUrl}
                alt=""
                className="max-h-36 w-auto max-w-full object-contain rounded-xl shrink-0"
              />
            )}
            <p className="text-white font-display font-extrabold text-xl sm:text-2xl text-center leading-snug break-words">
              {front || '…'}
            </p>
          </div>
          {showFlipHint && (
            <div className="pb-4 flex justify-center">
              <span className="px-3 py-1.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold flex items-center gap-1.5 animate-bob">
                <Icon name="eye" size={13} /> Ketuk untuk lihat jawaban
              </span>
            </div>
          )}
        </div>

        {/* ===== SISI BELAKANG ===== */}
        <div
          className={`absolute inset-0 backface-hidden flip-y-180 ${rounded} border-[2.5px] overflow-hidden shadow-[0_24px_60px_-24px_rgba(43,35,80,0.45)] flex flex-col bg-surface`}
          style={{ borderColor: c.bg }}
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <span
              className="text-[10px] font-extrabold tracking-[0.18em]"
              style={{ color: c.bg }}
            >
              {backHint}
            </span>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: c.soft }}
            >
              <Icon name="spark" size={13} style={{ color: c.bg }} />
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-4 overflow-auto">
            {hasImage && !back && (
              <img
                src={imageUrl}
                alt="Gambar jawaban"
                className="max-h-40 max-w-full object-contain rounded-xl shrink-0"
              />
            )}
            <p className="text-ink font-display font-extrabold text-xl sm:text-2xl text-center leading-snug break-words">
              {back || '…'}
            </p>
          </div>
          <div className="pb-4 flex justify-center">
            <span className="px-3 py-1.5 rounded-full bg-surface-2 text-ink-soft text-[11px] font-extrabold flex items-center gap-1.5">
              <Icon name="refresh" size={13} /> Balik lagi
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default FlipCard
