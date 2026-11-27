# KRL Density — Sistem Informasi Kepadatan Gerbong & Jadwal KRL Yogyakarta–Solo

> **[🌐 Buka Demo GitHub Pages →](https://username.github.io/krl-density)**  
> *(Ganti `username` dengan username GitHub Anda setelah deployment)*

[![Static Site](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)
[![Zero Dependency](https://img.shields.io/badge/Dependency-None-green)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![License](https://img.shields.io/badge/Tipe-Prototipe%20Akademik-orange)](LICENSE)

---

## 📋 Deskripsi Proyek

**KRL Density** adalah aplikasi web prototipe (*static website*) yang bertujuan membantu penumpang KRL Commuter Line Yogyakarta–Solo untuk:

1. **Mencari jadwal perjalanan KRL** berdasarkan stasiun asal dan stasiun tujuan pilihan.
2. **Melihat estimasi tingkat kepadatan setiap gerbong** (K1–K6) secara visual dengan sistem kode warna.
3. **Mendapatkan rekomendasi gerbong terbaik** (kepadatan terendah) untuk meratakan distribusi penumpang.
4. **Memilih perjalanan spesifik** dan langsung melihat profil kepadatan gerbong perjalanan tersebut.

Selain antarmuka publik untuk penumpang, proyek ini juga menyertakan **Dashboard Petugas / Admin** untuk mengelola data jadwal perjalanan.

> ⚠️ **PENTING — DATA SIMULASI:**  
> Seluruh data jadwal KRL, nomor kereta, waktu tempuh, jumlah penumpang, dan tingkat kepadatan gerbong dalam aplikasi ini adalah **data simulasi / sintetis** untuk keperluan demonstrasi dan tugas akademik. Aplikasi ini **tidak terhubung** ke sistem informasi resmi PT KAI Commuter atau sensor operasional nyata.

---

## ✨ Fitur

### Halaman Penumpang (Publik - Terinspirasi Access by KAI)
- 🔍 **Pencarian Stasiun Interaktif** – Autocomplete cerdas berdasarkan nama stasiun maupun kode stasiun resmi (contoh: `YK`, `LPN`, `SLO`, `PL`).
- ⚡ **Rute Cepat Langsung (Quick Routes)** – Kartu rute instan Commuter Line dari stasiun asal yang dipilih (contoh: `LEMPUYANGAN → PALUR`).
- 🔄 **Tombol Swap Arah** – Tukar stasiun asal dan stasiun tujuan dalam satu klik dengan indikator arah dinamis.
- ⏱️ **Pengaturan Jadwal (Schedule Filter)** – Modal filter fleksibel dengan 3 mode:
  - **Next Hour (1 Jam Berikutnya):** Menampilkan kereta yang berangkat dalam 60 menit ke depan secara dinamis.
  - **Today (Hari Ini):** Menampilkan seluruh jadwal perjalanan sepanjang hari ini (00:00 - 23:59).
  - **Set Your Own Schedule:** Pengguna dapat menentukan sendiri jam keberangkatan mulai (*From*) dan selesai (*Until*).
- 📋 **Daftar Kartu Jadwal Modern** – Kartu kereta dengan kode KA (`#701`, `#711`), nama Commuter Line, jam berangkat & tiba, durasi perjalanan, serta badge tingkat kepadatan.
- 🗺️ **Visualisasi Rute Kereta Vertikal (Fitur Utama)** – Modal visualisasi timeline vertikal terinspirasi antarmuka Access by KAI:
  - Menampilkan seluruh stasiun pemberhentian dari stasiun awal kereta hingga stasiun akhir.
  - Kartu penanda khusus **"Anda Berangkat dari Sini (You Are Here)"** pada stasiun asal pengguna.
  - Kartu penanda khusus stasiun tujuan pengguna.
  - Status stasiun transit antarmoda (`• Transit`) dan stasiun bandara (`✈️ Bandara`).
  - Estimasi waktu tiba/berangkat pada setiap stasiun.
  - Tombol **"Pilih Perjalanan Ini"** langsung dari jendela rute.
- 🚆 **Integrasi Kepadatan Gerbong** – Memilih perjalanan langsung memperbarui profil kepadatan 6 gerbong dan rekomendasi gerbong terbaik.
- 📊 **Visualisasi 6 Kartu Gerbong** – Urut dari kepadatan terendah ke tertinggi (K1–K6).
- 🎨 **Kode Warna Kepadatan** – Hijau (Rendah ≤50%), Kuning (Sedang 50–80%), Merah (Tinggi >80%).
- ⭐ **Rekomendasi Gerbong Terbaik** – Kartu rekomendasi otomatis dengan urutan lengkap dan tie-break K1–K6.
- ⚠️ **Banner Peringatan** – Peringatan otomatis saat semua gerbong padat atau ada gerbong yang melebihi kapasitas (over-capacity).

### Dashboard Petugas / Admin (Login Diperlukan)
- 🔐 **Login Simulasi** – Autentikasi demo berbasis browser dengan username dan password
- 🚪 **Logout** – Tombol keluar sesi di dashboard
- 📋 **Lihat Daftar Jadwal** – Tabel lengkap seluruh jadwal KRL
- ➕ **Tambah Jadwal** – Modal form untuk menambahkan jadwal baru
- ✏️ **Ubah Jadwal** – Modal edit data jadwal yang sudah ada
- 🗑️ **Hapus Jadwal** – Hapus dengan dialog konfirmasi eksplisit
- ↺ **Reset ke Data Default** – Kembalikan preset jadwal simulasi awal
- ⚙️ **Panel Mesin Simulasi** – Kontrol mesin simulasi otomatis skenario Rendah → Sedang → Tinggi dengan telemetri real-time, log transisi, dan snapshot 10 detik

---

## 🗂️ Struktur Direktori

```
krl-density/
├── index.html                # Halaman utama penumpang (Cari Jadwal & Kepadatan Gerbong)
├── admin.html                # Halaman dashboard petugas / admin
├── .gitignore
├── README.md
│
├── admin/
│   └── index.html            # Redirect otomatis dari /admin → admin.html
│
├── css/
│   ├── main.css              # Base layout, disclaimer, header, alert, footer
│   ├── passenger.css         # Kartu gerbong, badge rekomendasi, progress bar kepadatan
│   ├── schedule.css          # Form pencarian jadwal, kartu hasil, timeline rute, empty state
│   ├── officer.css           # Panel telemetri, tombol kontrol simulasi, tabel riwayat
│   └── admin.css             # Halaman login, modal dialog CRUD, tabel admin
│
├── js/
│   ├── app.js                # Controller halaman penumpang & integrasi jadwal-gerbong
│   │
│   ├── config/
│   │   ├── constants.js      # 13 Stasiun, kapasitas, threshold, konfigurasi admin simulasi
│   │   └── presets.js        # Data preset skenario deterministik (Rendah/Sedang/Tinggi)
│   │
│   ├── core/
│   │   ├── calculator.js     # Kalkulasi % kepadatan, klasifikasi kategori, format waktu WIB
│   │   ├── validator.js      # Validasi integritas dataset 6 gerbong
│   │   ├── recommender.js    # Sorting ascending, tie-break K1–K6, guardrail peringatan
│   │   └── auth.js           # Simulasi autentikasi admin (Login, Logout, Session)
│   │
│   ├── engine/
│   │   ├── scheduleStore.js  # Manajemen jadwal KRL: pencarian rute, CRUD, trip aktif
│   │   ├── simulationEngine.js  # Mesin simulasi deterministik otomatis (10 detik/tick)
│   │   └── historyStore.js   # Penyimpanan snapshot 10 detik di LocalStorage
│   │
│   └── ui/
│       ├── adminView.js      # Controller dashboard admin: form login, CRUD, sub-nav
│       ├── simulationView.js # Render telemetri, log transisi, snapshot petugas
│       └── navigation.js     # Navigasi tab SPA (dipertahankan dari versi sebelumnya)
│
└── tests/
    ├── schedule-tests.html   # 21 Kasus uji: Jadwal, Autentikasi Admin, CRUD, Filter KAI, & Rute Vertikal
    ├── core-tests.html       # 21 Kasus uji: Kalkulasi % kepadatan & rekomendasi
    ├── simulation-tests.html # 20 Kasus uji: Mesin simulasi otomatis
    ├── e2e-tests.html        # 18 Kasus uji: End-to-end acceptance PRD v4.1
    └── uji-10-pengguna.html  # Template instrumen uji pengguna (kosong/blank)
```

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Keterangan |
|---|---|
| **HTML5** | Semantic markup, ARIA accessibility attributes |
| **CSS3** | CSS Grid, Flexbox, Custom Properties (CSS Variables) |
| **Vanilla JavaScript** | ES5-compatible, Zero external dependencies |
| **LocalStorage API** | Penyimpanan data jadwal & sesi admin di browser |
| **SessionStorage API** | Penyimpanan sesi login admin |
| **GitHub Pages** | Static site hosting (zero backend required) |

---

## 🚀 Cara Menjalankan Secara Lokal

Karena proyek ini adalah **static website tanpa dependensi**, ada dua cara menjalankannya:

### Cara 1: Buka Langsung di Browser (Termudah)
1. Unduh atau clone repository ini.
2. Buka folder hasil unduhan.
3. Klik dua kali file **`index.html`** → browser akan membuka halaman penumpang.
4. Klik dua kali file **`admin.html`** → browser akan membuka dashboard admin.

> ⚠️ Beberapa browser (terutama Chrome) membatasi `localStorage` saat membuka file via protokol `file://`. Jika jadwal tidak tampil, gunakan Cara 2.

### Cara 2: Jalankan via Local HTTP Server (Disarankan)

**Menggunakan Python (jika terinstal):**
```bash
# Masuk ke folder proyek
cd krl-density

# Python 3
python -m http.server 8080

# Buka di browser:
# → Halaman Penumpang: http://localhost:8080/
# → Halaman Admin:     http://localhost:8080/admin.html
```

**Menggunakan Node.js `npx serve` (jika terinstal):**
```bash
cd krl-density
npx serve .
# Buka: http://localhost:3000
```

**Menggunakan Live Server di VS Code:**
1. Install ekstensi **Live Server** (Ritwick Dey).
2. Klik kanan `index.html` → **Open with Live Server**.

---

## 🔐 Akses Dashboard Admin / Petugas

| Item | Detail |
|---|---|
| **URL Halaman Admin** | `admin.html` (atau klik tombol "🔐 Portal Petugas / Admin" di header) |
| **Username Demo** | `admin` |
| **Password Demo** | `admin123` |

> ⚠️ **Transparansi Keamanan Prototipe:**  
> Login admin pada aplikasi ini adalah **simulasi client-side** yang berjalan sepenuhnya di browser untuk keperluan demonstrasi antarmuka. Pemeriksaan kredensial dilakukan di JavaScript yang berjalan di sisi pengguna, sehingga **tidak memiliki nilai keamanan sesungguhnya** untuk penggunaan produksi. Tidak ada password yang di-hash di server, tidak ada token kriptografis, dan tidak ada mekanisme keamanan backend. Jangan menggunakan pola ini sebagai referensi sistem keamanan produksi.

---

## 🌐 Cara Deploy ke GitHub Pages

### Langkah 1 — Buat Repository GitHub
1. Login ke [github.com](https://github.com).
2. Klik tombol **"New"** (atau buka https://github.com/new).
3. Isi nama repository, misalnya: `krl-density`
4. Pilih **Public**.
5. **Jangan centang** "Add a README file" (README sudah ada di proyek).
6. Klik **"Create repository"**.

### Langkah 2 — Upload Proyek ke Repository

**Opsi A: Upload via GitHub Web (Tanpa Git)**
1. Di halaman repository baru, klik **"uploading an existing file"**.
2. Seret seluruh isi folder proyek ke area unggah (atau klik "choose your files").
3. Pastikan struktur folder terjaga: `css/`, `js/`, `tests/`, `admin/`, `index.html`, `admin.html`, dll.
4. Tambahkan commit message: `Initial commit: KRL Density MVP v4.2`
5. Klik **"Commit changes"**.

**Opsi B: Upload via Git (Terminal)**
```bash
# Clone repository kosong
git clone https://github.com/USERNAME/krl-density.git
cd krl-density

# Salin semua file proyek ke sini, lalu:
git add .
git commit -m "Initial commit: KRL Density MVP v4.2"
git push origin main
```

### Langkah 3 — Aktifkan GitHub Pages
1. Di halaman repository GitHub Anda, klik tab **"Settings"** (ikon ⚙️).
2. Pada menu kiri, klik **"Pages"** (di bawah bagian "Code and automation").
3. Di bagian **"Source"**, pilih:
   - Branch: **`main`**
   - Folder: **`/ (root)`**
4. Klik **"Save"**.
5. Tunggu 1–3 menit. GitHub akan menampilkan URL website Anda.

### Langkah 4 — Akses Website
Setelah deployment berhasil, website dapat diakses di:

| Halaman | URL |
|---|---|
| Halaman Penumpang | `https://USERNAME.github.io/krl-density/` |
| Halaman Admin | `https://USERNAME.github.io/krl-density/admin.html` |
| Redirect `/admin` | `https://USERNAME.github.io/krl-density/admin/` |
| Pengujian Core | `https://USERNAME.github.io/krl-density/tests/core-tests.html` |
| Pengujian Jadwal | `https://USERNAME.github.io/krl-density/tests/schedule-tests.html` |

> Ganti `USERNAME` dengan username GitHub Anda dan `krl-density` dengan nama repository yang Anda buat.

---

## 🧪 Menjalankan Pengujian Otomatis

Tersedia 4 suite pengujian berbasis browser. Buka file HTML berikut di browser:

| Suite | File | Jumlah Kasus |
|---|---|:---:|
| Jadwal & Auth Admin | `tests/schedule-tests.html` | 16 |
| Core Logic & Kalkulasi | `tests/core-tests.html` | 21 |
| Mesin Simulasi | `tests/simulation-tests.html` | 20 |
| End-to-End Acceptance | `tests/e2e-tests.html` | 18 |

---

## ⚠️ Batasan & Keterbatasan Prototipe

| Aspek | Status |
|---|---|
| **Data Jadwal KRL** | ❌ Simulasi/Sintetis — bukan data resmi KAI Commuter |
| **Data Kepadatan Gerbong** | ❌ Simulasi deterministik — bukan dari sensor nyata |
| **Login Admin** | ⚠️ Simulasi client-side — tidak aman untuk produksi |
| **Penyimpanan Jadwal** | ⚠️ LocalStorage browser lokal — tidak sinkron antar-perangkat |
| **Backend / Database** | ❌ Tidak ada — static website |
| **Integrasi API KAI** | ❌ Di luar scope MVP |
| **Sensor People Counter** | ❌ Di luar scope MVP |

---

## 👥 Tim Pengembang

| Nama | NIM | Peran |
|---|---|---|
| Alycia Rosa Pramudya Fatmawati | 2403003 | Developer |
| Tia Avionita Tri Hapsari | 2403017 | Developer |

**Tools:** Antigravity (AI Executor) | ChatGPT (Quality Control)

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan **tugas akademik** dan **demonstrasi konsep** sistem informasi transportasi publik. Tidak untuk penggunaan komersial tanpa izin.
