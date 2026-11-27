# Layar, Kebutuhan, dan Desain Mobile FinManage

Sumber: PRD bagian 9, 10, 11, 14, 15. Prioritas P0 inti, P1 peningkatan, P2 terakhir. Aplikasi hanya **mencatat** keuangan; tidak ada uang sungguhan dan tidak terhubung ke bank.

## 1. Navigasi (Expo Router)

```
(auth)    login, register, forgot-password (P2)
(tabs)    index (Beranda), transactions, budget, savings, more (Lainnya)
stack     transaction/form, transaction/scan (P2), transaction/[id] (P1), budget/form, savings/form,
          savings/[id], categories, reports, import (P1), notifications (P1), profile, settings
```

- Bottom tab 5 item. Tombol + (floating) di Beranda dan Transaksi: pilihan Tambah manual atau Scan nota (P2).
- Lainnya berisi: Kategori, Laporan, Import data, Notifikasi, Profil, Pengaturan.
- Ikon lonceng di header Beranda dengan badge notifikasi belum dibaca.
- Tombol back Android: tutup sheet atau dialog dulu, lalu layar sebelumnya; di tab utama ikuti perilaku standar.
- Mengetuk push hanya membuka tujuan yang diizinkan: anggaran, tabungan, notifikasi.

## 2. Kebutuhan per modul (ringkas)

**Auth**: register (P0), login (P0), logout dengan konfirmasi (P0), sesi bertahan dan 401 memicu logout otomatis (P0), validasi email dan password 8-128 karakter huruf+angka (P0), ubah password (P1), keluar dari semua perangkat (P1), lupa password OTP (P2).

**Beranda**: salam dan nama bulan; empat kartu: Saldo Catatan (dengan teks bantuan bahwa ini bukan saldo rekening), Pemasukan bulan ini, Pengeluaran bulan ini, Total Tabungan (ketuk untuk rincian); pie pengeluaran per kategori; line tren 6 bulan; 5 transaksi terbaru; pemilih bulan dan tahun; pull-to-refresh; insight (P2). **Grafik hanya tampil bila datanya cukup**; bila kosong atau terlalu sedikit tampilkan empty state, angka, atau daftar peringkat (pie boleh diganti daftar batang horizontal bila kategori lebih dari 6).

**Transaksi**: tambah, ubah, hapus (konfirmasi); cari (deskripsi, kategori); filter tipe, kategori, rentang tanggal; sortir tanggal atau jumlah; daftar kartu dengan infinite scroll 20 per halaman; detail (P1); ringkasan sebelum simpan (P1). Form: tanggal, tipe, kategori, **Nominal**, deskripsi (opsional). Kolom Nominal: keyboard numerik, pemisah ribuan otomatis, perkiraan mata uang pilihan di bawah kolom.

**Kategori**: CRUD; 12 warna preset; nama unik per tipe; hapus diblokir bila dipakai (tampilkan jumlah pemakaian); tipe terkunci bila dipakai.

**Anggaran**: pilih bulan dan tahun; tambah, ubah, hapus budget per kategori pengeluaran; ringkasan Total Budget, Total Terpakai, Sisa; progress bar warna sesuai status (safe hijau, warning kuning, critical merah, exceeded merah dengan sisa negatif); **transaksi tetap bisa dicatat saat budget terlampaui**; tombol Tambah budget cepat (P1); tambah dari tabungan (P2); banner peringatan.

**Tabungan**: CRUD target (judul, nominal target, deadline opsional); setor (P0); hapus setoran keliru dan riwayat (P1); progress per target dan total; status in_progress, almost_done (80-99), completed (badge Selesai); setoran melebihi sisa ditolak dengan pesan sisa; tarik tabungan (P2).

**Laporan**: pilih bulan dan tahun; ringkasan pemasukan, pengeluaran, selisih; pie pengeluaran; bar pemasukan per kategori; line tren 12 bulan; daftar transaksi bulan itu (memakai GET /transactions dengan dateFrom dan dateTo); Export PDF dan Excel (P1) lewat share sheet.

**Import Excel (P1)**: layar pertama menampilkan **aturan import** (dari GET /imports/spec): kolom yang diizinkan, format, batas, contoh benar dan salah, tombol unduh template. Pilih file .xlsx. Bila 400 `IMPORT_HEADER_MISMATCH`: tampilkan layar error yang menyebut kolom yang harus dihapus atau diganti nama (`unknown`) dan kolom yang harus ditambahkan (`missing`), lalu tombol pilih ulang file. Bila kolom sesuai: preview (jumlah valid, bermasalah beserta alasan per baris, duplikat), pilihan kategori tidak dikenal (buat otomatis atau masukkan ke Other), opsi lewati duplikat, tombol Konfirmasi, lalu ringkasan hasil.

