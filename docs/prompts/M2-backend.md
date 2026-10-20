# Prompt M2 — Modul Kurs Mata Uang, Penyelarasan Kontrak P0, Seed Data Demo, & Deploy

## 1. Peran & Konteks
Anda adalah Backend AI Agent untuk proyek **FinManage Android V1**.
- Kerjakan seluruh kode HANYA di dalam folder `backend/`.
- DILARANG mengubah folder `frontend-finance-web/` maupun `mobile/`.
- Pada M1, fondasi Auth, Categories, Transactions, Budgets, Savings, Dashboard, dan Reports sudah dibangun. Fokus M2 adalah membangun modul **Currencies**, memastikan kontrak JSON untuk layar-layar P0 Mobile (Dashboard, Budget, Savings, Reports) 100% sesuai spesifikasi Bagian 18, menyiapkan skrip **Seed Data Demo**, serta memastikan kesiapan **Dockerfile & Deployment**.

## 2. Ruang Lingkup Pekerjaan M2

### A. Modul Kurs Mata Uang (`src/modules/currencies/`)
Implementasikan endpoint `GET /api/v1/currencies` (wajib autentikasi Bearer token) sesuai Bagian 8.6, 11.11 (`CUR-01`, `CUR-02`), 17.2 (`exchange_rate_cache`), dan `BR-18`:
1. **Logika Cache Lazy (TTL 1 Jam)**:
   - Saat `GET /api/v1/currencies` dipanggil, periksa baris di tabel `exchange_rate_cache` dengan `id = 1`.
   - Jika baris ada dan selisih `now - fetched_at < 1 jam`, langsung kembalikan data dari database[cite: 1].
   - Jika baris belum ada atau sudah berusia `>= 1 jam`, panggil API publik `https://open.er-api.com/v6/latest/IDR` (gunakan timeout ~5–8 detik agar tidak menahan request jika layanan eksternal lambat)[cite: 1].
   - Simpan/perbarui (`upsert`) baris `id = 1`, `base_code = 'IDR'`, `rates` (JSONB), dan `fetched_at = now()`[cite: 1].
2. **Mekanisme Fallback Berlapis (`BR-18`, Bagian 13)**:
   - Kegagalan API kurs eksternal **tidak boleh** mengembalikan error 500 atau merusak aplikasi[cite: 1].
   - Jika panggilan ke `open.er-api.com` gagal: gunakan data terakhir di `exchange_rate_cache` meskipun sudah lewat 1 jam (tandai `source: "stale_cache"`)[cite: 1].
   - Jika tabel cache masih kosong saat API gagal: gunakan konstanta kurs cadangan di kode (`source: "fallback"`)[cite: 1].
3. **Daftar Mata Uang & Format Respons**:
   - Sertakan mata uang P0 (`IDR`, `USD`, `EUR`) dan siapkan dukungan daftar 12 mata uang (`IDR`, `USD`, `EUR`, `SGD`, `MYR`, `JPY`, `GBP`, `AUD`, `SAR`, `CNY`, `KRW`, `THB`) agar tidak perlu merombak endpoint di M3 (`CUR-01`)[cite: 1].
   - Kembalikan struktur `{ "data": { "base": "IDR", "fetchedAt": "...", "isFallback": false, "rates": { "IDR": 1, "USD": ..., "EUR": ..., ... } } }`[cite: 1].

### B. Audit & Penyelarasan Kontrak Endpoint P0 (Bagian 18.2 & 18.4)
Periksa kembali dan pastikan keempat modul di bawah ini mengembalikan field JSON yang persis dibutuhkan oleh layar Mobile P0:
1. **`GET /api/v1/dashboard/summary?month=&year=`**:
   - Wajib mengembalikan: `period: { month, year }`, `balance` (total pemasukan dikurangi total pengeluaran sepanjang waktu; setoran tabungan **tidak** mengurangi saldo sesuai `BR-03`), `income` (bulan terpilih), `expense` (bulan terpilih), `totalSavings` (total seluruh setoran semua target sesuai `BR-15`), `expenseByCategory` (array berisi `{ categoryId, name, color, amount, percentage }`), `trend` (array 6 bulan berurutan hingga bulan terpilih berisi `{ month, year, income, expense }`), dan `recentTransactions` (5 transaksi terbaru beserta objek `category`)[cite: 1].
2. **`GET /api/v1/budgets?month=&year=`**:
   - Wajib mengembalikan: `month`, `year`, `summary: { totalBudget, totalSpent, remaining, percentage }`, dan `items: [{ id, category: { id, name, color }, budgetAmount, spentAmount, remaining, percentage, status }]`[cite: 1].
   - Pastikan `summary.totalSpent` dan `summary.remaining` **hanya** menghitung pengeluaran pada kategori yang memiliki budget di bulan tersebut, dan nilai `remaining` boleh negatif (`BR-12`, `BR-24`)[cite: 1].
   - Pastikan `status` bernilai: `safe` (< 70%), `warning` (70% hingga < 90%), `critical` (90% hingga 100%), atau `exceeded` (> 100%) (`BR-11`)[cite: 1].
