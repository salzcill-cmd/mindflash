# PRD.md — MindFlash
### Product Requirements Document
**Website Pembuat Mindmap & Flashcard untuk Pelajar**

| Info | Detail |
|---|---|
| Nama Produk | MindFlash |
| Versi Dokumen | 1.0 |
| Tanggal | 16 Agustus 2026 |
| Tech Stack | React.js + Tailwind CSS + Supabase |
| Target Pembaca PRD | Programmer pemula & pelajar SMP (harus bisa dipahami tanpa pengalaman coding tinggi) |
| Target Pengguna Akhir | Pelajar SMP, SMA, dan Mahasiswa |

---

## 1. Ringkasan Produk (Executive Summary)

MindFlash adalah website tempat pelajar bisa membuat **mindmap** (peta pikiran) dan **flashcard** (kartu hafalan) secara online, gratis, cepat, dan menyenangkan. Tanpa fitur AI — semua dibuat manual oleh user sendiri, supaya proses belajarnya benar-benar melatih otak, bukan cuma "generate" instan.

Website ini harus terasa **premium, colorful, penuh animasi halus**, tapi tetap **ringan dan gampang dipakai** bahkan oleh anak SMP yang baru pertama kali pakai tools produktivitas digital.

### 1.1 Masalah yang Diselesaikan
- Pelajar sering mencatat dengan cara membosankan (teks panjang, tidak ada visual).
- Tools mindmap yang ada sekarang (Xmind, Miro, dll) terlalu rumit / berbayar / bahasa Inggris semua / tidak dirancang untuk pelajar.
- Tools flashcard yang ada (Quizlet, Anki) tampilannya jadul atau berbayar untuk fitur penting.
- Belum ada satu tempat yang menggabungkan mindmap + flashcard + belajar hafalan pintar dalam satu web yang enak dipakai dan gratis.

### 1.2 Tujuan Produk
1. Pelajar bisa membuat mindmap dengan drag & drop semudah main game.
2. Pelajar bisa membuat flashcard dan belajar pakai sistem hafalan pintar (spaced repetition).
3. Semua data tersimpan aman di akun (Supabase), bisa diakses dari device manapun.
4. Bisa dipakai tanpa daftar akun (guest mode) untuk mencoba dulu.
5. Bisa share hasil kerja lewat link ke teman/guru (read-only).
6. Tampilan harus terlihat premium & profesional — bukan template AI generik ("anti AI slop").

---

## 2. Target Pengguna & Persona

### Persona 1 — "Rani, 14 tahun, siswa SMP kelas 8"
Suka belajar visual, sering pakai HP untuk belajar, mudah bosan kalau tampilan jelek. Butuh cara cepat bikin catatan sebelum ulangan.

### Persona 2 — "Bima, 17 tahun, siswa SMA kelas 11"
Sedang persiapan ujian, butuh hafalan rumus dan istilah banyak. Butuh flashcard dengan sistem pengulangan supaya hafalan tidak gampang lupa.

### Persona 3 — "Pak Doni, guru SMP"
Ingin membagikan mindmap materi pelajaran ke murid-muridnya lewat link, tanpa murid harus daftar akun dulu.

---

## 3. Prinsip Desain & Aturan Wajib

Poin ini WAJIB dipatuhi oleh developer yang mengerjakan, karena ini pembeda utama produk:

- ❌ **Dilarang** tampilan generik/template AI (jangan cuma "card putih + shadow tipis + font default" tanpa karakter).
- ✅ **Wajib** ada identitas visual sendiri: palet warna colorful yang konsisten, tipografi yang punya karakter, ilustrasi/ikon custom-feel.
- ✅ **Wajib** ada animasi halus di hampir semua interaksi: hover, klik, transisi halaman, drag node, flip kartu, loading state (bukan animasi berlebihan yang bikin lag).
- ✅ **Wajib** responsif sempurna: HP kecil, tablet, laptop, layar besar.
- ✅ **Wajib** terasa cepat & ringan meski penuh efek (pakai animasi CSS/GPU-friendly, hindari animasi berat di elemen banyak).
- ✅ Tema: **Light mode saja**, dengan palet warna cerah/colorful (bukan monoton putih-hitam).
- ✅ Aksesibilitas dasar: kontras warna cukup terbaca, ukuran tombol cukup besar untuk disentuh di HP.

