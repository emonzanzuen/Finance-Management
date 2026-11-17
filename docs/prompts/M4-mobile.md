# Prompt M4 — Peningkatan P2 Mobile (Scan Nota AI, Push Notification, Financial Insight, Lupa Password OTP, & Alih Dana Tabungan)

## 1. Peran & Konteks
Anda adalah Mobile/Frontend AI Agent untuk proyek **FinManage Android V1** (React Native + Expo + TypeScript)[cite: 1].
- Kerjakan seluruh kode HANYA di dalam folder `mobile/`[cite: 1].
- DILARANG mengubah folder `frontend-finance-web/` maupun `backend/`[cite: 1].
- Fokus M4 adalah mengimplementasikan fitur **Prioritas P2** secara berurutan (1 s/d 5) sesuai `docs/PRD-FinManage-Android-V1.md`[cite: 1].

## 2. Dependensi Expo untuk M4 (Bagian 7.1)
Pastikan paket berikut terpasang dan kompatibel dengan Expo SDK proyek:
- `expo-notifications`, `expo-device`, dan `expo-constants` (untuk Push Notification)[cite: 1].
- `expo-image-picker` dan `expo-image-manipulator` (sudah terpasang di M3, dipakai kembali untuk kompresi & crop Scan Nota)[cite: 1].

## 3. Ruang Lingkup Pekerjaan M4 (Kerjakan Berurutan 1 s/d 5)

### Urutan 1: Fitur Scan Nota AI (`app/transaction/scan.tsx` & `app/transaction/form.tsx`) — `SCN-01` s/d `SCN-09`, `16.10`
1. **Titik Masuk Scan Nota (`SCN-01`, Bagian 10)**:
   - Saat pengguna mengetuk tombol aksi floating `+` di Beranda/Transaksi, tampilkan pilihan **Tambah Manual** atau **Scan Nota**[cite: 1]. Sediakan juga tombol **Scan Nota** di bagian atas Form Transaksi[cite: 1].
2. **Persetujuan Privasi AI (`SCN-08`, `16.10`)**:
   - Scan nota **nonaktif secara default** sampai pengguna memberikan persetujuan (`receiptScanConsentAt` pada data profil)[cite: 1].
   - Sebelum membuka kamera/galeri untuk pertama kali, tampilkan layar/dialog **Persetujuan Scan Nota** yang menjelaskan secara transparan bahwa: *(a) foto nota dikirim ke layanan AI pihak ketiga (Google Gemini paket gratis), (b) hanya pindai nota belanja biasa dan JANGAN memindai dokumen sensitif seperti KTP, kartu bank, atau bukti transfer yang memuat nomor rekening, serta (c) server tidak menyimpan foto nota* (`16.10`)[cite: 1].
   - Saat pengguna menekan **Setuju**, panggil `POST /api/v1/receipts/consent` dan perbarui cache profil[cite: 1].
   - Di layar **Pengaturan (`app/settings.tsx`)**, tambahkan opsi untuk melihat status dan **mencabut persetujuan Scan Nota** (`DELETE /api/v1/receipts/consent`)[cite: 1].
3. **Ambil Foto, Crop, & Kompresi di HP (`SCN-02`, `SCN-03`, `16.9`, `16.10`)**:
   - Pengguna memilih **Kamera** (`launchCameraAsync`) atau **Galeri** (`launchImageLibraryAsync`) dengan opsi crop (`allowsEditing: true`) diaktifkan agar pengguna dapat memotong hanya area total dan tanggal (`16.10`)[cite: 1].
   - Gunakan `expo-image-manipulator` untuk mengubah ukuran gambar sehingga sisi terpanjang sekitar **1.280 px** dengan kompresi **JPEG kualitas `0.7` (70%)** (sekaligus membersihkan metadata EXIF/GPS sesuai `16.9`) sebelum diunggah ke `POST /api/v1/receipts/scan` (`multipart/form-data`, field `image`)[cite: 1].
