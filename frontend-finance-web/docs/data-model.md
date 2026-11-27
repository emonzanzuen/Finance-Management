# Model Data FinManage (PostgreSQL + Prisma)

Sumber: PRD bagian 17. Nama tabel dan kolom `snake_case` di database, dipetakan ke `camelCase` di Prisma (`@map`, `@@map`).

## Prinsip

- Primary key `UUID` (`gen_random_uuid()`). Waktu `TIMESTAMPTZ`; tanggal transaksi, setoran, deadline bertipe `DATE`. Nominal `DECIMAL(15,2)`.
- Prisma tidak mendukung `CHECK` langsung: tambahkan lewat SQL mentah pada file migrasi (nominal lebih dari 0, bulan 1 hingga 12).
- Setiap tabel data user memiliki `user_id` terindeks. Data turunan (saldo, terpakai, progres, laporan, jumlah terkumpul) **tidak** punya kolom.
- Tidak ada `token_version`; pencabutan token lewat tabel `sessions`.

## Enum

`CategoryType(income, expense)`, `TransactionSource(manual, scan, import)`, `UserStatus(active, suspended)`, `SavingsEntryType(deposit, withdrawal)`, `NotificationType(budget_warning, budget_exceeded, goal_completed)`, `ScanStatus(success, failed)`.

## Tabel

**users**: id PK; name VARCHAR(100) NN; email VARCHAR(255) NN UNIQUE (huruf kecil); password_hash TEXT NN; avatar_data TEXT NULL (data URI maks sekitar 100 KB); status UserStatus NN default active; receipt_scan_consent_at TIMESTAMPTZ NULL; created_at, updated_at NN.

**sessions**: id PK (menjadi `sid` di JWT); user_id FK users CASCADE; created_at NN; expires_at NN (created_at + 7 hari); last_used_at NN; revoked_at NULL; user_agent VARCHAR(200) NULL. Index (user_id, revoked_at), (expires_at). Sesi kedaluwarsa dan yang dicabut lebih dari 30 hari dibersihkan berkala.

**password_resets** (P2): id PK; user_id FK CASCADE; code_hash TEXT NN; expires_at NN (10 menit); attempts SMALLINT NN default 0 (maks 5); used_at NULL; created_at NN. Index (user_id, created_at DESC).

**categories**: id PK; user_id FK CASCADE; name VARCHAR(50) NN; name_key VARCHAR(50) NN (trim + huruf kecil); type CategoryType NN; color CHAR(7) NN (#RRGGBB); created_at, updated_at. UNIQUE (user_id, type, name_key). Index (user_id, type).

**transactions**: id PK; user_id FK CASCADE; category_id FK categories **RESTRICT**; type CategoryType NN (harus sama dengan tipe kategori; divalidasi service); amount DECIMAL(15,2) NN CHECK > 0; transaction_date DATE NN; description VARCHAR(255) NULL; source TransactionSource NN default manual; created_at, updated_at. Index (user_id, transaction_date DESC), (user_id, type, transaction_date), (user_id, category_id, transaction_date).

**budgets**: id PK; user_id FK CASCADE; category_id FK categories RESTRICT; month SMALLINT NN CHECK 1-12; year SMALLINT NN; budget_amount DECIMAL(15,2) NN CHECK > 0; created_at, updated_at. UNIQUE (user_id, category_id, month, year). Index (user_id, year, month).

**savings_goals**: id PK; user_id FK CASCADE; title VARCHAR(100) NN; target_amount DECIMAL(15,2) NN CHECK > 0; deadline DATE NULL; completed_at TIMESTAMPTZ NULL; created_at, updated_at. Index (user_id).

**savings_deposits** (setoran dan penarikan): id PK; goal_id FK savings_goals CASCADE; user_id FK CASCADE; entry_type SavingsEntryType NN default deposit; amount DECIMAL(15,2) NN CHECK > 0; deposit_date DATE NN; note VARCHAR(255) NULL; created_at NN. Index (goal_id), (user_id). Jumlah terkumpul = SUM(deposit) dikurangi SUM(withdrawal).

**notifications**: id PK; user_id FK CASCADE; type NotificationType NN; data JSONB NN; dedupe_key VARCHAR(100) NN; is_read BOOLEAN NN default false; created_at NN. UNIQUE (user_id, dedupe_key). Index (user_id, is_read, created_at DESC). Teks tidak disimpan; aplikasi menyusunnya dari type dan data.

**device_tokens**: id PK; user_id FK CASCADE; expo_push_token VARCHAR(255) NN UNIQUE; platform VARCHAR(20) NN default android; locale VARCHAR(5) NN default id; created_at, last_seen_at NN.

**exchange_rate_cache** (satu baris): id SMALLINT PK (selalu 1); base_code CHAR(3) NN default IDR; rates JSONB NN; fetched_at TIMESTAMPTZ NN.

**receipt_scans** (kuota harian): id PK; user_id FK CASCADE; status ScanStatus NN; created_at NN. Index (user_id, created_at).

## Relasi

users 1-N sessions, password_resets, categories, transactions, budgets, savings_goals, savings_deposits, notifications, device_tokens, receipt_scans. categories 1-N transactions dan budgets. savings_goals 1-N savings_deposits.

## Aturan kepemilikan dan penghapusan

- Semua query difilter `userId` dari token.
- Kategori tidak dapat dihapus selama dirujuk transaksi atau budget (FK `RESTRICT`; service mengembalikan 409 yang informatif).
- Menghapus target ikut menghapus riwayat (`CASCADE`). Menghapus transaksi dan budget adalah hapus permanen.
- Kategori bawaan disalin per user dalam transaksi database yang sama dengan pembuatan user: pemasukan (Salary, Freelance, Bonus, Investment, Other), pengeluaran (Food, Transportation, Shopping, Bills, Entertainment, Education, Health, Other), dengan warna preset.