### 3.1 Rekomendasi Arahan Visual (boleh disesuaikan tim desain)
- Warna utama: kombinasi warna cerah seperti ungu-indigo, pink/koral, kuning-oranye sebagai aksen (skema "playful but professional").
- Font: 1 font untuk judul yang punya karakter (rounded/friendly), 1 font untuk isi yang mudah dibaca.
- Elemen dekoratif: blob/shape organik warna-warni di background, bukan gradient generik AI.
- Micro-interaction di setiap tombol (scale, bounce halus, ripple).

---

## 4. Tech Stack & Arsitektur

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend Framework | React.js (Vite) | Component-based, cepat untuk development |
| Styling | Tailwind CSS | Utility-first, gampang dipahami pemula |
| Animasi | Framer Motion (atau library animasi React) | Untuk transisi halus & drag interaction |
| Canvas Mindmap | React Flow (library mindmap/node-based) | Sudah menyediakan drag-node, connect-line, zoom/pan siap pakai |
| Backend & Database | Supabase (PostgreSQL) | Database, Auth, Storage, Realtime dalam satu layanan |
| Autentikasi | Supabase Auth (Email/Password + Google OAuth) | Termasuk mendukung guest mode |
| Storage File | Supabase Storage | Untuk avatar profil / gambar tambahan di mindmap (opsional) |
| Hosting Frontend | Vercel / Netlify | Gratis, cocok untuk React app |
| State Management | React Context / Zustand | Ringan, gampang dipahami pemula dibanding Redux |

### 4.1 Kenapa Pilihan Ini Ramah Pemula?
- **Supabase** = seperti Firebase tapi pakai SQL, dan gratis untuk skala kecil-menengah. Dashboard-nya visual, gampang dipahami murid SMP sekalipun untuk lihat tabel data.
- **React Flow** = sudah menyediakan sistem drag & drop node + garis penghubung otomatis, developer tidak perlu bikin fisika drag sendiri dari nol.
- **Tailwind CSS** = tidak perlu nulis CSS manual banyak-banyak, tinggal pakai class siap pakai.

---

## 5. Struktur Halaman (Sitemap)

```
1. Landing Page (/)
2. Login / Register (/auth)
3. Dashboard (/dashboard)
4. Mindmap Editor (/mindmap/:id)
5. Flashcard Editor (/flashcard/:id)
6. Mode Belajar Flashcard (/flashcard/:id/study)
7. Halaman Share (Public View) (/share/:type/:id)
8. Profil & Pengaturan (/settings)
9. Halaman 404
```

---

## 6. Fitur Utama & User Flow

### 6.1 Autentikasi (Login System)
**Fitur:**
- Daftar/Login pakai Email + Password.
- Login pakai Google (1-klik).
- **Guest Mode**: user bisa langsung coba bikin mindmap/flashcard tanpa akun. Data guest disimpan sementara di local browser (localStorage), dengan banner "Daftar sekarang supaya datamu tidak hilang!" agar mereka terdorong membuat akun untuk simpan permanen ke Supabase.
- Saat guest mendaftar, data lokal otomatis dipindahkan (migrasi) ke akun Supabase mereka.

**User Flow:**
1. User buka website → pilih "Coba Gratis" (guest) atau "Daftar/Masuk".
2. Jika guest → langsung ke Dashboard dengan data kosong + banner ajakan daftar.
3. Jika daftar/masuk → verifikasi via Supabase Auth → redirect ke Dashboard.

---

### 6.2 Dashboard
**Fitur:**
- Menampilkan semua mindmap & flashcard milik user dalam bentuk grid card yang colorful, dengan thumbnail preview.
- Tab pemisah: "Semua", "Mindmap", "Flashcard".
- Tombol besar "+ Buat Mindmap Baru" dan "+ Buat Flashcard Baru".
- Search bar untuk cari judul.
- Setiap card ada menu: Buka, Rename, Duplikat, Share, Hapus.
- Animasi masuk (fade+slide) saat card muncul, hover effect saat disentuh mouse.

---

### 6.3 Mindmap Editor
Ini fitur inti pertama. Wajib support **2 mode**:

**Mode 1 — Freeform (Bebas)**
- Node bisa diletakkan di mana saja di canvas, digeser bebas (drag & drop).
- User klik "+" untuk buat node baru, tarik garis dari satu node ke node lain untuk menghubungkan.
- Bisa zoom in/out dan geser canvas (pan).

