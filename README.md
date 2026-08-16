# 🧠 MindFlash

**Website pembuat Mindmap & Flashcard untuk pelajar** — React + Vite + Tailwind CSS + Supabase.

Buat peta pikiran dengan drag & drop, ubah jadi flashcard, lalu hafalkan dengan sistem
**spaced repetition (SM-2)**. Gratis, colorful, dan didesain khusus agar enak dipakai pelajar SMP
sampai mahasiswa — tanpa tampilan template AI generik.

> Spesifikasi lengkap produk ada di [`PRD.md`](./PRD.md).

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 🔐 Autentikasi | Email/password (+ **lupa password** via email, toggle lihat password), Google (1-klik), dan **guest mode** (tanpa akun, data di localStorage) |
| 🗺️ Mindmap Editor | Drag & drop node, koneksi antar node, 2 mode (**Freeform** & **Auto-Layout**), warna & ikon node, undo/redo, **duplikat node**, garis lurus/lengkung, double-click edit, fit view, panel pintasan keyboard, export **PNG** |
| ✨ Konversi 1-klik | **Mindmap → Flashcard**: setiap cabang otomatis jadi kartu tanya-jawab |
| 🗂️ Template Mindmap | Mulai cepat dari template: Peta Konsep, Rencana Belajar, Rumus & Formula, Daftar Tugas, Struktur Bab |
| 📊 Dashboard | Statistik ringkas, **ring penguasaan deck** (persen dikuasai), sorting, **undo hapus** (tombol "Batalkan" di toast) |
| 🃏 Flashcard Editor | Deck berwarna, kartu tanya-jawab + gambar, preview **flip 3D**, reorder (drag), search, duplikat kartu, **export & import JSON** |
| 🧠 Study Mode | **Hafalan Pintar** (SM-2), **Simpel** (flip), dan **Kuis Pilihan Ganda** (soal otomatis + skor), **daftar kartu** (overview + lompat ke kartu), dukungan gambar, acak urutan, replay kartu belum hafal, statistik & reset progres |
| 🔗 Share Link | Link publik unik `…/share/:type/:id`, **read-only**, tombol salin link, bisa dimatikan kapan saja |
| 💾 Auto-save | Simpan otomatis ke Supabase (delay ±2 detik) dengan indikator "Tersimpan ✓" |
| 👤 Pengaturan | Ubah nama/foto profil, ganti password, logout, hapus akun (konfirmasi ganda) |
| 📱 Desain | **Light & dark mode** (toggle di navbar, ikut preferensi sistem), palet colorful, animasi halus & micro-interaction, responsif 360px–1920px |
| 📲 PWA | Bisa **diinstall di HP** (Add to Home Screen) dan **buka offline** via service worker |

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependensi
pnpm install

# 2. (Opsional) Konfigurasi Supabase — salin lalu isi
cp .env.example .env
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 3. Jalankan dev server
pnpm dev
# buka http://localhost:5173
```

Tanpa `.env`, aplikasi **tetap berjalan penuh dalam mode guest** (data tersimpan di browser).
Aktifkan Supabase agar data tersimpan permanen lintas device.

### Perintah lain

```bash
pnpm build    # build produksi ke dist/
pnpm preview  # pratinjau build produksi
pnpm lint     # cek ESLint
pnpm test     # jalankan unit test (Vitest)
node scripts/gen-icons.mjs  # regenerate ikon PWA (bila mengubah desain)
```

> **PWA**: manifest + service worker aktif otomatis di build produksi
> (`public/manifest.webmanifest`, `public/sw.js`). Setelah diinstall, MindFlash bisa
> dibuka offline — shell aplikasi, aset JS/CSS, dan font di-cache otomatis.

---

## 🗄️ Setup Supabase

1. Buat project di [supabase.com](https://supabase.com) (paket gratis cukup).
2. Buka **SQL Editor** → jalankan seluruh isi [`supabase/schema.sql`](./supabase/schema.sql).
   Skema ini membuat tabel `profiles`, `mindmaps`, `flashcard_decks`, `flashcards`,
   `flashcard_progress`, lengkap dengan **Row Level Security (RLS)** — user hanya bisa
   membaca/mengedit datanya sendiri, dan data `is_public = true` bisa dibaca publik tanpa login.
3. Buka **Settings → API**, salin *Project URL* & *anon public key* ke `.env`.
4. (Opsional) **Google OAuth**: Dashboard → Authentication → Providers → aktifkan Google,
   tambahkan redirect URL `http://localhost:5173/dashboard`.
