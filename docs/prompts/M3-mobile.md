# Prompt M3 — Peningkatan P1 Mobile (Export PDF/Excel, Import Excel, 12 Mata Uang, Profil & Avatar, Keamanan Sesi, Notifikasi, & Detail)

## 1. Peran & Konteks
Anda adalah Mobile/Frontend AI Agent untuk proyek **FinManage Android V1** (React Native + Expo + TypeScript)[cite: 1].
- Kerjakan seluruh kode HANYA di dalam folder `mobile/`[cite: 1].
- DILARANG mengubah folder `frontend-finance-web/` maupun `backend/`[cite: 1].
- Pada M1 dan M2, seluruh fitur inti P0 telah selesai[cite: 1]. Fokus M3 adalah mengimplementasikan seluruh fitur **Prioritas P1** sesuai `docs/PRD-FinManage-Android-V1.md`[cite: 1].

## 2. Dependensi Expo Baru untuk M3 (Bagian 7.1)
Pastikan paket berikut terpasang dengan versi yang kompatibel dengan Expo SDK proyek:
- `expo-image-picker` & `expo-image-manipulator` (untuk foto profil/avatar)[cite: 1].
- `expo-document-picker`, `expo-file-system`, & `expo-sharing` (untuk unduh/bagikan Export PDF & Excel serta unggah file Import Excel)[cite: 1].

## 3. Ruang Lingkup Pekerjaan M3

### A. 12 Mata Uang Tampilan & Pengaturan Lanjutan (`CUR-01`, `CUR-03`, `SET-05`, `BR-18`)
1. **Perluasan 12 Mata Uang (`CUR-01`, `BR-18`)**:
   - Perbarui `PreferencesContext`, tipe mata uang, dan pemilih di layar Pengaturan agar mendukung 12 mata uang: `IDR`, `USD`, `EUR`, `SGD`, `MYR`, `JPY`, `GBP`, `AUD`, `SAR`, `CNY`, `KRW`, dan `THB`[cite: 1].
   - Aturan pembulatan tampilan (`BR-18`): **`IDR`, `JPY`, dan `KRW` ditampilkan tanpa desimal (0 desimal)**; 9 mata uang lainnya ditampilkan dengan **2 desimal**[cite: 1].
   - Ingat: seluruh input nominal di form tetap menggunakan **IDR** disertai teks perkiraan mata uang aktif di bawah kolom input (`BR-02`)[cite: 1].
2. **Refresh Kurs & Waktu Pembaruan (`CUR-03`)**:
   - Di layar Pengaturan (bagian Mata Uang), tampilkan waktu pembaruan kurs terakhir (`fetchedAt` dari `GET /api/v1/currencies`) dan tombol **Refresh Kurs** untuk memuat ulang kurs disertai indikator loading[cite: 1].
3. **Tentang Aplikasi (`SET-05`)**:
   - Tambahkan bagian/kartu **Tentang Aplikasi** di layar Pengaturan yang menampilkan nama aplikasi (**FinManage Android**), versi (`1.0.0`), dan keterangan jelas bahwa aplikasi ini **hanya alat pencatat keuangan pribadi, bukan alat transaksi atau penyimpan uang sungguhan**[cite: 1].

### B. Layar Profil, Avatar, Ubah Password, & Logout-All (`app/profile.tsx`) — `PRO-01` s/d `PRO-03`, `AUTH-05`, `AUTH-06`
Diakses dari tab **Lainnya -> Profil**:
1. **Statistik & Data Profil (`PRO-01`, `PRO-03`)**:
   - Tampilkan avatar (atau inisial nama jika belum ada avatar), nama, email, serta 3 kartu statistik dari `GET /api/v1/profile`: **Total Transaksi**, **Jumlah Target Tabungan**, dan **Total Tabungan**[cite: 1].
2. **Upload & Kompresi Avatar (`PRO-02`)**:
   - Ketuk avatar untuk memilih foto dari galeri menggunakan `expo-image-picker`[cite: 1].
   - Perkecil ukuran gambar menggunakan `expo-image-manipulator` ke lebar/tinggi sekitar **256 px** (format JPEG, kualitas ~0.7) sehingga hasil data URI (`base64`) dijamin **di bawah 100 KB**, lalu kirim ke `PATCH /api/v1/profile`[cite: 1]. Sediakan juga opsi menghapus avatar[cite: 1].
3. **Edit Nama & Email (`PRO-01`, `16.3`)**:
   - Jika pengguna hanya mengubah nama, langsung kirim ke `PATCH /api/v1/profile`[cite: 1].
   - Jika pengguna mengubah **email**, wajibkan input **Password Saat Ini** (`currentPassword`) sesuai aturan keamanan `16.3`[cite: 1].
4. **Ubah Password (`AUTH-05`, `SEC-02`)**:
   - Form bottom sheet/layar dengan React Hook Form + Zod: `currentPassword`, `newPassword` (8–128 karakter, huruf + angka), dan `confirmPassword`[cite: 1].
   - Panggil `POST /api/v1/auth/change-password`. Saat berhasil, **simpan token JWT baru** yang dikembalikan server ke `expo-secure-store` dan perbarui state `AuthContext` agar perangkat ini tetap login sementara perangkat lain otomatis keluar[cite: 1].
