# Prompt M3 — Peningkatan P1 Backend (Export PDF/Excel, Import Excel Ketat, Profil, Keamanan Sesi, & Tes SEC Wajib)

## 1. Peran & Konteks
Anda adalah Backend AI Agent untuk proyek **FinManage Android V1**.
- Kerjakan seluruh kode HANYA di dalam folder `backend/`.
- DILARANG mengubah folder `frontend-finance-web/` maupun `mobile/`.
- Pada M1 dan M2, seluruh fitur P0 telah selesai. Fokus M3 adalah menyelesaikan seluruh endpoint **Prioritas P1** (Export PDF/Excel, Import Excel dengan validasi header ketat, Profil & Avatar, Ubah Password & Logout-All, Notifikasi In-App, Top-up Budget Cepat) serta melengkapi **tes keamanan otomatis berlabel Wajib** sesuai `docs/PRD-FinManage-Android-V1.md`.

## 2. Ruang Lingkup Pekerjaan M3

### A. Keamanan Sesi Lanjutan & Profil (`src/modules/auth/`, `src/modules/profile/`)
1. **`POST /api/v1/auth/change-password` (`AUTH-05`, `16.2`, `16.3`, `SEC-02`)**:
   - Wajib autentikasi dan dibatasi rate limit **5 per 15 menit per user dan IP** (`16.6`).
   - Body: `{ currentPassword, newPassword }` (mode `.strict()`).
   - Verifikasi `currentPassword` terhadap `password_hash` user; jika salah balas 401 `INVALID_CREDENTIALS`.
   - Validasi `newPassword` sesuai kebijakan password (8–128 karakter, huruf + angka, tidak sama dengan email, bukan password umum).
   - Dalam satu `prisma.$transaction`: update `password_hash` (Argon2id), cabut (`revoked_at = now()`) **semua sesi pengguna**, buat **satu sesi baru** untuk perangkat saat ini, dan kembalikan token JWT baru beserta data user (`200 OK`)[cite: 1].
2. **`POST /api/v1/auth/logout-all` (`AUTH-06`, `16.2`, `SEC-02`)**:
   - Dalam satu `prisma.$transaction`: isi `revoked_at = now()` pada seluruh baris `sessions` aktif milik `req.auth.userId` dan hapus seluruh baris `device_tokens` milik user tersebut (`204 No Content`)[cite: 1].
3. **`GET /api/v1/profile` & `PATCH /api/v1/profile` (`PRO-01` s/d `PRO-03`, `16.3`, `17.2`)**:
   - `GET /profile`: Kembalikan `{ id, name, email, avatar, receiptScanConsentAt, createdAt, stats: { transactionCount, savingsGoalCount, totalSavings } }`[cite: 1].
   - `PATCH /profile`: Terima perubahan `name`, `email`, dan/atau `avatar` (`avatar_data`)[cite: 1].
   - **Aturan Ubah Email (`16.3`)**: Jika `email` diubah, body **wajib** menyertakan `currentPassword`[cite: 1]. Verifikasi password, pastikan email baru belum dipakai (`409 EMAIL_TAKEN`), simpan email dalam huruf kecil, dan **cabut seluruh sesi lain** kecuali sesi saat ini (`req.auth.sessionId`)[cite: 1].
   - **Aturan Avatar (`PRO-02`, `17.2`)**: `avatar` berupa string data URI (`data:image/jpeg;base64,...` atau `image/png`) atau `null` (untuk hapus avatar), dengan ukuran maksimal **100 KB** (tolak dengan `413 FILE_TOO_LARGE` atau `400 VALIDATION_ERROR` jika melebihi batas)[cite: 1].

### B. Notifikasi In-App & Top-up Budget Cepat (`src/modules/notifications/`, `src/modules/budgets/`)
1. **Modul Notifications (`NOT-01` s/d `NOT-03`, `18.2`)** *(pastikan lengkap jika belum dibuat di M2)*:
   - `GET /api/v1/notifications?page=1&limit=20&unreadOnly=false`: Kembalikan daftar notifikasi milik user (`created_at DESC`) beserta `meta: { page, limit, total, totalPages, unreadCount }`[cite: 1].
   - `PATCH /api/v1/notifications/:id/read`: Tandai satu notifikasi milik user menjadi `is_read = true` (balas 404 jika milik orang lain/tidak ada)[cite: 1].
   - `POST /api/v1/notifications/read-all`: Tandai semua notifikasi milik user menjadi `is_read = true`[cite: 1].
