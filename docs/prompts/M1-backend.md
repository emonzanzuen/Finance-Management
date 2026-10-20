# Prompt M1 — Backend Inti, Transaksi, dan Pengujian Keamanan Dasar

## 1. Peran & Konteks
Anda adalah Backend AI Agent untuk proyek **FinManage Android V1**.
- Kerjakan seluruh kode HANYA di dalam folder `backend/`.
- JANGAN menyentuh atau mengubah folder `frontend-finance-web/` (hanya baca bila perlu referensi kategori awal/validasi) dan jangan mengubah folder `mobile/`.
- Acuan utama Anda adalah `docs/PRD-FinManage-Android-V1.md` (khususnya Bagian 12 Aturan Bisnis, Bagian 16 Keamanan, Bagian 17 Database Schema, dan Bagian 18 REST API Specification).

## 2. Aturan Arsitektur & Konvensi Ketat
1. **Struktur Modul**: Gunakan pola `routes`, `controller` (tipis), `service` (tempat seluruh logika bisnis), dan `schema` (validasi Zod dengan `.strict()` untuk menolak field tak dikenal seperti `userId`, `id`, `status`, `isRead`, `source`, `entryType`) di dalam `backend/src/modules/`.
2. **Format Respons & Error**:
   - Base URL: `/api/v1`.
   - Sukses: `{ "data": ... }` atau `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`.
   - Error: `{ "error": { "code", "message", "details" } }` melalui global error handler. Error tak dikenal membalas 500 `INTERNAL_ERROR` hanya dengan `requestId` tanpa membocorkan stack trace, pesan SQL/Prisma, atau path file.
3. **Keamanan & Logging**:
   - Pasang `helmet`, matikan `X-Powered-By`, konfigurasi `cors` ketat, dan pasang `express-rate-limit` sesuai tabel Bagian 16.6 (login IP+email 5 gagal/15 menit, login IP 20/15 menit, register 5/jam, global 120/menit)[cite: 1].
   - Gunakan `pino` dengan redaksi pada `authorization`, `req.body.password`, `*.token`, `*.otp`, dan `x-api-key`[cite: 1]. Jangan pernah mencatat email, nominal, atau body auth ke log[cite: 1].
4. **Integritas Finansial & Zona Waktu**:
   - Semua nominal disimpan sebagai `DECIMAL(15,2)` dalam IDR, namun input API wajib bilangan bulat rupiah antara `1` s/d `999999999999` (bukan float, bukan string, bukan NaN)[cite: 1].
   - Gunakan SQL `SUM` / tipe `Decimal` untuk perhitungan, jangan gunakan float JavaScript[cite: 1].
   - Gunakan zona waktu `Asia/Jakarta` (WIB) untuk batas tanggal hari ini dan perhitungan bulan kalender (`BR-04`, `BR-05`)[cite: 1].
   - Selalu filter query dengan `userId` dari `req.auth.userId` (`BR-17`)[cite: 1]. Akses ke objek milik pengguna lain atau tidak ditemukan wajib membalas **404** `NOT_FOUND` dengan pesan yang sama[cite: 1].

## 3. Ruang Lingkup Pekerjaan M1

### A. Database Schema & Migrasi (`prisma/`)
Pastikan seluruh tabel inti di `schema.prisma` dan migrasi SQL sudah mencakup:
- `users`, `sessions`, `categories`, `transactions`, `budgets`, `savings_goals`, `savings_deposits`, `notifications`, `device_tokens`, `exchange_rate_cache`, `receipt_scans`[cite: 1].
- Tambahkan constraint `CHECK` melalui file migrasi SQL mentah: `amount > 0`, `budget_amount > 0`, `target_amount > 0`, dan `month BETWEEN 1 AND 12`[cite: 1].

