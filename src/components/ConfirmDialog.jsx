import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { Input } from './ui/Input'
import { Icon } from './Icons'

/**
 * Dialog konfirmasi dengan mode "double" untuk aksi berbahaya:
 * user harus mengetik kata kunci lalu klik dua kali.
 */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  keyword,
  onConfirm,
  busy = false,
  variant = 'danger',
}) {
  const [typed, setTyped] = useState('')
  const [step, setStep] = useState(1)

  const reset = () => {
    setTyped('')
    setStep(1)
  }

  const close = () => {
    reset()
    onClose()
  }

  const needsKeyword = Boolean(keyword)
  const ready = !needsKeyword || typed === keyword

  const next = () => {
    if (step === 1) {
      setStep(2)
      return
    }
    onConfirm()
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <p className="text-[15px] text-ink-soft mb-4 leading-relaxed">{message}</p>

      {needsKeyword && step === 1 && (
        <Input
          label={`Ketik "${keyword}" untuk melanjutkan`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={keyword}
          autoFocus
        />
      )}

      <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-5 ${step === 2 ? 'bg-[#ffe9e9]' : 'bg-[#fff6d9]'}`}>
        <Icon
          name={step === 2 ? 'alert' : 'alert'}
          size={18}
          className={step === 2 ? 'text-[#d63a3a]' : 'text-[#c47e00]'}
        />
        <p className={`text-xs font-bold ${step === 2 ? 'text-[#d63a3a]' : 'text-[#c47e00]'}`}>
          {step === 1
            ? 'Aksi ini tidak bisa dibatalkan. Klik lanjut untuk konfirmasi terakhir.'
            : 'Benar-benar yakin? Data akan hilang selamanya.'}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="white" onClick={close}>
          Batal
        </Button>
        <Button
          variant={variant === 'danger' ? 'dangerSolid' : 'primary'}
          onClick={next}
          disabled={!ready || busy}
          loading={busy && step === 2}
          icon={step === 1 ? <Icon name="chevron-right" size={16} /> : <Icon name="trash" size={16} />}
        >
          {step === 1 ? 'Lanjut' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