2. **Top-up Budget Cepat (`BUD-09`, `18.2`)**:
   - `POST /api/v1/budgets/:id/top-up`:
   - Untuk M3 (P1), dukung body `{ amount: number, source: "manual" }` dengan `amount` bilangan bulat IDR > 0 (`BR-01`)[cite: 1].
   - Pastikan budget milik `req.auth.userId` (404 jika bukan)[cite: 1].
   - Tambahkan `amount` ke `budget_amount` pada budget tersebut, lalu kembalikan data budget terbaru beserta perhitungan `spentAmount`, `remaining`, `percentage`, dan `status` yang diperbarui[cite: 1].

### C. Modul Export Laporan ke PDF & Excel (`src/modules/reports/`)
Implementasikan `GET /api/v1/reports/export?format=pdf|xlsx&month=&year=` sesuai Bagian 11.8 (`EXP-01` s/d `EXP-05`), 16.6, 16.9, dan 18.2[cite: 1]:
1. **Rate Limit & Batas Baris**:
   - Pasang rate limit **20 request per jam per user** (`16.6`)[cite: 1].
   - Hitung jumlah transaksi pengguna pada periode `month` dan `year` (zona waktu WIB)[cite: 1]. Jika lebih dari **5.000 baris**, tolak dengan 400 (`EXPORT_LIMIT_EXCEEDED` / pesan meminta pengguna mempersempit periode sesuai `EXP-05`)[cite: 1].
2. **Aturan Umum Export (`EXP-04`, `16.9`)**:
   - Semua nominal di dalam file **selalu dalam IDR (mata uang dasar)** dan keterangan mata uang IDR wajib tertulis jelas pada header laporan[cite: 1].
   - Pada Excel, tulis semua nilai teks (deskripsi, nama kategori, nama user) secara eksplisit sebagai string, bukan formula (`16.9`)[cite: 1].
3. **Export PDF (`EXP-01` — menggunakan `pdfkit`)**:
   - Susun dokumen PDF rapi yang memuat: Judul laporan, Nama Pengguna, Periode (Bulan & Tahun), Ringkasan (Total Pemasukan, Total Pengeluaran, Selisih/Net dalam IDR), Tabel Rincian per Kategori (Pemasukan & Pengeluaran), serta Tabel Daftar Transaksi pada bulan tersebut[cite: 1].
   - Set header `Content-Type: application/pdf` dan `Content-Disposition: attachment; filename="FinManage_Laporan_YYYY-MM.pdf"`[cite: 1].
