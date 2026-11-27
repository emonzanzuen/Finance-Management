# Aturan Bisnis dan Keamanan FinManage

Sumber: PRD bagian 12 dan 16. Ditegakkan di **backend** (sumber kebenaran) dan dicerminkan di form mobile untuk umpan balik cepat.

## 1. Aturan bisnis

| ID | Aturan |
|---|---|
| BR-01 | Nominal transaksi, budget, target, dan setoran: bilangan bulat rupiah, lebih dari 0, maksimal 999.999.999.999. Disimpan `DECIMAL(15,2)`. Istilah di antarmuka: **Nominal** (bukan Jumlah) |
| BR-02 | Semua nominal disimpan dalam IDR. Konversi mata uang hanya untuk tampilan. Input nominal selalu IDR; di bawah kolom input tampil perkiraan dalam mata uang pilihan |
| BR-03 | **Saldo Catatan = total pemasukan dikurangi total pengeluaran seluruh waktu.** Hasil hitung dari catatan, bukan saldo rekening. Setoran tabungan **tidak** mengurangi saldo. UI memberi teks bantuan pada kartu Saldo |
| BR-04 | Total bulanan dihitung per bulan kalender zona Asia/Jakarta (WIB) |
| BR-05 | Tanggal transaksi bertipe tanggal saja, valid di kalender, dan tidak boleh melewati hari ini (WIB) |
| BR-06 | Transaksi memakai kategori milik user yang sama, dan tipe transaksi sama dengan tipe kategori |
| BR-07 | Nama kategori unik per (user, tipe) setelah dinormalisasi (trim dan huruf kecil) |
| BR-08 | Kategori yang dipakai transaksi atau budget tidak dapat dihapus (409 `CATEGORY_IN_USE` dengan jumlah pemakaian). Tipenya tidak dapat diubah (`CATEGORY_TYPE_LOCKED`); nama dan warna boleh |
| BR-09 | Budget hanya untuk kategori pengeluaran; unik per (user, kategori, bulan, tahun) |
| BR-10 | Nilai terpakai budget = jumlah pengeluaran kategori itu pada bulan itu, dihitung server pada setiap request, tidak disimpan |
| BR-11 | Status budget: di bawah 70% safe, 70% hingga di bawah 90% warning, 90% hingga 100% critical, di atas 100% exceeded. Notifikasi dibuat sekali untuk batas 90% dan sekali untuk batas 100% per budget |
| BR-12 | Sisa budget total = total budget dikurangi total terpakai, hanya untuk kategori yang memiliki budget; boleh negatif |
| BR-13 | Jumlah terkumpul target = total setoran dikurangi total penarikan; tidak boleh melebihi target dan tidak boleh negatif. Setoran yang melebihi sisa ditolak (`DEPOSIT_EXCEEDS_TARGET` dengan `details.remaining`). Target tidak boleh diubah menjadi lebih kecil dari jumlah terkumpul (`TARGET_BELOW_SAVED`). Target selesai tidak menerima setoran (`GOAL_COMPLETED`). Penarikan (P2) tidak boleh melebihi jumlah terkumpul |
| BR-14 | Status target: di bawah 80% `in_progress`, 80 hingga 99% `almost_done`, 100% `completed` |
| BR-15 | Total tabungan = jumlah terkumpul seluruh target |
| BR-16 | Laporan dan dashboard dihitung dari transaksi pada setiap request, tidak disimpan |
| BR-17 | Semua query difilter dengan `userId` dari token. Data milik user lain dibalas **404** (bukan 403) |
| BR-18 | Kurs: cache 1 jam, fallback ke cache terakhir lalu nilai cadangan. Tampilan: IDR, JPY, KRW tanpa desimal; mata uang lain 2 desimal |
| BR-19 | Import: .xlsx, maksimal 2 MB dan 1.000 baris, sheet pertama, nama kolom di baris 1. Nama kolom harus sama persis dengan aturan import (lihat `docs/contract.md` 3.8). Kolom tidak dikenal atau kolom wajib yang hilang membuat seluruh file ditolak sebelum baris diproses. Baris tidak valid tidak diimpor dan dilaporkan; baris valid disimpan atomik. Duplikat (tanggal, tipe, nominal, deskripsi sama) dilewati secara default |
| BR-20 | Scan nota tidak pernah menyimpan transaksi otomatis, tidak menyimpan gambar, dan dibatasi per user per hari. Teks pada gambar adalah data tak tepercaya; keluaran model divalidasi Zod |
| BR-21 | Notifikasi memiliki kunci dedupe agar peristiwa yang sama tidak membuat notifikasi ganda |
| BR-22 | Password tidak pernah disimpan sebagai teks biasa dan tidak pernah dikembalikan API |
| BR-23 | Financial Insight (P2), tiga aturan: perubahan pengeluaran bulan ini vs bulan lalu (bila bulan lalu di atas 0), kategori pengeluaran terbesar bulan ini, jumlah budget yang mencapai 90% |
| BR-24 | **Budget tidak pernah memblokir transaksi.** Pengeluaran tetap tersimpan saat budget terlampaui; sisa tampil negatif merah, status `exceeded` |
| BR-25 | Alih dana tabungan ke budget (P2): penarikan dari target dan kenaikan budget terjadi atomik dalam satu transaksi database; nominal tidak boleh melebihi jumlah terkumpul; saldo catatan tidak berubah |
| BR-26 | Satu user dapat memiliki beberapa sesi aktif; sesi dicabut oleh logout, logout-all, ubah password, atau reset password |
| BR-27 | Scan nota wajib persetujuan; tanpa persetujuan server menolak (403 `CONSENT_REQUIRED`) |