### B. Modul Auth (`modules/auth`) & Profile (`modules/profile`)
- **Hash Password**: Argon2id (memori 19 MiB, iterasi 2, paralelisme 1) atau fallback bcrypt cost 12[cite: 1]. Kebijakan password: 8–128 karakter, wajib huruf + angka, tolak jika sama dengan email atau masuk daftar password umum[cite: 1].
- `POST /api/v1/auth/register`: Dalam satu `prisma.$transaction`, buat user (email lowercase + trim), hash password, salin kategori bawaan (`CAT-01`: Pemasukan = Salary, Freelance, Bonus, Investment, Other; Pengeluaran = Food, Transportation, Shopping, Bills, Entertainment, Education, Health, Other), dan buat baris `sessions` (berlaku 7 hari)[cite: 1]. Kembalikan JWT (`sub`, `sid`, `iat`, `exp`, `iss: 'finmanage-api'`, `aud: 'finmanage-mobile'`) dan objek user (201)[cite: 1].
- `POST /api/v1/auth/login`: Validasi kredensial (jalankan verifikasi hash palsu jika email tidak ditemukan agar waktu respons konsisten, balas 401 `INVALID_CREDENTIALS`), buat sesi baru, kembalikan token & user[cite: 1].
- `POST /api/v1/auth/logout`: Cabut sesi saat ini dengan mengisi `revoked_at` (204)[cite: 1].
- **Middleware Auth**: Verifikasi header `Authorization: Bearer`, whitelist algoritma `HS256`, klaim `iss` & `aud`, format UUID pada `sub` & `sid`, serta query sesi aktif (`revoked_at IS NULL`, belum kedaluwarsa, milik `sub`, dan `users.status === 'active'`). Perbarui `last_used_at` maksimal sekali per 5 menit[cite: 1].
- `GET /api/v1/profile`: Kembalikan profil user beserta statistik dasar (total transaksi, jumlah target, total tabungan)[cite: 1].

### C. Modul Categories (`modules/categories`)
- `GET /api/v1/categories?type=`: Daftar kategori milik user[cite: 1].
- `POST /api/v1/categories`: Tambah kategori; simpan `name_key` (trim + huruf kecil); tolak duplikat per `(userId, type, nameKey)` dengan 409 `CATEGORY_DUPLICATE` (`BR-07`)[cite: 1].
- `PATCH /api/v1/categories/:id`: Ubah nama atau warna (`#RRGGBB`); jika kategori sudah dipakai transaksi atau budget, perubahan `type` wajib ditolak dengan 400/409 `CATEGORY_TYPE_LOCKED` (`CAT-06`, `BR-08`)[cite: 1].
- `DELETE /api/v1/categories/:id`: Cek pemakaian di `transactions` dan `budgets`; jika dipakai, tolak dengan 409 `CATEGORY_IN_USE` beserta `{ details: { transactionCount, budgetCount } }` (`CAT-05`, `BR-08`)[cite: 1].

### D. Modul Transactions (`modules/transactions`)
- `GET /api/v1/transactions`: Paginasi (`page` default 1, `limit` default 20 maks 100), filter `type`, `categoryId`, `search` (deskripsi & nama kategori, maks 50 karakter), `dateFrom`, `dateTo` (maks rentang 5 tahun), serta `sortBy` (`transactionDate` | `amount`) dan `sortOrder` (`asc` | `desc`)[cite: 1].
- `GET /api/v1/transactions/:id`: Detail satu transaksi milik user[cite: 1].
- `POST /api/v1/transactions`, `PATCH /api/v1/transactions/:id`, `DELETE /api/v1/transactions/:id`:
  - Validasi `categoryId` milik user dan `category.type === transaction.type` (`BR-06`)[cite: 1].
  - Validasi `transactionDate` tidak melewati hari ini WIB (`BR-05`)[cite: 1].
  - Budget **tidak pernah** memblokir transaksi (`BR-24`)[cite: 1].
  - Setelah tambah/ubah transaksi pengeluaran, hitung ulang pemakaian budget kategori tersebut pada bulan/tahun terkait; jika mencapai >= 90% atau > 100%, buat notifikasi (`budget_warning` / `budget_exceeded`) dengan `dedupe_key` unik agar tidak ganda (`BR-11`, `BR-21`)[cite: 1].