4. **Export Excel (`EXP-02` — menggunakan `exceljs`)**:
   - Buat workbook `.xlsx` dengan **3 worksheet**:
     1. `Ringkasan`: Info pengguna, periode, mata uang (IDR), Total Pemasukan, Total Pengeluaran, Selisih[cite: 1].
     2. `Per Kategori`: Tabel agregasi per kategori (Tipe, Kategori, Nominal IDR, Persentase)[cite: 1].
     3. `Transaksi`: Daftar lengkap transaksi bulan tersebut (Tanggal, Tipe, Kategori, Deskripsi, Nominal IDR)[cite: 1].
   - Set header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` dan `Content-Disposition: attachment; filename="FinManage_Laporan_YYYY-MM.xlsx"`[cite: 1].

### D. Modul Import Excel Ketat (`src/modules/imports/`)
Implementasikan fitur Import Excel sesuai Bagian 11.9 (`IMP-01` s/d `IMP-10`), `BR-19`, `16.6`, `16.9`, `18.2`, dan `18.4`[cite: 1]:
1. **Rate Limit**: Pasang rate limit **10 request per jam per user** pada `POST /imports/*` (`16.6`)[cite: 1].
2. **`GET /api/v1/imports/spec` (`IMP-01`, `18.4`)**:
   - Kembalikan spesifikasi aturan import persis seperti contoh di Bagian 18.4 (`columns`, `ignoredColumns: ["No", "Hari"]`, `limits: { maxFileBytes: 2097152, maxRows: 1000 }`)[cite: 1].
3. **`GET /api/v1/imports/template` (`IMP-02`)**:
   - Hasilkan file `.xlsx` template resmi menggunakan `exceljs` dengan susunan kolom baris 1: `Tanggal`, `Bulan`, `Tahun`, `Tipe`, `Kategori`, `Deskripsi`, `Nominal` beserta 2 baris contoh data yang valid[cite: 1].
4. **Keamanan File Upload pada `POST /api/v1/imports/transactions/preview` (`IMP-10`, `16.9`, `SEC-16`)**:
   - Gunakan `multer` memory storage (field `file`), ukuran maksimal **2 MB** (`413 FILE_TOO_LARGE` jika lebih)[cite: 1].
   - Periksa magic bytes (tanda tangan ZIP `50 4B 03 04`); jika bukan file ZIP/XLSX yang valid, tolak dengan **415 `UNSUPPORTED_FILE`**[cite: 1].
   - **Proteksi Zip Bomb (`16.9`, `SEC-16`)**: Sebelum mem-parse dengan `exceljs`, inspeksi direktori ZIP di memori; jika jumlah entri di dalam ZIP `> 100` atau total ukuran tidak terkompresi (`uncompressedSize`) `> 20 MB`, tolak dengan 400 `IMPORT_INVALID_FILE` / `IMPORT_LIMIT_EXCEEDED`[cite: 1].
   - Batasi waktu parse maksimal **15 detik**[cite: 1]. Hanya baca **sheet pertama**, maksimal **1.000 baris data** (di luar header baris 1) dan maksimal **10 kolom** (jika baris > 1.000, tolak dengan 400 `IMPORT_LIMIT_EXCEEDED`)[cite: 1]. Jangan mengevaluasi rumus (ambil nilai hasil jika sudah ada atau perlakukan sebagai teks sampai lolos validasi)[cite: 1].
5. **Validasi Nama Kolom Ketat Lebih Dulu (`IMP-03`, `IMP-04`, `BR-19`, `18.4`)**:
   - Baca baris 1, normalisasi nama kolom (trim & case-insensitive)[cite: 1].
   - Kolom yang diizinkan (`allowed`): `Tanggal`, `Bulan`, `Tahun`, `Tipe`, `Kategori`, `Deskripsi`, `Nominal`[cite: 1].
   - Kolom yang boleh ada tapi diabaikan (`ignored`): `No`, `Hari`[cite: 1].
   - Kolom wajib (`required`): `Tanggal`, `Tipe`, `Kategori`, `Deskripsi`, `Nominal`[cite: 1]. Kolom `Bulan` dan `Tahun` bersifat opsional, **tetapi wajib hadir bersama-sama** jika salah satunya ada[cite: 1].
   - Jika ada kolom di luar `allowed` + `ignored` (mis. `Jumlah`, `Barang Yang Dibeli`, `Total Rp`), ATAU ada kolom wajib yang hilang, **hentikan proses sebelum memeriksa baris** dan kembalikan **400 `IMPORT_HEADER_MISMATCH`** beserta `{ details: { allowed, ignored, required, unknown, missing } }` sesuai Bagian 18.4[cite: 1].
6. **Validasi Baris & Deteksi Duplikat pada Preview (`IMP-05` s/d `IMP-08`, `BR-19`)**:
   - **Tanggal**:
     - Mode 1 (tanpa kolom `Bulan` & `Tahun`): Sel `Tanggal` berisi tanggal lengkap (`YYYY-MM-DD`, `DD/MM/YYYY`, atau `Date` Excel)[cite: 1].
     - Mode 2 (dengan kolom `Bulan` & `Tahun`): Sel `Tanggal` berisi angka hari `1–31`, `Bulan` berisi angka `1–12` atau nama bulan Indonesia/Inggris (`Januari`..`Desember` / `January`..`December`), dan `Tahun` berisi 4 digit (`2000–2100`)[cite: 1].
     - Tanggal harus valid di kalender (mis. 31 Februari ditolak) dan **tidak boleh melewati hari ini WIB** (`BR-05`)[cite: 1].
   - **Tipe**: Terima `Pemasukan` / `Income` (-> `income`) dan `Pengeluaran` / `Expense` (-> `expense`), case-insensitive[cite: 1].
   - **Nominal**: Terima angka bulat atau string yang memuat `Rp`, spasi, dan pemisah ribuan (`.` atau `,`); hasil akhirnya wajib bilangan bulat IDR antara `1` s/d `999999999999`[cite: 1].
   - **Kategori**: Wajib terisi (`1–50` karakter)[cite: 1]. Cek terhadap kategori milik user (`name_key` + `type`); jika belum ada, masukkan nama kategori ke daftar `unknownCategories`[cite: 1].
   - **Deskripsi**: Sel boleh kosong (`null` / `""`), maksimal 255 karakter[cite: 1].
   - **Duplikat (`IMP-08`)**: Tandai baris sebagai `duplicate` jika di database user (atau di baris valid sebelumnya pada file yang sama) sudah ada transaksi dengan `(transactionDate, type, amount, description)` yang sama[cite: 1].
   - Kembalikan `{ data: { totalRows, validCount, invalidCount, duplicateCount, unknownCategories, rows } }`[cite: 1].
7. **`POST /api/v1/imports/transactions/commit` (`IMP-07`, `IMP-09`, `16.4`, `SEC-11`)**:
   - Body: `{ unknownCategoryMode: "create" | "other", skipDuplicates: boolean, rows: [...] }` (maks 1.000 baris, `.strict()`, baris **tidak boleh** membawa `id` atau `userId`)[cite: 1].
   - Server **wajib memvalidasi ulang** setiap baris[cite: 1].
   - Jalankan dalam satu **`prisma.$transaction` atomik** (`SEC-11`):
     - Untuk kategori yang belum ada di akun user: jika `unknownCategoryMode === "create"`, buat kategori baru dengan warna preset default; jika `"other"`, petakan ke kategori `Other` milik user pada tipe yang sesuai[cite: 1].
     - Lewati baris duplikat bila `skipDuplicates === true`[cite: 1].
     - Simpan seluruh transaksi valid dengan `source = 'import'`[cite: 1].
     - Evaluasi ambang budget (`90%` dan `100%`) untuk bulan/kategori pengeluaran yang terdampak dan buat notifikasi dengan `dedupe_key` bila terpicu[cite: 1].
   - Kembalikan `201 Created`: `{ data: { imported, skipped, createdCategories } }`[cite: 1].

## 3. Pengujian Otomatis Wajib (Vitest + Supertest)
Tambahkan dan jalankan suite pengujian di `backend/tests/` hingga seluruh kontrol keamanan berlabel **Wajib** berikut lulus (`16.12`):
- **`SEC-02` (Pencabutan Massal)**: Buat 2 sesi (A dan B); panggil `change-password` dari sesi A -> pastikan token lama A dan token B ditolak `401`, sedangkan token baru A diterima[cite: 1]. Uji juga `logout-all` menolak semua token[cite: 1].
- **`SEC-07` (Rate Limit Login)**: Percobaan login gagal ke-6 dari kombinasi `IP + email` yang sama dalam 15 menit menghasilkan `429 RATE_LIMITED` dengan header `Retry-After`, namun email lain dari IP yang sama tidak ikut terkunci[cite: 1].
- **`SEC-08` (Rate Limit Endpoint Lain)**: Verifikasi `register`, `change-password`, `imports/*`, dan `reports/export` menghasilkan `429` saat melewati batas[cite: 1].
- **`SEC-11` (Atomisitas Import Commit)**: Simulasikan kegagalan di tengah proses `imports/transactions/commit` dan pastikan tidak ada transaksi atau kategori baru parsial yang tersimpan di database[cite: 1].
- **`SEC-16` (Keamanan & Validasi Upload Excel)**:
  - File bukan ZIP/XLSX menghasilkan `415 UNSUPPORTED_FILE`[cite: 1].
  - Simulasi zip bomb (>100 entri atau >20 MB uncompressed) dan file > 1.000 baris ditolak `400`[cite: 1].
  - File dengan kolom `No, Hari, Tanggal, Bulan, Tahun, Barang Yang Dibeli, Jumlah, Total Rp` ditolak `400 IMPORT_HEADER_MISMATCH` dengan `unknown: ["Barang Yang Dibeli", "Jumlah", "Total Rp"]` dan `missing: ["Tipe", "Kategori", "Deskripsi", "Nominal"]`[cite: 1].
  - Preview & commit dengan format tanggal 3 kolom (`Tanggal`, `Bulan`, `Tahun`) dan nominal berformat `Rp 25.000` berhasil diimpor dengan benar[cite: 1].
- **`SEC-24` (Header & CORS)**: Pastikan respons memuat header Helmet, tidak memuat `X-Powered-By`, dan tidak memuat `Access-Control-Allow-Origin: *`[cite: 1].

## 4. Kriteria Selesai (Definition of Done)
- `npm run build`, `npx tsc --noEmit`, dan `npm test` lulus 100% tanpa error[cite: 1].