# Kontrak API FinManage (sumber tunggal untuk backend dan mobile)

Sumber: PRD bagian 18. Bila ada konflik dengan PRD, tanyakan pemilik proyek. Bentuk resource yang tidak tercantum di PRD ditetapkan di sini.

## 1. Konvensi

- Base path `/api/v1`. JSON UTF-8 (kecuali upload multipart dan unduhan file).
- Auth: `Authorization: Bearer <token>` di semua endpoint kecuali yang bertanda Publik.
- Path kebab-case, field JSON camelCase. Tanggal `YYYY-MM-DD`; timestamp ISO 8601 UTC. ID berupa UUID.
- Nominal: angka JSON bilangan bulat rupiah (IDR). Mata uang lain hanya untuk tampilan di klien.
- Sukses: `{ "data": ..., "meta": ... }` (`meta` hanya untuk daftar berhalaman). 204 tanpa body.
- Paginasi: `page` (default 1), `limit` (default 20, maks 100). `meta`: `{ page, limit, total, totalPages }`.
- Error: `{ "error": { "code", "message", "details" } }`. Server tidak pernah mengirim stack atau pesan SQL.

Status: 200, 201, 204, 400 (validasi atau aturan bisnis), 401, 403 (`CONSENT_REQUIRED`), 404 (tidak ada atau bukan milik user), 409, 413, 415, 429 (dengan `Retry-After`), 500, 503.

Kode error: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `NOT_FOUND`, `CATEGORY_DUPLICATE`, `CATEGORY_IN_USE`, `CATEGORY_TYPE_LOCKED`, `BUDGET_DUPLICATE`, `DEPOSIT_EXCEEDS_TARGET`, `GOAL_COMPLETED`, `TARGET_BELOW_SAVED`, `WITHDRAWAL_EXCEEDS_SAVED`, `TOPUP_EXCEEDS_SAVED`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE`, `IMPORT_HEADER_MISMATCH`, `IMPORT_INVALID_FILE`, `IMPORT_LIMIT_EXCEEDED`, `CONSENT_REQUIRED`, `RATE_LIMITED`, `SCAN_QUOTA_EXCEEDED`, `SCAN_FAILED`, `OTP_INVALID_OR_EXPIRED`, `INTERNAL_ERROR`.

Pesan error ditulis dalam bahasa Indonesia; aplikasi menerjemahkan berdasarkan `code`.

## 2. Endpoint

Prioritas: P0 inti, P1 peningkatan, P2 terakhir.

| Method | Endpoint | Tujuan | Auth | Prio |
|---|---|---|---|---|
| GET | `/health` | Status server | Publik | P0 |
| POST | `/auth/register` | Daftar, buat sesi (201) | Publik | P0 |
| POST | `/auth/login` | Masuk, buat sesi | Publik | P0 |
| POST | `/auth/logout` | Cabut sesi ini (204) | Ya | P0 |
| POST | `/auth/logout-all` | Cabut semua sesi dan push token (204) | Ya | P1 |
| POST | `/auth/change-password` | Ubah password, cabut sesi lain, token baru | Ya | P1 |
| POST | `/auth/forgot-password` | Kirim OTP, respons selalu generik | Publik | P2 |
| POST | `/auth/reset-password` | Password baru dengan OTP, cabut semua sesi | Publik | P2 |
| GET | `/profile` | Profil dan statistik | Ya | P0 |
| PATCH | `/profile` | Ubah nama, avatar, email (email butuh password saat ini) | Ya | P1 |
| GET | `/currencies` | Mata uang dan kurs terhadap IDR | Ya | P0 |
| GET | `/categories?type=` | Daftar kategori | Ya | P0 |
| POST | `/categories` | Tambah | Ya | P0 |
| PATCH | `/categories/:id` | Ubah nama atau warna (tipe terkunci bila dipakai) | Ya | P0 |
| DELETE | `/categories/:id` | Hapus; 409 bila dipakai | Ya | P0 |
| GET | `/transactions` | Daftar (lihat 3.3) | Ya | P0 |
| GET | `/transactions/:id` | Detail | Ya | P1 |
| POST | `/transactions` | Tambah (201) | Ya | P0 |
| PATCH | `/transactions/:id` | Ubah | Ya | P0 |
| DELETE | `/transactions/:id` | Hapus (204) | Ya | P0 |
| GET | `/budgets?month=&year=` | Budget bulan itu, ringkasan, terpakai | Ya | P0 |
| POST | `/budgets` | Tambah (201) | Ya | P0 |
| PATCH | `/budgets/:id` | Ubah nominal | Ya | P0 |
| DELETE | `/budgets/:id` | Hapus (204) | Ya | P0 |
| POST | `/budgets/:id/top-up` | Tambah budget: `amount`, `source` (`manual`, atau `savings` + `goalId`) | Ya | P1 (savings: P2) |
| GET | `/savings-goals` | Daftar target dan ringkasan | Ya | P0 |
| GET | `/savings-goals/:id` | Detail dan riwayat | Ya | P0 |
| POST | `/savings-goals` | Tambah (201) | Ya | P0 |
| PATCH | `/savings-goals/:id` | Ubah judul, target, deadline | Ya | P0 |
| DELETE | `/savings-goals/:id` | Hapus beserta riwayat (204) | Ya | P0 |
| POST | `/savings-goals/:id/deposits` | Setor (201) | Ya | P0 |
| DELETE | `/savings-goals/:id/deposits/:entryId` | Hapus setoran keliru (204) | Ya | P1 |
| POST | `/savings-goals/:id/withdrawals` | Tarik tabungan (201) | Ya | P2 |
| GET | `/dashboard/summary?month=&year=` | Kartu, grafik, terbaru, insight | Ya | P0 |
| GET | `/reports/monthly?month=&year=` | Ringkasan dan agregasi per kategori | Ya | P0 |
| GET | `/reports/trend?year=` | Tren 12 bulan | Ya | P0 |
| GET | `/reports/export` | Unduh laporan biner; query `format` (pdf atau xlsx), `month`, `year` | Ya | P1 |
| GET | `/imports/spec` | Aturan import | Ya | P1 |
| GET | `/imports/template` | Unduh template .xlsx | Ya | P1 |
| POST | `/imports/transactions/preview` | Unggah .xlsx (field `file`), periksa kolom lalu baris, tanpa menyimpan | Ya | P1 |
| POST | `/imports/transactions/commit` | Simpan baris valid (201) | Ya | P1 |
| POST | `/receipts/consent` | Setujui scan nota (204) | Ya | P2 |
| DELETE | `/receipts/consent` | Cabut persetujuan (204) | Ya | P2 |
| POST | `/receipts/scan` | Unggah foto (field `image`), hasil usulan | Ya | P2 |
| GET | `/notifications?page=&limit=&unreadOnly=` | Daftar | Ya | P1 |
| PATCH | `/notifications/:id/read` | Tandai terbaca | Ya | P1 |
| POST | `/notifications/read-all` | Tandai semua | Ya | P1 |
| POST | `/devices` | Daftarkan push token | Ya | P2 |
| DELETE | `/devices/:token` | Cabut push token | Ya | P2 |

## 3. Bentuk data

### 3.1 Auth dan profil

```json
// POST /auth/register  { name, email, password }  -> 201
// POST /auth/login     { email, password }        -> 200
{ "data": { "token": "<jwt>", "user": { "id": "uuid", "name": "Budi", "email": "budi@example.com", "avatar": null } } }