5. **Keluar dari Semua Perangkat (`AUTH-06`, `16.5`)**:
   - Tombol **"Keluar dari semua perangkat"** dengan `ConfirmDialog` yang menjelaskan bahwa seluruh sesi aktif di semua HP akan dicabut[cite: 1].
   - Panggil `POST /api/v1/auth/logout-all`, lalu jalankan urutan pembersihan lokal (hapus token SecureStore, `queryClient.clear()`, arahkan ke Login)[cite: 1].

### C. Notifikasi In-App & Badge Lonceng (`app/notifications.tsx`) — `DASH-09`, `NOT-01` s/d `NOT-03`
1. **Badge di Header Beranda (`DASH-09`, `NOT-02`)**:
   - Tampilkan badge angka `unreadCount` pada ikon lonceng di header Beranda (sembunyikan bila `0`)[cite: 1].
   - Mengetuk ikon lonceng atau menu **Notifikasi** di tab Lainnya membuka `app/notifications.tsx`[cite: 1].
2. **Layar Daftar Notifikasi (`NOT-01`, `NOT-02`, `17.2`)**:
   - Tampilkan daftar notifikasi dengan ikon spesifik per jenis (`budget_warning` dengan warna peringatan Amber, `budget_exceeded` dengan warna merah, `goal_completed` dengan warna hijau Emerald) dan waktu relatif[cite: 1].
   - Susun judul dan pesan notifikasi secara dinamis dari `type` dan objek JSON `data` (mis. nama kategori, persentase, bulan, atau judul target) menggunakan kamus terjemahan `id.json` / `en.json` sesuai bahasa aktif (`17.2`)[cite: 1].
   - Ketuk item untuk memanggil `PATCH /api/v1/notifications/:id/read` dan menavigasikan pengguna ke tab **Anggaran** atau **Tabungan**[cite: 1].
   - Sediakan tombol **"Tandai semua terbaca"** (`POST /api/v1/notifications/read-all`)[cite: 1].

### D. Penyempurnaan Transaksi, Budget, & Tabungan P1 (`TRX-07`, `TRX-08`, `BUD-09`, `SAV-03`, `SAV-07`)
1. **Detail Transaksi Bottom Sheet (`TRX-08`)**:
   - Mengetuk kartu transaksi di daftar Transaksi atau Beranda membuka `BottomSheet` Detail Transaksi yang menampilkan informasi lengkap (tipe, kategori dengan chip warna, nominal dalam mata uang aktif & IDR asli bila mata uang tampilan bukan IDR, tanggal lengkap, deskripsi, sumber `manual`/`import`/`scan`, waktu dibuat) beserta tombol **Edit** dan **Hapus** (dengan konfirmasi)[cite: 1].
2. **Ringkasan Transaksi Sebelum Simpan (`TRX-07`)**:
   - Pada form tambah/edit transaksi, tampilkan kartu/kotak ringkasan singkat atau dialog konfirmasi ringkasan (Tipe, Kategori, Tanggal, Nominal) sebelum transaksi dikirim ke server[cite: 1].
3. **Tambah Budget Cepat / Top-up (`BUD-09`)**:
   - Pada setiap kartu kategori di layar **Anggaran (`app/(tabs)/budget.tsx`)**, tambahkan tombol **"+ Tambah Budget"**[cite: 1].
   - Mengetuk tombol tersebut membuka bottom sheet cepat untuk memasukkan **Nominal Tambahan (IDR)**, memanggil `POST /api/v1/budgets/:id/top-up` dengan `{ amount, source: "manual" }`, lalu menginvalidasi cache `budgets` dan `dashboard`[cite: 1].
4. **Detail Target & Riwayat/Hapus Setoran Tabungan (`SAV-03`, `SAV-07`)**:
   - Mengetuk kartu target di layar **Tabungan (`app/(tabs)/savings.tsx`)** membuka bottom sheet / layar **Detail Target** (`GET /api/v1/savings-goals/:id`) yang menampilkan daftar **Riwayat Setoran** (`SAV-07`: nominal, tanggal, catatan)[cite: 1].
   - Sediakan tombol hapus (ikon tempat sampah dengan `ConfirmDialog`) pada setiap item setoran untuk menghapus setoran yang keliru (`SAV-03`: `DELETE /api/v1/savings-goals/:id/deposits/:depositId`), lalu invalidasi cache `savings`, `dashboard`, dan `notifications`[cite: 1].