**Scan nota (P2)**: layar persetujuan sekali (foto dikirim ke layanan AI pihak ketiga pada paket gratis; jangan memindai KTP, kartu, atau bukti transfer); kamera atau galeri; crop; kompres (sisi terpanjang sekitar 1.280 px, JPEG sekitar 70%); hasil mengisi form transaksi dan **pengguna wajib memeriksa lalu menekan Simpan**; gagal: pesan jelas dan tombol Isi manual.

**Notifikasi (P1)**: daftar, ikon per jenis, waktu relatif, badge belum dibaca, tandai terbaca satu atau semua. Teks disusun dari `type` dan `data` sesuai bahasa. Push (P2) dengan izin POST_NOTIFICATIONS Android 13+ dan saklar di Pengaturan.

**Profil (P1)**: nama, email, avatar (galeri, diperkecil sekitar 256 px, maks sekitar 100 KB), statistik, ubah password, logout.

**Pengaturan**: tema (Ikuti sistem, Terang, Gelap), bahasa (Indonesia, English tanpa restart), mata uang tampilan (12 mata uang: IDR, USD, EUR, SGD, MYR, JPY, GBP, AUD, SAR, CNY, KRW, THB) dengan tombol refresh kurs dan waktu pembaruan, saklar push (P2), tentang aplikasi (versi, keterangan bahwa aplikasi hanya pencatat). Tidak ada Backup, Restore, atau Reset Data.

## 3. Design system

| Token | Nilai |
|---|---|
| Primer | Indigo `#4F46E5` (hanya untuk aksi utama) |
| Pemasukan / Pengeluaran | `#10B981` / `#EF4444` (konsisten di seluruh aplikasi) |
| Peringatan / Info | `#F59E0B` / `#0EA5E9` |
| Latar | Terang: putih dan abu sangat muda. Gelap: slate sangat gelap, kartu satu tingkat lebih terang |
| Tipografi | Font sistem Android (Roboto). Judul 22, subjudul 18, isi 16, keterangan 13 |
| Radius | Kartu dan sheet 16, tombol dan input 12, badge dan avatar penuh |
| Spasi | Kelipatan 4 (4, 8, 12, 16, 24, 32) |
| Ikon | `@expo/vector-icons` set Feather |

Komponen: Button, Card, TextField, Select (sheet), DatePickerField, AmountField, CategoryChip, ProgressBar, Badge, EmptyState, ErrorState, Skeleton, Toast, ConfirmDialog, BottomSheet (memakai `Modal` bawaan), ListItem, StatCard, pembungkus grafik (Pie, Bar, Line). Semua komponen membaca token dari theme; tidak ada warna yang di-hardcode di layar.

## 4. Perilaku Android dan state

- Safe area dan edge-to-edge dengan `react-native-safe-area-context`. Keyboard tidak menutupi form dan tombol Simpan tetap terjangkau. Target sentuh minimal 48 dp. Pull-to-refresh pada Beranda dan daftar.
- Setiap daftar punya loading (skeleton), empty, error (dengan tombol Coba lagi), dan success (toast).
- Server hosting gratis bisa tidur: panggil `GET /health` saat aplikasi dibuka, tampilkan Menyiapkan server..., timeout 60 detik untuk request pertama.
- V1 butuh internet untuk semua fitur data. Saat gagal: error state dan coba lagi; tidak ada janji offline. Tema, bahasa, dan mata uang tetap bisa diganti tanpa internet.
- Grafik: lebar mengikuti layar, legenda di bawah, nilai lewat ketukan (tidak ada hover).

## 5. State dan penyimpanan

| Data | Tempat |
|---|---|
| Token JWT | `expo-secure-store` (satu kunci) |
| Tema, bahasa, mata uang, kurs terakhir | AsyncStorage |
| Data keuangan | Hanya memori (cache TanStack Query, tidak disimpan ke disk) |
| Auth | `AuthContext`; preferensi `PreferencesContext` |
| Form | React Hook Form + Zod resolver |

Invalidasi cache setelah mutasi: transaksi (transactions, dashboard, budgets, reports, notifications); kategori (categories, transactions, budgets); budget (budgets, dashboard, notifications); tabungan (savings, dashboard, notifications).

Logout, 401, dan logout-all: cabut push token (usaha terbaik), hapus token SecureStore, `queryClient.clear()`, kosongkan state auth, kembali ke Login.

## 6. Lokalisasi

Indonesia dan English lewat hook `useTranslation` buatan sendiri dan file JSON. Kunci dasar dapat disalin dari `frontend-finance-web/src/locales/id.json` dan `en.json` (baca saja, salin ke `mobile/src/i18n/`). Format tanggal dan angka mengikuti bahasa; IDR dan nominal bulat tanpa desimal.