3. **`GET /api/v1/savings-goals` & `GET /api/v1/savings-goals/:id`**:
   - Daftar target mengembalikan ringkasan total tabungan/progres keseluruhan (`SAV-04`) serta daftar item target dengan `id`, `title`, `targetAmount`, `savedAmount` (dihitung dari setoran), `remainingAmount`, `percentage`, `deadline`, `completedAt`, dan `status` (`in_progress` < 80%, `almost_done` 80–99%, `completed` 100% sesuai `BR-14`)[cite: 1].
4. **`GET /api/v1/reports/monthly?month=&year=` & `GET /api/v1/reports/trend?year=`**:
   - `/reports/monthly`: Mengembalikan `period: { month, year }`, `summary: { income, expense, net }`, `expenseByCategory` (untuk Pie Chart `REP-03`), dan `incomeByCategory` (untuk Bar Chart `REP-04`, masing-masing item memiliki `{ categoryId, name, color, amount, percentage }`)[cite: 1].
   - `/reports/trend`: Mengembalikan array 12 bulan (bulan 1 s/d 12 pada `year` terpilih) berisi `{ month, year, income, expense }` untuk Line Chart `REP-05`[cite: 1].

### C. Skrip Seed Akun Demo (`prisma/seed.ts`)
Buat skrip seed yang idempoten (aman dijalankan berulang kali) sesuai Bagian 16.11 dan 22.5[cite: 1]:
- Buat akun demo (baca password dari env `DEMO_USER_PASSWORD` atau generate password acak yang kuat dan cetak ke terminal jika di lokal)[cite: 1].
- Salin 13 kategori bawaan (`CAT-01`)[cite: 1].
- Isi data transaksi contoh yang tersebar di **minimal 4–6 bulan terakhir** hingga bulan berjalan (Oktober 2026) agar grafik tren 6 bulan di Beranda (`DASH-04`) dan tren 12 bulan di Laporan (`REP-05`) langsung terlihat jelas saat diuji di HP[cite: 1].
- Isi contoh Budget pada bulan berjalan yang mewakili 4 status: `safe` (<70%), `warning` (70–89%), `critical` (90–100%), dan `exceeded` (>100%)[cite: 1].
- Isi 3 contoh Savings Goals yang mewakili status Sedang berjalan (<80%), Hampir selesai (80–99%), dan Selesai (100%) beserta riwayat setorannya[cite: 1].

### D. Kesiapan Deploy (`Dockerfile` & Konfigurasi Production)
- Pastikan `Dockerfile` di `backend/` menggunakan image Node LTS slim, menjalankan `npx prisma generate`, mem-build TypeScript, dan pada saat start menjalankan `npx prisma migrate deploy` sebelum menyalakan server (`22.2`)[cite: 1].
- Pastikan server membaca `PORT` dari environment dan validasi Zod startup menolak jalan di `NODE_ENV=production` bila `JWT_SECRET` kurang dari 32 karakter atau `CORS_ORIGINS` berisi `*` (`16.11`, `SEC-21`)[cite: 1].

## 3. Pengujian Otomatis Wajib (Vitest + Supertest)
Tambahkan pengujian di `backend/tests/` untuk memverifikasi:
1. **Modul Currencies**: Mengembalikan kurs dengan benar, memakai cache dalam 1 jam, dan tetap mengembalikan HTTP 200 dengan nilai fallback/stale cache saat fetch eksternal disimulasikan gagal (`CUR-02`, `BR-18`)[cite: 1].
2. **Konsistensi Angka 0 Selisih (Metrik 4.4)**: Buat skenario uji dengan sejumlah transaksi pemasukan & pengeluaran, budget, dan setoran tabungan; verifikasi bahwa angka `balance`, `income`, `expense`, `spentAmount` budget, dan agregasi `/reports/monthly` serta `/dashboard/summary` memiliki **0 selisih**[cite: 1].
3. **Budget Terlampaui (`BR-24`)**: Saat transaksi pengeluaran baru membuat pemakaian budget > 100%, transaksi tetap tersimpan (201), status budget berubah menjadi `exceeded`, nilai `remaining` menjadi negatif, dan notifikasi `budget_exceeded` terbuat tepat satu kali (`BR-11`, `BR-21`)[cite: 1].

## 4. Kriteria Selesai (Definition of Done)
- `npm run build`, `npx tsc --noEmit`, dan `npm test` lulus 100%[cite: 1].
- Skrip `npx prisma db seed` berjalan lancar tanpa error[cite: 1].