### E. Export Laporan ke PDF & Excel (`app/reports.tsx`) — `EXP-01` s/d `EXP-05`
- Tambahkan tombol **Export** pada layar Laporan (`app/reports.tsx`) yang membuka pilihan **Export PDF** atau **Export Excel (.xlsx)** untuk bulan dan tahun yang sedang dipilih[cite: 1].
- Unduh file dari `GET /api/v1/reports/export?format=(pdf|xlsx)&month=&year=` ke direktori cache aplikasi menggunakan `expo-file-system` (sertakan header `Authorization: Bearer <token>`)[cite: 1].
- Setelah terunduh, buka share sheet Android menggunakan `expo-sharing` (`Sharing.shareAsync`) agar pengguna dapat membuka, menyimpan, atau membagikan file tersebut[cite: 1].
- Tangani error `400` (jika baris > 5.000) atau `429` (rate limit) dengan pesan Toast/dialog yang jelas[cite: 1].

### F. Layar Import Excel (`app/import.tsx`) — `IMP-01` s/d `IMP-10`
Tambahkan menu **Import Data** di tab **Lainnya (`app/(tabs)/more.tsx`)** yang membuka `app/import.tsx` dengan alur lengkap sesuai Bagian 9 dan 11.9[cite: 1]:
1. **Tampilan Aturan Import & Contoh Penyesuaian Kolom (`IMP-01`)**:
   - Sebelum pengguna memilih file, tampilkan kartu **Aturan Import** (memuat informasi dari `GET /api/v1/imports/spec` dan aturan Bagian 11.9: format `.xlsx`, maks 2 MB & 1.000 baris, kolom wajib `Tanggal`, `Tipe`, `Kategori`, `Deskripsi`, `Nominal`, dukungan 3 kolom `Tanggal/Bulan/Tahun`, kolom `No` & `Hari` diabaikan)[cite: 1].
   - Tampilkan tabel panduan singkat: *"Contoh penyesuaian: ganti 'Barang Yang Dibeli' menjadi 'Deskripsi', ganti 'Total Rp' menjadi 'Nominal', hapus kolom 'Jumlah (barang)', dan pastikan kolom 'Tipe' & 'Kategori' tersedia"*[cite: 1].
2. **Unduh Template Resmi (`IMP-02`)**:
   - Sediakan tombol **"Unduh Template Excel"** yang mengunduh `GET /api/v1/imports/template` via `expo-file-system` dan membukanya lewat `expo-sharing`[cite: 1].
3. **Pilih File & Unggah Preview (`IMP-03` s/d `IMP-06`)**:
   - Tombol **"Pilih File Excel (.xlsx)"** menggunakan `expo-document-picker` (filter `.xlsx`) dan mengunggahnya ke `POST /api/v1/imports/transactions/preview` (`multipart/form-data`)[cite: 1].
   - **Penanganan Khusus `IMPORT_HEADER_MISMATCH` (`IMP-04`, `18.4`)**: Jika server membalas `400 IMPORT_HEADER_MISMATCH`, tampilkan kartu error yang jelas dan dapat ditindaklanjuti berdasarkan `error.details`:
     - Sebutkan **kolom tidak dikenal yang harus dihapus atau diganti namanya** (`details.unknown`)[cite: 1].
     - Sebutkan **kolom wajib yang masih hilang dan harus ditambahkan** (`details.missing`)[cite: 1].
     - Sediakan tombol untuk memilih ulang file setelah pengguna memperbaiki Excel-nya[cite: 1].
4. **Tampilan Preview Baris & Opsi Kategori (`IMP-05`, `IMP-07`, `IMP-08`)**:
   - Jika header sesuai, tampilkan ringkasan jumlah baris: **Total Baris**, **Valid** (hijau), **Bermasalah** (merah), dan **Duplikat** (kuning)[cite: 1].
   - Tampilkan daftar preview baris (khususnya alasan error per baris pada baris yang bermasalah agar pengguna tahu apa yang dilewati)[cite: 1].
   - Jika `unknownCategories.length > 0`, tampilkan daftar kategori baru tersebut dan sediakan pilihan radio/toggle (`IMP-07`):
     - **Buat kategori baru secara otomatis** (`"create"` — default)[cite: 1].
     - **Masukkan ke kategori Other** (`"other"`)[cite: 1].
5. **Konfirmasi Commit & Ringkasan Hasil (`IMP-09`)**:
   - Tombol **"Konfirmasi & Impor (X Baris Valid)"** (nonaktif bila `validCount === 0`) memanggil `POST /api/v1/imports/transactions/commit`[cite: 1].
   - Setelah berhasil, invalidasi cache `transactions`, `categories`, `dashboard`, `budgets`, `reports`, dan `notifications`, lalu tampilkan dialog/kartu **Ringkasan Hasil Import** (jumlah transaksi berhasil diimpor, jumlah baris dilewati, dan daftar kategori baru yang dibuat)[cite: 1].

## 4. Kriteria Selesai (Definition of Done)
- `npx tsc --noEmit` dan ESLint bersih tanpa error[cite: 1].
- Seluruh fitur P1 (Export PDF/Excel, Import Excel, 12 Mata Uang, Profil & Avatar, Ubah Password & Logout-All, Notifikasi In-App, Detail Transaksi, Riwayat/Hapus Setoran, dan Top-up Budget Cepat) berjalan penuh di HP fisik[cite: 1].