// POST /auth/change-password { currentPassword, newPassword } -> 200
{ "data": { "token": "<jwt baru>" } }

// GET /profile
{ "data": { "id": "uuid", "name": "Budi", "email": "budi@example.com", "avatar": null,
  "receiptScanConsent": false,
  "stats": { "transactionCount": 134, "savingsGoalCount": 2, "totalSavings": 1500000 } } }
```

JWT berisi `sub`, `sid`, `iat`, `exp`, `iss` (`finmanage-api`), `aud` (`finmanage-mobile`). Klien memperlakukan token sebagai string buram.

### 3.2 Kategori, transaksi, budget

```json
// Category
{ "id": "uuid", "name": "Food", "type": "expense", "color": "#F59E0B" }

// POST /transactions  (PATCH: semua field opsional)
{ "type": "expense", "categoryId": "uuid", "amount": 45000, "transactionDate": "2026-10-16", "description": "Makan siang" }
// Transaction (respons)
{ "id": "uuid", "type": "expense", "amount": 45000, "transactionDate": "2026-10-16",
  "description": "Makan siang", "source": "manual",
  "category": { "id": "uuid", "name": "Food", "color": "#F59E0B" }, "createdAt": "2026-10-16T05:12:00Z" }

// POST /budgets { categoryId, month, year, budgetAmount }    PATCH { budgetAmount }
// GET /budgets?month=10&year=2026
{ "data": { "month": 10, "year": 2026,
  "summary": { "totalBudget": 3000000, "totalSpent": 1950000, "remaining": 1050000, "percentage": 65 },
  "items": [ { "id": "uuid", "category": { "id": "uuid", "name": "Food", "color": "#F59E0B" },
    "budgetAmount": 1500000, "spentAmount": 1425000, "remaining": 75000, "percentage": 95, "status": "critical" } ] } }
