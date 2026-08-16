import { Link } from 'react-router-dom'

export default function Logo({ size = 38, to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 group ${className}`} aria-label="MindFlash">
      <span className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-pink shadow-[0_8px_20px_-6px_rgba(124,92,252,0.55)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
        <svg width={size} height={size} viewBox="0 0 64 64" className="p-[9px]" aria-hidden>
          <path
            d="M20 44V20l12 14 12-14v24"
            fill="none"
            stroke="#fff"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="47" cy="15" r="4.5" fill="#FFD166" />
        </svg>
      </span>
      <span className="font-display font-extrabold text-[22px] leading-none tracking-tight text-ink">
        Mind<span className="text-gradient">Flash</span>
      </span>
    </Link>
  )
}
