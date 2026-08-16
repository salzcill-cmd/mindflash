import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Icon } from '../components/Icons'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuthStore } from '../store/auth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { updateProfile, deleteAllUserData } from '../lib/storage'
import { toast } from '../store/toast'

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login', { replace: true })
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullName(profile?.full_name ?? '')
    setAvatarUrl(profile?.avatar_url ?? '')
  }, [user, profile, navigate])

  if (!user) return null

  const isEmailUser = Boolean(user.email) && !user.app_metadata?.provider?.startsWith?.('google')

  const saveProfile = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Nama tidak boleh kosong.')
      return
    }
    setSaving(true)
    try {
      const updated = await updateProfile({ full_name: fullName.trim(), avatar_url: avatarUrl || null })
      setProfile(updated)
      toast.success('Profil tersimpan! ✅')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isSupabaseConfigured) {
      toast.error('Supabase belum dikonfigurasi.')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const path = `${user.id}/avatar-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) {
        if (error.message.toLowerCase().includes('bucket')) {
          toast.error('Bucket "avatars" belum dibuat di Supabase. Pakai link gambar saja ya.')
        } else {
          throw error
        }
      } else {
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
        setAvatarUrl(pub.publicUrl)
        toast.success('Foto berhasil diunggah! 📸')
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mengunggah foto.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      toast.error('Supabase belum dikonfigurasi.')
      return
    }
    if (newPw.length < 6) {
      toast.error('Password baru minimal 6 karakter.')
      return
    }
    if (newPw !== confirmPw) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }
    setPwBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success('Password berhasil diganti! 🔐')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(err.message || 'Gagal mengganti password.')
    } finally {
      setPwBusy(false)
    }
  }

  const deleteAccount = async () => {
    setDeleteBusy(true)
    try {
      await deleteAllUserData()
      if (supabase) await supabase.auth.signOut()
      useAuthStore.getState().reset()
      toast.info('Akun dan semua datamu telah dihapus. Semoga sukses! 🌱')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus akun.')
      setDeleteBusy(false)
    }
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    useAuthStore.getState().reset()
    navigate('/')
  }

  return (
    <PageTransition>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-20 min-h-[calc(100vh-68px)]">
        <h1 className="text-3xl sm:text-[36px] font-extrabold mb-1">Pengaturan Akun ⚙️</h1>
        <p className="text-ink-soft mb-8">Kelola profil, keamanan, dan akunmu.</p>

        <div className="space-y-6">
          {/* ===== Profil ===== */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-3xl border-[1.5px] border-line shadow-[0_14px_40px_-20px_rgba(43,35,80,0.25)] p-6"
          >
            <h2 className="font-extrabold text-lg mb-5 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Icon name="user" size={18} />
              </span>
              Profil
            </h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto profil"
                    className="w-20 h-20 rounded-3xl object-cover border-[2.5px] border-brand/30 shadow-[0_10px_24px_-10px_rgba(124,92,252,0.5)]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand to-pink text-white flex items-center justify-center text-2xl font-extrabold shadow-[0_10px_24px_-10px_rgba(124,92,252,0.5)]">
                    {(fullName || 'G')[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="white"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    loading={uploading}
                    icon={<Icon name="upload" size={14} />}
                  >
                    Unggah Foto
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                  <span className="text-xs text-ink-faint font-bold">JPG/PNG · opsional</span>
                </div>
              </div>
              <Input label="Nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input
                label="Link foto profil (opsional)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                hint="Atau tempel link gambar langsung di sini."
              />
              <div className="flex justify-end">
                <Button type="submit" loading={saving} icon={<Icon name="check" size={16} />}>
                  Simpan Profil
                </Button>
              </div>
            </form>
          </motion.section>

          {/* ===== Keamanan ===== */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-surface rounded-3xl border-[1.5px] border-line shadow-[0_14px_40px_-20px_rgba(43,35,80,0.25)] p-6"
          >
            <h2 className="font-extrabold text-lg mb-5 flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#e7f0ff] text-[#2f6fe0] flex items-center justify-center">
                <Icon name="lock" size={18} />
              </span>
              Keamanan
            </h2>
            {isEmailUser ? (
              <form onSubmit={changePassword} className="space-y-4">
                <Input
                  type="password"
                  label="Password saat ini"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    type="password"
                    label="Password baru"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Input
                    type="password"
                    label="Ulangi password baru"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="soft" loading={pwBusy} icon={<Icon name="lock" size={16} />}>
                    Ganti Password
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-ink-soft rounded-2xl bg-surface-2 px-4 py-3.5">
                Kamu masuk dengan Google, jadi password tidak perlu diganti. 🤝
              </p>
            )}
          </motion.section>

          {/* ===== Sesi & Akun ===== */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-surface rounded-3xl border-[1.5px] border-line shadow-[0_14px_40px_-20px_rgba(43,35,80,0.25)] p-6 space-y-4"
          >
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#ffeaf4] text-[#c92f78] flex items-center justify-center">
                <Icon name="shield" size={18} />
              </span>
              Sesi & Akun
            </h2>
            <p className="text-sm text-ink-soft -mt-2">
              Masuk sebagai <b className="text-ink">{user.email}</b>
            </p>
            <Button variant="white" onClick={logout} icon={<Icon name="logout" size={16} />}>
              Keluar dari Akun
            </Button>
            <div className="pt-3 border-t-[1.5px] border-line">
              <p className="text-sm font-extrabold text-[#d63a3a] mb-2">Zona berbahaya 🚨</p>
              <Button variant="dangerSolid" onClick={() => setDeleteOpen(true)} icon={<Icon name="trash" size={16} />}>
                Hapus Akun & Semua Data
              </Button>
            </div>
          </motion.section>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus akun selamanya?"
        message="Semua mindmap, deck, kartu, dan progres belajarmu akan dihapus permanen. Aksi ini tidak bisa dibatalkan."
        keyword="HAPUS"
        confirmLabel="Hapus Akun Saya"
        onConfirm={deleteAccount}
        busy={deleteBusy}
      />
    </PageTransition>
  )
}