```

`status`: `safe` (di bawah 70%), `warning` (70% sampai di bawah 90%), `critical` (90% sampai 100%), `exceeded` (di atas 100%). `remaining` boleh negatif. Transaksi tidak pernah ditolak karena budget.

### 3.3 Daftar transaksi

`GET /transactions` query: `page`, `limit`, `type`, `categoryId`, `search` (maks 50 karakter), `dateFrom`, `dateTo`, `sortBy` (`transactionDate` atau `amount`), `sortOrder` (`asc` atau `desc`). Respons: `data` berupa array Transaction, dan `meta` paginasi.

### 3.4 Tabungan

```json
// GET /savings-goals
{ "data": { "items": [ { "id": "uuid", "title": "Laptop", "targetAmount": 10000000, "currentAmount": 2500000,
    "remaining": 7500000, "percentage": 25, "status": "in_progress", "deadline": "2027-03-01", "completedAt": null } ],
  "summary": { "totalTarget": 10000000, "totalSaved": 2500000, "percentage": 25 } } }
// status: in_progress (di bawah 80), almost_done (80 sampai 99), completed (100)

// GET /savings-goals/:id  -> goal + riwayat
{ "data": { "id": "uuid", "title": "Laptop", "targetAmount": 10000000, "currentAmount": 2500000, "remaining": 7500000,
  "percentage": 25, "status": "in_progress", "deadline": null, "completedAt": null,
  "entries": [ { "id": "uuid", "entryType": "deposit", "amount": 500000, "depositDate": "2026-10-16", "note": "Sisa gaji" } ] } }

// POST /savings-goals { title, targetAmount, deadline? }
// POST /savings-goals/:id/deposits    { amount, depositDate, note? } -> 201 { data: { entry, goal } }
// POST /savings-goals/:id/withdrawals { amount, depositDate, note? } -> 201 { data: { entry, goal } }

// Melebihi sisa -> 400
{ "error": { "code": "DEPOSIT_EXCEEDS_TARGET", "message": "Setoran melebihi sisa target.", "details": { "remaining": 250000 } } }
```

### 3.5 Dashboard dan laporan

```json
// GET /dashboard/summary?month=10&year=2026
{ "data": { "period": { "month": 10, "year": 2026 },
  "balance": 8250000, "income": 5000000, "expense": 2100000, "totalSavings": 1500000,
  "expenseByCategory": [ { "categoryId": "uuid", "name": "Food", "color": "#F59E0B", "amount": 900000, "percentage": 42.9 } ],
  "trend": [ { "month": 5, "year": 2026, "income": 4800000, "expense": 2300000 } ],
  "recentTransactions": [],
  "insights": [ { "type": "expense_change", "direction": "up", "percent": 12.5 } ] } }

// GET /reports/monthly?month=&year=
{ "data": { "period": { "month": 10, "year": 2026 }, "income": 5000000, "expense": 2100000, "difference": 2900000,
  "expenseByCategory": [ { "categoryId": "uuid", "name": "Food", "color": "#F59E0B", "amount": 900000, "percentage": 42.9 } ],
  "incomeByCategory": [ { "categoryId": "uuid", "name": "Salary", "color": "#10B981", "amount": 5000000, "percentage": 100 } ] } }

// GET /reports/trend?year=2026  (12 elemen)
{ "data": { "year": 2026, "months": [ { "month": 1, "income": 0, "expense": 0 } ] } }
```

`balance` = total pemasukan dikurangi total pengeluaran seluruh waktu (saldo catatan, bukan saldo rekening). `trend` pada dashboard berisi 6 bulan terakhir. `insights.type`: `expense_change`, `top_category`, `budgets_near_limit`.

### 3.6 Mata uang

```json
{ "data": { "base": "IDR", "updatedAt": "2026-10-16T05:00:00Z", "source": "live",
  "currencies": [ { "code": "USD", "name": "US Dollar", "symbol": "$", "decimals": 2, "rate": 0.0000606 } ] } }
```

`rate` = jumlah unit mata uang per 1 IDR. `source`: `live`, `cache`, atau `fallback`. Daftar: IDR, USD, EUR, SGD, MYR, JPY, GBP, AUD, SAR, CNY, KRW, THB.

### 3.7 Notifikasi dan perangkat

```json
{ "data": [ { "id": "uuid", "type": "budget_warning", "isRead": false, "createdAt": "2026-10-16T05:00:00Z",
  "data": { "budgetId": "uuid", "categoryName": "Food", "percentage": 92, "month": 10, "year": 2026 } } ],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1, "unreadCount": 2 } }