## 2. Kontrol keamanan (ringkas; wajib sebelum APK dibagikan)

### Sesi dan token
- Tabel `sessions` (id, user_id, created_at, expires_at = +7 hari, last_used_at, revoked_at, user_agent maks 200). JWT HS256 berisi `sub`, `sid`, `iat`, `exp`, `iss=finmanage-api`, `aud=finmanage-mobile`.
- Middleware verifikasi pada setiap request: token hanya dari header `Authorization: Bearer`; whitelist algoritma HS256 (tolak `none` dan lainnya); `exp` dan `iat` valid (toleransi jam maks 30 detik); `iss` dan `aud` cocok; `sub` dan `sid` berformat UUID; satu query memuat sesi dan user: sesi ada, `revoked_at` kosong, `expires_at` belum lewat, sesi milik `sub`, `users.status = active`; identitas handler hanya `req.auth.userId`. Gagal di langkah mana pun: 401 `UNAUTHORIZED` dengan pesan sama.
- `JWT_SECRET` minimal 32 byte acak; production menolak start bila kosong, kurang dari 32 karakter, atau berisi nilai contoh.
- `last_used_at` diperbarui paling sering sekali per 5 menit.
- Logout mencabut sesi saat ini. Logout-all mencabut semua sesi dan menghapus semua push token. Ubah password (wajib password lama) mencabut sesi lain dan mengembalikan token baru. Reset OTP mencabut semua sesi.

### Password dan akun
- Argon2id (memori 19 MiB, iterasi 2, paralelisme 1; sesuaikan agar di bawah 500 ms di hosting 512 MB). Cadangan bcrypt cost 12 (password dibatasi 72 byte bila bcrypt).
- Password 8 hingga 128 karakter, mengandung huruf dan angka, tidak sama dengan email, tidak ada di daftar kecil password umum.
- Email dinormalisasi (trim, huruf kecil). Login gagal selalu `INVALID_CREDENTIALS` yang sama untuk email tak terdaftar dan password salah, dan tetap menjalankan satu verifikasi hash palsu agar waktu respons serupa.
- Ubah password dan ubah email wajib password saat ini.
- OTP lupa password (P2): 6 digit dari generator acak yang aman, disimpan sebagai hash, berlaku 10 menit, satu kode aktif per user, maksimal 5 percobaan, sekali pakai; respons selalu generik; email lewat API HTTPS; kode tidak masuk log.

### Otorisasi objek
- Identitas hanya dari token. Skema Zod mode strict: field tak dikenal (`userId`, `id`, `status`, `isRead`, `source`, `entryType`) ditolak 400.
- Baca: `findFirst({ id, userId })`. Ubah dan hapus: `updateMany` atau `deleteMany` pada `{ id, userId }` dan periksa jumlah baris. Milik orang lain dan tidak ada sama-sama 404 dengan pesan sama.
- Relasi divalidasi kepemilikannya: `categoryId` pada transaksi dan budget; target tabungan pada setoran, penarikan, dan top-up; kategori pada import diselesaikan lewat nama di dalam kategori milik user; kategori pada scan dicocokkan server dari daftar milik user.