### E. Modul Budgets (`modules/budgets`)
- `GET /api/v1/budgets?month=&year=`: Hitung dinamis `spentAmount`, `remaining` (boleh negatif), `percentage`, dan `status` (`safe` < 70%, `warning` 70–89.99%, `critical` 90–100%, `exceeded` > 100%) dari tabel transaksi (`BR-10`, `BR-11`, `BR-12`)[cite: 1].
- `POST /api/v1/budgets`: Hanya untuk kategori bertipe `expense` (`BR-09`); tolak duplikat `(userId, categoryId, month, year)` dengan 409 `BUDGET_DUPLICATE`[cite: 1].
- `PATCH /api/v1/budgets/:id` & `DELETE /api/v1/budgets/:id`[cite: 1].

### F. Modul Savings Goals (`modules/savings`)
- `GET /api/v1/savings-goals` & `GET /api/v1/savings-goals/:id`: Hitung jumlah terkumpul dari riwayat setoran (`BR-13`) dan status (`in_progress` < 80%, `almost_done` 80–99%, `completed` 100%) (`BR-14`)[cite: 1].
- `POST /api/v1/savings-goals`, `PATCH /api/v1/savings-goals/:id` (tolak jika `targetAmount` baru lebih kecil dari jumlah terkumpul -> 400 `TARGET_BELOW_SAVED`), `DELETE /api/v1/savings-goals/:id`[cite: 1].
- `POST /api/v1/savings-goals/:id/deposits`: Gunakan `prisma.$transaction` dan kunci baris target (`SELECT ... FOR UPDATE`) untuk mencegah race condition (`SEC-10`)[cite: 1]. Tolak jika target sudah selesai (`GOAL_COMPLETED`) atau jika setoran melebihi sisa target (`DEPOSIT_EXCEEDS_TARGET` beserta `{ details: { remaining } }`) (`SAV-06`, `BR-13`)[cite: 1]. Jika mencapai 100%, isi `completed_at` dan buat notifikasi `goal_completed` dengan `dedupe_key`[cite: 1].
- `DELETE /api/v1/savings-goals/:id/deposits/:depositId`: Hapus setoran keliru dan sesuaikan kembali `completed_at` bila perlu (`SAV-03`)[cite: 1].

### G. Modul Dashboard & Reports (`modules/dashboard`, `modules/reports`)
- `GET /api/v1/dashboard/summary?month=&year=`: Kembalikan `balance` (total pemasukan - total pengeluaran sepanjang waktu, setoran tabungan tidak mengurangi saldo sesuai `BR-03`), `income` & `expense` bulan tersebut, `totalSavings`, `expenseByCategory`, `trend` (6 bulan terakhir), dan 5 `recentTransactions`[cite: 1].
- `GET /api/v1/reports/monthly?month=&year=` & `GET /api/v1/reports/trend?year=` (12 bulan)[cite: 1].

## 4. Pengujian Otomatis Wajib (Vitest + Supertest)
Buat suite pengujian di `backend/tests/` yang memverifikasi:
- **Keamanan Dasar**: `SEC-01` (logout mencabut sesi), `SEC-03` (verifikasi JWT lengkap: algoritma none/HS384/expired/revoked/suspended ditolak 401), `SEC-04` (hash Argon2id & password tidak bocor), `SEC-05` (isolasi objek antar user membalas 404 & larangan pakai `categoryId`/target user lain), `SEC-06` (mass assignment ditolak 400), `SEC-09` (ketepatan nominal & 10.000 transaksi uji), `SEC-10` (10 setoran paralel tidak melebihi target), `SEC-12` (integritas kategori & budget), `SEC-13` (error tidak bocor stack/Prisma), dan `SEC-14` (redaksi log)[cite: 1].

## 5. Kriteria Selesai (Definition of Done)
- `npm run build` dan `tsc --noEmit` berjalan bersih tanpa error[cite: 1].
- Seluruh tes Vitest + Supertest untuk M1 lulus 100%[cite: 1].