```

`type`: `budget_warning` dan `budget_exceeded` (data: budgetId, categoryName, percentage, month, year), serta `goal_completed` (data: goalId, title). Aplikasi menyusun teks sesuai bahasa. `POST /devices` body: `{ "expoPushToken": "ExponentPushToken[...]", "locale": "id" }`.

### 3.8 Import Excel

Template dan susunan kolom: **Tanggal, Bulan, Tahun, Tipe, Kategori, Deskripsi, Nominal**. Wajib ada: Tanggal, Tipe, Kategori, Deskripsi, Nominal. Tanggal boleh satu kolom lengkap (YYYY-MM-DD, DD/MM/YYYY, atau tanggal Excel) atau tiga kolom Tanggal (hari 1-31), Bulan (1-12 atau nama bulan), Tahun (4 digit); Bulan dan Tahun harus hadir bersama. Kolom `No` dan `Hari` diabaikan. Kolom lain ditolak. Urutan bebas; huruf besar-kecil dan spasi tepi diabaikan. Maksimal 1.000 baris dan 2 MB. Sel Tipe, Kategori, tanggal, dan Nominal tidak boleh kosong; sel Deskripsi boleh kosong.

```json
// GET /imports/spec
{ "data": { "columns": [
    { "name": "Tanggal", "required": true, "format": "Tanggal lengkap, atau angka hari 1-31 bila Bulan dan Tahun dipakai" },
    { "name": "Bulan", "required": false, "format": "Angka 1-12 atau nama bulan; wajib bersama Tahun" },
    { "name": "Tahun", "required": false, "format": "4 digit; wajib bersama Bulan" },
    { "name": "Tipe", "required": true, "allowed": [ "Pemasukan", "Pengeluaran" ] },
    { "name": "Kategori", "required": true },
    { "name": "Deskripsi", "required": true, "maxLength": 255, "emptyCellAllowed": true },
    { "name": "Nominal", "required": true, "format": "Bilangan bulat rupiah lebih dari 0" } ],
  "ignoredColumns": [ "No", "Hari" ],
  "limits": { "maxFileBytes": 2097152, "maxRows": 1000 } } }

// Header salah -> 400, seluruh file ditolak sebelum baris diproses
{ "error": { "code": "IMPORT_HEADER_MISMATCH", "message": "Nama kolom pada file tidak sesuai aturan import.",
  "details": { "allowed": [ "Tanggal", "Bulan", "Tahun", "Tipe", "Kategori", "Deskripsi", "Nominal" ],
    "ignored": [ "No", "Hari" ], "required": [ "Tanggal", "Tipe", "Kategori", "Deskripsi", "Nominal" ],
    "unknown": [ "Jumlah", "Barang Yang Dibeli", "Total Rp" ], "missing": [ "Tipe", "Kategori", "Deskripsi", "Nominal" ] } } }

// POST /imports/transactions/preview -> 200 (multipart, field "file")
{ "data": { "totalRows": 120, "validCount": 112, "invalidCount": 5, "duplicateCount": 3, "unknownCategories": [ "Kopi" ],
  "rows": [ { "row": 2, "status": "valid", "type": "expense", "category": "Food", "amount": 25000,
              "transactionDate": "2026-09-30", "description": "Bakso", "duplicate": false },
            { "row": 7, "status": "invalid", "errors": [ "Tanggal tidak dikenali" ] } ] } }

// POST /imports/transactions/commit -> 201 (server memvalidasi ulang setiap baris; baris tidak membawa id)
{ "unknownCategoryMode": "create", "skipDuplicates": true,
  "rows": [ { "type": "expense", "category": "Food", "amount": 25000, "transactionDate": "2026-09-30", "description": "Bakso" } ] }
{ "data": { "imported": 112, "skipped": 8, "createdCategories": [ "Kopi" ] } }
```

`unknownCategoryMode`: `create` atau `other`. Nilai `type` pada preview dan commit: `income` atau `expense`.

### 3.9 Scan nota

```json
// POST /receipts/scan (multipart, field "image", JPEG atau PNG maks 3 MB) -> 200
{ "data": { "type": "expense", "amount": 87500, "transactionDate": "2026-10-15",
  "description": "Indomaret - belanja", "suggestedCategoryId": "uuid", "confidence": "medium", "warnings": [] } }
```

Tanpa persetujuan: 403 `CONSENT_REQUIRED`. Kuota habis: 429 `SCAN_QUOTA_EXCEEDED`. Gagal: 503 `SCAN_FAILED`. Hasil hanya usulan; klien tidak boleh menyimpan otomatis.

### 3.10 Export

`GET /reports/export` mengembalikan berkas biner dengan `Content-Disposition: attachment; filename=FinManage_Laporan_2026-10.xlsx` (atau `.pdf`). Nominal selalu IDR.