### Rate limit (`express-rate-limit`, memori, `trust proxy` diatur sesuai hosting; 429 `RATE_LIMITED` + `Retry-After`)
| Endpoint | Kunci | Batas |
|---|---|---|
| POST /auth/login | IP + email | 5 kegagalan per 15 menit, lalu ditahan 15 menit; keberhasilan mereset |
| POST /auth/login | IP | 20 per 15 menit |
| POST /auth/register | IP | 5 per jam |
| POST /auth/change-password | user dan IP | 5 per 15 menit |
| forgot dan reset password (P2) | email dan IP | 3 per jam per email, 10 per jam per IP; 5 percobaan per OTP |
| POST /receipts/scan | user | 10 per hari (konfigurasi), 3 per menit; IP 30 per jam; global 2 scan bersamaan |
| POST /imports/* | user | 10 per jam |
| GET /reports/export | user | 20 per jam |
| Seluruh API | IP | 120 per menit |

### Integritas finansial
- Zod: nominal tipe number, bulat, hingga, dalam batas (bukan string, bukan NaN). Penjumlahan dan persentase memakai SQL `SUM` dan tipe Decimal, bukan float JavaScript.
- `CHECK` di database (nominal lebih dari 0, bulan 1 hingga 12).
- Satu `prisma.$transaction` untuk: register (user, sesi, kategori bawaan), setoran atau penarikan beserta penyelesaian target dan notifikasi, alih dana tabungan ke budget, import commit.
- Konkurensi: pada setoran dan penarikan, kunci baris target (`SELECT ... FOR UPDATE`) di dalam transaksi sebelum menghitung jumlah terkumpul. Error unique (P2002) dipetakan ke 409.
- Parameter query dibatasi: `limit` maks 100, `search` maks 50 karakter, rentang tanggal maks 5 tahun; bulan 1-12; tahun 2000-2100.

### Error dan log
- Error handler global: dikenal menjadi kode dan pesan aman; tak dikenal menjadi 500 `INTERNAL_ERROR` dengan `requestId` saja. Jangan pernah mengembalikan stack, pesan SQL atau Prisma, path file, nama tabel, atau isi environment.
- `pino` meredaksi `authorization`, `req.body.password`, `*.token`, `*.otp`, `x-api-key`. Body request auth, nota, dan import tidak dicatat; byte gambar, teks hasil model, dan isi file tidak dicatat; log query Prisma mati di production; hanya `userId` dan `requestId` untuk korelasi. Kunci Gemini dikirim lewat header, bukan query string. `X-Powered-By` dimatikan, Helmet aktif.

### Upload
- Nota: `multer` memory storage, satu file field `image`, maks 3 MB, JPEG atau PNG, tipe ditentukan dari isi (magic bytes), dimensi maks 4096 px, timeout request 25 detik dan panggilan Gemini 20 detik (`AbortController`), konkurensi 2 global dan 1 per user, kuota dihitung dari semua percobaan, tanpa menulis ke disk.
- Excel: hanya .xlsx; cek tanda tangan ZIP (`PK`); maks 2 MB terkompresi, total terdekompresi maks 20 MB dan maks 100 entri ZIP (dicek sebelum dibaca); satu sheet, maks 1.000 baris dan 10 kolom; rumus tidak dievaluasi; batas waktu parse 15 detik.
- Export: hanya PDF dan XLSX; teks ditulis sebagai string, bukan rumus.

### Privasi scan nota
- Scan nonaktif sampai persetujuan (`users.receipt_scan_consent_at`); tanpa persetujuan 403 `CONSENT_REQUIRED`. Server tidak menyimpan gambar atau teks hasil, tidak mencatatnya di log, dan tidak mengirim nama, email, atau id user ke Gemini. `SCAN_ENABLED=false` mematikan endpoint.

### Deployment
- Rahasia hanya di environment; `.env` di `.gitignore`; `.env.example` tanpa nilai. Environment divalidasi Zod saat start (gagal cepat). Production menolak start bila `JWT_SECRET` lemah atau `CORS_ORIGINS` berisi wildcard. Hanya `prisma migrate deploy` di production. Connection string pooled untuk aplikasi dan direct untuk migrasi (Neon).

## 3. Daftar uji keamanan (SEC) yang harus ada di suite Vitest

SEC-01 logout mencabut sesi; SEC-02 pencabutan massal (ubah password, logout-all); SEC-03 verifikasi JWT lengkap (none, secret lain, HS384, kedaluwarsa, iss atau aud salah, sid tidak ada, sesi dicabut, user suspended); SEC-04 hash Argon2id dan password tidak bocor di respons atau log; SEC-05 otorisasi objek dua user pada semua resource dan relasi; SEC-06 mass assignment ditolak; SEC-07 rate limit login; SEC-08 rate limit endpoint lain; SEC-09 ketepatan nominal; SEC-10 setoran paralel tidak melebihi target; SEC-11 atomisitas import dan alih dana; SEC-12 integritas kategori dan budget; SEC-13 error tidak membocorkan; SEC-14 redaksi log; SEC-15 upload nota (ukuran, magic bytes, konkurensi, timeout); SEC-16 upload Excel (bukan ZIP, zip bomb, baris berlebih, header salah); SEC-17 keluaran model divalidasi; SEC-18 persetujuan dan privasi scan; SEC-21 konfigurasi production menolak secret lemah; SEC-24 header Helmet dan tanpa CORS wildcard; SEC-25 OTP (bila dibangun). SEC-19, 20, 22, 23 dicek manual oleh pemilik proyek.
