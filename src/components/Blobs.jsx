/**
 * Elemen dekoratif organik: blob warna-warni lembut + bentuk kecil mengambang.
 * GPU-friendly (hanya transform + opacity).
 */
export default function Blobs({ variant = 'default' }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="glow-orb w-[420px] h-[420px] -top-28 -left-24 animate-blob"
        style={{ background: 'radial-gradient(circle at 30% 30%, #c9b8ff, transparent 65%)' }}
      />
      <div
        className="glow-orb w-[380px] h-[380px] top-1/3 -right-28 animate-blob"
        style={{ background: 'radial-gradient(circle at 60% 40%, #ffc9dd, transparent 65%)', animationDelay: '-6s' }}
      />
      <div
        className="glow-orb w-[300px] h-[300px] -bottom-24 left-1/4 animate-blob"
        style={{ background: 'radial-gradient(circle at 50% 50%, #ffe3b8, transparent 65%)', animationDelay: '-12s' }}
      />
      {variant === 'rich' && (
        <>
          <div
            className="glow-orb w-[260px] h-[260px] top-10 right-1/4 animate-blob"
            style={{ background: 'radial-gradient(circle at 50% 50%, #bdeafb, transparent 65%)', animationDelay: '-3s' }}
          />
          <div className="absolute w-10 h-10 rounded-[14px] bg-mint/60 rotate-12 top-24 left-[12%] animate-float opacity-70" />
          <div className="absolute w-6 h-6 rounded-full bg-pink/60 top-1/2 right-[8%] animate-float-slow opacity-60" />
          <div className="absolute w-8 h-8 rounded-full bg-amber/70 bottom-1/4 left-[6%] animate-float-slow opacity-60" />
        </>
      )}
    </div>
  )
}