4. **Pengisian Form & Review Wajib (`SCN-04` s/d `SCN-06`, `BR-20`)**:
   - Tampilkan indikator *"Menganalisis nota…"* selama proses ekstraksi[cite: 1].
   - Saat berhasil, arahkan/isi **Form Transaksi** dengan hasil ekstraksi (`type`, `amount` / **Nominal**, `transactionDate`, `description`, dan `suggestedCategoryId`), tampilkan badge tingkat keyakinan (`confidence`) serta `warnings` bila ada[cite: 1].
   - **DILARANG menyimpan transaksi secara otomatis**: pengguna wajib memeriksa, mengedit bila perlu, dan menekan tombol **Simpan** sendiri (`SCN-05`, `BR-20`)[cite: 1].
   - Jika ekstraksi gagal (`SCAN_FAILED`) atau kuota harian 10 scan habis (`429 SCAN_QUOTA_EXCEEDED`), tampilkan pesan yang jelas beserta tombol **"Isi Manual"** agar pengguna tidak terhambat mencatat transaksi (`SCN-06`, `SCN-07`)[cite: 1].

### Urutan 2: Push Notification Android (`src/utils/notifications.ts` & `app/settings.tsx`) — `NOT-04` s/d `NOT-06`, `SET-04`, `16.5`, `22.3`
1. **Penanganan Aman di Expo Go (`22.3`, `22.6`)**:
   - Push jarak jauh Android tidak didukung di aplikasi Expo Go (SDK 53 ke atas)[cite: 1]. Gunakan `expo-constants` (`Constants.executionEnvironment` / `Constants.appOwnership`) dan `expo-device` untuk mendeteksi bila aplikasi berjalan di dalam **Expo Go**: **lewati registrasi push token secara anggun tanpa memunculkan error/crash**, dan tampilkan keterangan kecil di Pengaturan bahwa Push Notification aktif pada build APK[cite: 1].
2. **Izin & Registrasi Token pada APK (`NOT-04`, `NOT-05`, `SET-04`)**:
   - Pada build APK (ketika saklar Push Notification di Pengaturan aktif), minta izin notifikasi (`POST_NOTIFICATIONS` untuk Android 13+), ambil `ExpoPushToken`, dan daftarkan ke `POST /api/v1/devices` beserta `locale` bahasa aktif (`id` / `en`)[cite: 1].
   - Sediakan **Saklar Push Notification** di layar Pengaturan (`SET-04`): saat dimatikan, panggil `DELETE /api/v1/devices/:token` dan simpan preferensi lokal[cite: 1].
   - Pastikan saat **Logout**, aplikasi juga memanggil `DELETE /api/v1/devices/:token` (usaha terbaik / *best-effort*) sebelum menghapus token JWT dari SecureStore (`8.2`, `16.5`)[cite: 1].
3. **Navigasi Saat Push Diketuk (`NOT-06`, `16.5`)**:
   - Pasang listener `Notifications.addNotificationResponseReceivedListener`[cite: 1].
   - Validasi tujuan navigasi hanya ke dalam **whitelist yang diizinkan** (`16.5`): layar **Anggaran** (`/(tabs)/budget`), **Tabungan** (`/(tabs)/savings`), atau daftar **Notifikasi** (`/notifications`)[cite: 1].

### Urutan 3: Kartu Financial Insight di Beranda (`app/(tabs)/index.tsx`) — `DASH-10`, `BR-23`
- Di bagian bawah layar **Beranda** (di bawah daftar 5 Transaksi Terbaru), tampilkan seksi/kartu **Financial Insight** yang merender array `insights` dari `GET /api/v1/dashboard/summary` sesuai bahasa aktif (`id`/`en`)[cite: 1]:
  1. `expense_change`: Kenaikan atau penurunan pengeluaran bulan ini dalam persen dibanding bulan lalu (dengan ikon tren naik/turun)[cite: 1].
  2. `top_expense_category`: Kategori pengeluaran terbesar pada bulan terpilih beserta nominalnya (dikonversi ke mata uang tampilan aktif) dan persentasenya[cite: 1].
  3. `critical_budgets_count`: Jumlah anggaran (budget) yang sudah mencapai `>= 90%` pada bulan ini[cite: 1].