5. (Opsional) **Avatar upload**: bucket `avatars` sudah dibuat otomatis oleh skema.

> Catatan hapus akun penuh: menghapus akun dari aplikasi menghapus seluruh data user
> (via foreign key cascade). Untuk menghapus user Auth-nya juga, deploy Edge Function
> `delete-account` — contoh lengkap ada di bagian bawah `supabase/schema.sql`.

---

## 📁 Struktur Folder

```
├── PRD.md                      # Spesifikasi produk (acuan utama)
├── supabase/
│   ├── schema.sql              # Skema DB + RLS + trigger + storage (siap jalankan)
│   └── functions/              # (contoh) Edge function hapus akun
├── .env.example                # Template konfigurasi Supabase
└── src/
    ├── main.jsx                # Entry: BrowserRouter + global CSS
    ├── App.jsx                 # Router + AuthProvider (sesi & migrasi guest) + code-splitting
    ├── index.css               # Design system: Tailwind v4 theme, palet, animasi, flip 3D
    ├── lib/
    │   ├── supabase.js         # Client Supabase (aman bila env kosong)
    │   ├── storage.js          # Lapisan data: Supabase ↔ guest localStorage (transparan)
    │   ├── sm2.js              # Algoritma spaced repetition SM-2 sederhana
    │   ├── layout.js           # Algoritma auto-layout pohon (top-down / left-right)
    │   ├── exportPng.js        # Export kanvas mindmap ke PNG
    │   ├── constants.js        # Palet node, ikon, warna deck, konstanta
    │   └── streak.js           # Streak belajar harian (localStorage)
    ├── store/
    │   ├── auth.js             # Zustand: user + profil
    │   ├── guest.js            # Zustand persist: data guest di localStorage
    │   └── toast.js            # Notifikasi toast
    ├── components/
    │   ├── ui/                 # Button, Input, Modal, Logo, EmptyState, Toast, Spinner
    │   ├── Navbar.jsx  Footer.jsx  Blobs.jsx
    │   ├── Icons.jsx           # Set ikon custom (identitas visual)
    │   ├── FlipCard.jsx        # Kartu flip 3D (editor/study/share)
    │   ├── ShareModal.jsx  ConfirmDialog.jsx  PageTransition.jsx
    └── pages/
        ├── Landing.jsx         # /          — hero, fitur, cara kerja, testimoni
        ├── Auth.jsx            # /auth      — login/register + Google + guest
        ├── Dashboard.jsx       # /dashboard — grid card + tabs + search + menu aksi
        ├── MindmapEditor.jsx   # /mindmap/:id — React Flow, 2 mode, undo/redo, PNG
        ├── FlashcardEditor.jsx # /flashcard/:id — deck, kartu, flip 3D, reorder
        ├── Study.jsx           # /flashcard/:id/study — simpel & spaced repetition
        ├── Share.jsx           # /share/:type/:id — tampilan publik read-only
        ├── Settings.jsx        # /settings — profil, password, hapus akun
        └── NotFound.jsx        # 404
```

---

## 🧠 Algoritma Spaced Repetition (SM-2 sederhana)

Setiap kartu punya `ease_factor` (mulai 2.5) dan `interval_days` (mulai 1). Saat review:

- **Belum Hafal** → `interval_days` di-reset ke **1** (muncul besok), ease kembali 2.5
- **Ragu-ragu** → `interval_days` × **1.2**, ease dikurangi sedikit
- **Sudah Hafal** → `interval_days` × `ease_factor` (makin jarang muncul), ease naik sedikit

`next_review_at = sekarang + interval_days`. Saat masuk Study Mode → Spaced Repetition,
hanya kartu dengan `next_review_at <= hari ini` yang ditampilkan duluan.

---

## 🗺️ Sitemap

```
/                         Landing Page
/auth                     Login / Register (+ guest mode)
/dashboard                Dashboard
/mindmap/:id              Mindmap Editor
/flashcard/:id            Flashcard Editor
/flashcard/:id/study      Mode Belajar (Simpel & Spaced Repetition)
/share/:type/:id          Halaman Share publik (read-only)
/settings                 Profil & Pengaturan
*                         404
```

---

Dibuat dengan 💜 untuk pelajar Indonesia.