**Mode 2 — Auto-Layout (Struktur Rapi/Tree)**
- Node otomatis tersusun rapi dari node utama ke cabang-cabangnya (top-down atau left-right).
- Cocok untuk mindmap yang butuh hierarki jelas (misal: struktur Bab → Sub Bab → Poin).
- User tetap bisa tambah/hapus node, tapi posisi diatur otomatis oleh sistem.

**Fitur tambahan editor:**
- Setiap node bisa diberi warna berbeda (palet warna colorful yang sudah disediakan, tidak perlu color-picker rumit untuk pemula).
- Setiap node bisa diberi ikon/emoji kecil.
- Bisa ubah bentuk garis penghubung (lurus/lengkung).
- Undo/Redo.
- Auto-save ke Supabase setiap beberapa detik setelah perubahan (dengan indikator kecil "Tersimpan ✓").
- Tombol "Export sebagai gambar (PNG)" untuk didownload/dicetak.
- Tombol Share (lihat bagian 6.6).

---

### 6.4 Flashcard Editor
**Fitur:**
- User buat "Deck" (kumpulan kartu) dengan judul & warna cover.
- Di dalam deck, user tambah kartu satu per satu: sisi depan (pertanyaan/istilah) & sisi belakang (jawaban/penjelasan).
- Bisa tambah gambar ke kartu (opsional, via Supabase Storage).
- Preview kartu dengan animasi **flip 3D** saat diklik (efek membalik kartu asli).
- Bisa reorder kartu (drag urutan).
- Auto-save ke Supabase.

---

### 6.5 Mode Belajar Flashcard (Study Mode)
Wajib mendukung **2 mode belajar**:

**Mode 1 — Simpel (Flip Mode)**
- Kartu ditampilkan satu-satu, user klik untuk membalik lihat jawaban.
- Tombol "Kartu Berikutnya" / "Sebelumnya".
- Cocok untuk review cepat.

**Mode 2 — Hafalan Pintar (Spaced Repetition)**
- Setelah lihat jawaban, user menilai diri sendiri: "Belum Hafal" / "Ragu-ragu" / "Sudah Hafal".
- Sistem otomatis mengatur kapan kartu itu akan muncul lagi (kartu yang "Belum Hafal" akan lebih sering muncul, yang "Sudah Hafal" jarang muncul).
- Sistem sederhana ala algoritma **SM-2 (dasar dari Anki)**, dijelaskan simpel di dokumentasi teknis (lihat bagian 8).
- Ada statistik kecil: berapa persen kartu sudah dikuasai, streak belajar harian.

---

### 6.6 Fitur Share (Bagikan Link)
- Setiap mindmap/flashcard punya tombol "Share".
- Sistem generate link unik publik, contoh: `mindflash.app/share/mindmap/abc123`.
- Orang yang buka link **tidak perlu login**, hanya bisa **melihat (read-only)** — tidak bisa edit.
- Pemilik bisa nonaktifkan link kapan saja (toggle "Matikan Link Share").

---

### 6.7 Profil & Pengaturan
- Ubah nama, foto profil.
- Ubah password (jika daftar via email).
- Logout.
- Hapus akun (dengan konfirmasi ganda, karena berbahaya/tidak bisa dibatalkan).

---

## 7. Struktur Database (Supabase / PostgreSQL)

Penjelasan sederhana: anggap tiap tabel seperti "kotak penyimpanan" data yang saling berhubungan.

### Tabel `profiles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | sama dengan id user dari Supabase Auth |
| full_name | text | nama user |
| avatar_url | text | link foto profil |
| created_at | timestamp | kapan akun dibuat |

### Tabel `mindmaps`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | id unik mindmap |
| user_id | uuid (FK → profiles.id) | pemilik |
| title | text | judul mindmap |
| mode | text | 'freeform' atau 'auto-layout' |
| data | jsonb | isi node & garis (disimpan sebagai JSON) |
| is_public | boolean | status share aktif/tidak |
| created_at | timestamp | |
| updated_at | timestamp | |

### Tabel `flashcard_decks`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | id unik deck |
| user_id | uuid (FK) | pemilik |
| title | text | judul deck |
| color | text | warna cover deck |
| is_public | boolean | status share |
| created_at | timestamp | |

### Tabel `flashcards`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | id unik kartu |
| deck_id | uuid (FK → flashcard_decks.id) | milik deck mana |
| front_text | text | sisi depan |
| back_text | text | sisi belakang |
| image_url | text (nullable) | gambar opsional |
| order_index | int | urutan kartu |

