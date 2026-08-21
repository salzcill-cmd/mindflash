import { memo, useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { Icon } from './Icons'
import { toast } from '../store/toast'

const ShareModal = memo(function ShareModal({ open, onClose, type, id, isPublic, onTogglePublic, title }) {
  const [busy, setBusy] = useState(false)
  const shareUrl = `${window.location.origin}/share/${type}/${id}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link share disalin! 📋')
    } catch {
      toast.error('Gagal menyalin, salin manual ya.')
    }
  }

  const toggle = async () => {
    setBusy(true)
    try {
      await onTogglePublic(!isPublic)
      toast.success(isPublic ? 'Link share dimatikan.' : 'Link share diaktifkan! 🎉')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bagikan Link">
      <p className="text-sm text-ink-soft mb-3">
        Bagikan <b className="text-ink">{title}</b> ke teman atau guru. Mereka bisa melihat tanpa
        login — tapi tidak bisa mengedit.
      </p>

      <div className="flex items-stretch gap-2 mb-4">
        <div className="flex-1 min-w-0 bg-surface border-[1.5px] border-line rounded-xl px-3.5 py-2.5 flex items-center gap-2">
          <Icon name="link" size={16} className="text-brand shrink-0" />
          <span className="text-sm font-bold text-ink truncate">{shareUrl}</span>
        </div>
        <Button variant="white" size="md" onClick={copy} icon={<Icon name="copy" size={16} />}>
          Salin
        </Button>
      </div>

      <button
        onClick={toggle}
        disabled={busy}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface border-[1.5px] border-line hover:border-brand transition-colors"
      >
        <span className="flex items-center gap-3">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isPublic ? 'bg-[#e1faf5] text-[#0e9e92]' : 'bg-surface-2 text-ink-faint'
            }`}
          >
            <Icon name={isPublic ? 'eye' : 'eye-off'} size={20} />
          </span>
          <span className="text-left">
            <span className="block text-sm font-extrabold text-ink">
              {isPublic ? 'Link aktif' : 'Link nonaktif'}
            </span>
            <span className="block text-xs text-ink-soft">
              {isPublic
                ? 'Siapa pun dengan link bisa melihat'
                : 'Matikan link kapan saja; orang tak bisa membukanya'}
            </span>
          </span>
        </span>
        <span
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isPublic ? 'bg-mint' : 'bg-[#d9d2ea]'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </span>
      </button>

      <div className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-xs text-brand-deep font-bold flex gap-2">
        <Icon name="spark" size={16} className="shrink-0 mt-0.5" />
        <span>
          Hanya pemilik yang bisa mengubah data. Pengunjung link hanya melihat versi read-only.
        </span>
      </div>
    </Modal>
  )
})

export default ShareModal
