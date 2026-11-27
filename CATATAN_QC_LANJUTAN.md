# Catatan QC Lanjutan — KRL Density Dashboard MVP

Tanggal pemeriksaan: 22 November 2026

## Basis pemeriksaan
Versi utama yang diperiksa adalah `krl-density-mvp-final.zip`. Arsip tersebut identik byte-per-byte dengan `krl-density-mvp-tahap4.zip` pada seluruh entri file, sehingga keduanya merupakan salinan yang sama. `krl-density-mvp-tahap3.zip` merupakan versi sebelumnya.

## Temuan dan tindakan
1. Screenshot mobile 360px dan 390px yang disertakan menunjukkan beberapa teks header/metadata dan konten rekomendasi tampak terpotong pada lebar layar. CSS diperkuat agar elemen dapat menyusut dan teks membungkus pada layar maksimal 480px.
2. Perubahan dilakukan pada `css/main.css` dan `css/passenger.css`.
3. Semua referensi aset lokal dari `index.html` diperiksa: 13 referensi, tidak ada file yang hilang.
4. Semua file JavaScript diperiksa dengan `node --check`: tidak ditemukan kesalahan sintaks.
5. Pengujian logika tambahan yang dijalankan: 11 PASS, 0 FAIL. Cakupan meliputi hitung persentase, batas kategori, kelebihan kapasitas, ranking, validasi data, inisialisasi engine, transisi skenario, dan graceful stop.

## Status suite pengujian proyek
- Core logic: 21 test case tersedia.
- Simulation engine: 20 test case tersedia.
- End-to-end: 18 test case tersedia.
- Laporan Tahap 4 di dalam proyek menyatakan hasil 21/21, 20/20, dan 18/18 lulus. Namun, suite browser tersebut belum berhasil dijalankan ulang secara independen dalam sesi QC ini. Karena itu, angka pada laporan diperlakukan sebagai hasil yang dilaporkan oleh dokumentasi proyek, bukan hasil rerun QC saat ini.

## Pekerjaan yang masih perlu dilakukan
- Buka ulang `index.html` pada Chrome/Edge dan periksa tampilan 360px, 390px, tablet, serta desktop.
- Ambil ulang screenshot setelah perubahan CSS.
- Jalankan kembali `tests/core-tests.html`, `tests/simulation-tests.html`, dan `tests/e2e-tests.html` di browser, lalu simpan hasil aktual.
- Laksanakan uji pengguna kepada 10 partisipan nyata dan isi instrumen hanya berdasarkan jawaban yang benar-benar dikumpulkan.

## Batasan
Seluruh data penumpang dan skenario merupakan data sintetis/asumsi. MVP tidak terhubung ke sensor atau API operasional KAI Commuter. Uji pengguna belum dibuktikan hanya dengan keberadaan template instrumen.