### Tabel `flashcard_progress`
Menyimpan progres belajar tiap kartu per user (untuk sistem spaced repetition).
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| flashcard_id | uuid (FK) | |
| ease_factor | float | seberapa "gampang" kartu ini diingat (algoritma SM-2) |
| interval_days | int | berapa hari lagi kartu ini muncul kembali |
| next_review_at | timestamp | tanggal kartu ini harus direview lagi |
| last_reviewed_at | timestamp | |

> **Catatan Keamanan:** Wajib aktifkan **Row Level Security (RLS)** di Supabase untuk semua tabel, supaya user A tidak bisa lihat/edit data milik user B. Aturan dasar: `user_id = auth.uid()`. Untuk data yang `is_public = true`, buat policy khusus supaya bisa dibaca publik tanpa login.

---

## 8. Penjelasan Sederhana Algoritma Spaced Repetition (untuk Programmer Pemula)

Supaya pelajar SMP/programmer pemula paham cara kerjanya:

1. Setiap kartu punya nilai **"ease_factor"** (mulai dari 2.5) dan **"interval_days"** (mulai dari 1 hari).
2. Setiap user selesai lihat jawaban, mereka pilih:
   - **"Belum Hafal"** → interval_days di-reset ke 1 (kartu muncul lagi besok).
   - **"Ragu-ragu"** → interval_days dikali sedikit (misal x1.2), ease_factor dikurangi sedikit.
   - **"Sudah Hafal"** → interval_days dikali ease_factor (kartu makin jarang muncul).
3. `next_review_at` = tanggal sekarang + interval_days.
4. Saat masuk mode belajar, sistem ambil semua kartu yang `next_review_at <= hari ini`, itu yang ditampilkan duluan.

Ini adalah versi sederhana dari algoritma SM-2 yang dipakai Anki — cukup untuk MVP, tidak perlu rumus rumit dulu.

---

## 9. Non-Functional Requirements

| Aspek | Target |
|---|---|
| Kecepatan Loading | Halaman utama < 2 detik di koneksi 4G |
| Responsif | Sempurna di layar 360px (HP kecil) sampai 1920px (desktop) |
| Auto-save | Maksimal delay 3 detik setelah perubahan terakhir |
| Keamanan | Row Level Security aktif di semua tabel Supabase |
| Browser Support | Chrome, Firefox, Safari, Edge versi terbaru |
| Aksesibilitas | Kontras warna WCAG AA minimum, ukuran tombol sentuh minimal 44x44px |

---

## 10. Roadmap Pengembangan (MVP → Lanjutan)

### Fase 1 — MVP (Wajib Ada)
- Auth (Email/Google/Guest)
- Dashboard dasar
- Mindmap Editor mode Freeform
- Flashcard Editor + Study Mode Simpel
- Auto-save ke Supabase

### Fase 2 — Penyempurnaan
- Mindmap mode Auto-Layout
- Study Mode Spaced Repetition + statistik
- Fitur Share link (read-only)
- Export mindmap ke PNG

### Fase 3 — Polish & Wow Factor
- Animasi & micro-interaction penuh di semua halaman
- Custom warna/ikon node lebih lengkap
- Statistik belajar (streak, grafik progres)
- Optimasi performa & mobile experience

---

## 11. Kriteria Sukses (Definition of Done)

Produk dianggap selesai dan berhasil jika:
- [ ] User bisa daftar/login/guest tanpa error.
- [ ] User bisa membuat, mengedit, drag, dan menghapus node mindmap dengan lancar di kedua mode.
- [ ] User bisa membuat deck & kartu flashcard, dan belajar dengan kedua mode study.
- [ ] Semua data tersimpan otomatis dan tidak hilang saat refresh/pindah device.
- [ ] Link share berfungsi dan bisa dibuka tanpa login (read-only).
- [ ] Tampilan responsif sempurna di HP, tablet, dan desktop.
- [ ] Animasi terasa halus, tidak patah-patah/lag.
- [ ] Tidak ada tampilan yang terlihat seperti template AI generik — punya identitas visual sendiri.

---

*Dokumen ini adalah acuan utama pengembangan MindFlash. Setiap perubahan scope besar sebaiknya didiskusikan ulang dan didokumentasikan di sini.*
