const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand to-brand-deep text-white shadow-[0_10px_24px_-8px_rgba(124,92,252,0.6)] hover:shadow-[0_14px_30px_-8px_rgba(124,92,252,0.7)] hover:brightness-110',
  pink: 'bg-gradient-to-r from-pink to-coral text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.6)] hover:brightness-105',
  amber: 'bg-gradient-to-r from-amber to-coral text-white shadow-[0_10px_24px_-8px_rgba(255,182,39,0.6)] hover:brightness-105',
  mint: 'bg-gradient-to-r from-mint to-sky text-white shadow-[0_10px_24px_-8px_rgba(46,196,182,0.6)] hover:brightness-105',
  soft: 'bg-brand-soft text-brand-deep hover:bg-[#e3d9ff]',
  white:
    'bg-surface text-ink border-[1.5px] border-line shadow-[0_6px_18px_-8px_rgba(43,35,80,0.15)] hover:border-brand hover:text-brand-deep',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink',
  danger: 'bg-[#ffe9e9] text-[#d63a3a] border-[1.5px] border-[#ffc9c9] hover:bg-[#ffdcdc]',
  dangerSolid: 'bg-gradient-to-r from-[#ff5d5d] to-[#ff8a5c] text-white hover:brightness-105',
}

const SIZES = {
  xs: 'px-2.5 py-1.5 text-xs rounded-lg gap-1',
  sm: 'px-3.5 py-2 text-sm rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-[15px] rounded-2xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2',
  icon: 'p-2.5 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading = false,
  icon,
  fullWidth = false,
  ...rest
}) {
  return (
    <button
      className={`tap shine inline-flex items-center justify-center font-bold select-none disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ minHeight: size === 'icon' ? 44 : undefined }}
      {...rest}
    >
      {loading ? <Spinner size={18} /> : icon}
      {children}
    </button>
  )
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-label="Memuat"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
