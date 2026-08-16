const base =
  'w-full bg-surface border-[1.5px] border-line rounded-xl px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-faint transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none'

export function Input({ label, error, hint, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input className={`${base} ${className}`} {...rest} />
    </Field>
  )
}

export function TextArea({ label, error, hint, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea className={`${base} resize-none leading-relaxed ${className}`} {...rest} />
    </Field>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block text-left">
      {label && (
        <span className="block text-sm font-extrabold text-ink mb-1.5 tracking-tight">{label}</span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-ink-faint mt-1.5">{hint}</span>}
      {error && <span className="block text-xs font-bold text-[#d63a3a] mt-1.5">{error}</span>}
    </label>
  )
}