### Urutan 4: Alur Lupa Password via OTP Email (`app/(auth)/forgot-password.tsx` & `reset-password.tsx`) — `AUTH-08`, `Bagian 9`
1. Tambahkan tautan **"Lupa password?"** pada layar Login (`app/(auth)/login.tsx`) yang membuka `app/(auth)/forgot-password.tsx`[cite: 1].
2. **Layar Minta OTP (`forgot-password.tsx`)**:
   - Input `email` dengan validasi React Hook Form + Zod, memanggil `POST /api/v1/auth/forgot-password`[cite: 1].
   - Tampilkan pesan bahwa jika email terdaftar, kode 6 digit telah dikirim dan berlaku selama 10 menit, lalu arahkan ke layar `reset-password.tsx` dengan membawa parameter `email`[cite: 1].
3. **Layar Reset Password (`reset-password.tsx`)**:
   - Input **Kode OTP 6 Digit** (`keyboardType="number-pad"`, maks 6 digit), **Password Baru** (8–128 karakter, wajib huruf + angka), dan **Konfirmasi Password Baru**[cite: 1].
   - Panggil `POST /api/v1/auth/reset-password`[cite: 1]. Tangani error `400 OTP_INVALID_OR_EXPIRED` atau `429 RATE_LIMITED` dengan pesan jelas[cite: 1].
   - Saat berhasil, tampilkan Toast sukses dan arahkan pengguna kembali ke layar **Login** untuk masuk dengan password baru[cite: 1].

### Urutan 5: Tarik Tabungan & Tambah Budget dari Tabungan (`app/(tabs)/savings.tsx` & `app/(tabs)/budget.tsx`) — `SAV-08`, `BUD-10`, `BR-25`
1. **Tarik Tabungan (`SAV-08`, `BR-13`)**:
   - Pada kartu/detail Target Tabungan yang memiliki jumlah terkumpul `> 0`, tambahkan tombol **"Tarik"** di samping tombol Setor[cite: 1].
   - Buka bottom sheet form **Tarik Tabungan** (input **Nominal Penarikan** dalam IDR, tanggal, dan catatan opsional; tampilkan informasi **Jumlah Terkumpul Saat Ini** beserta keterangan bahwa penarikan ini hanya mengubah catatan tabungan dan tidak mengubah Saldo Catatan)[cite: 1].
   - Panggil `POST /api/v1/savings-goals/:id/withdrawals`. Jika server membalas `400 WITHDRAWAL_EXCEEDS_SAVED`, tampilkan pesan bahwa nominal penarikan tidak boleh melebihi jumlah terkumpul[cite: 1].
   - Pada daftar **Riwayat Setoran/ Mutasi Target** (`SAV-07`), bedakan tampilan baris bertipe `deposit` (`+` warna hijau Emerald) dan `withdrawal` (`-` warna merah)[cite: 1].
2. **Tambah Budget dari Tabungan (`BUD-10`, `BR-25`)**:
   - Pada bottom sheet **Tambah Budget Cepat (Top-up)** di layar Anggaran (`app/(tabs)/budget.tsx`), tambahkan pemilih **Sumber Dana**:
     - **Manual (Catat Kenaikan Budget)** -> `source: "manual"`[cite: 1].
     - **Alirkan dari Target Tabungan** -> `source: "savings"`[cite: 1].
   - Bila pengguna memilih **Alirkan dari Target Tabungan**, tampilkan dropdown/pemilih **Target Tabungan** (hanya target yang memiliki `savedAmount > 0`) beserta nominal saldo terkumpul pada target tersebut[cite: 1].
   - Saat disimpan, panggil `POST /api/v1/budgets/:id/top-up` dengan `{ amount, source: "savings", goalId }`, lalu invalidasi cache `budgets`, `savings`, `dashboard`, dan `notifications` agar angka di layar Anggaran dan Tabungan langsung ter-update bersamaan[cite: 1].

## 4. Kriteria Selesai (Definition of Done)
- `npx tsc --noEmit` dan ESLint lulus tanpa error[cite: 1].
- Seluruh fitur P2 yang selesai berjalan mulus di HP fisik tanpa merusak kestabilan fitur P0 dan P1[cite: 1].