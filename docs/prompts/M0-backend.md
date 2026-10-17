# Prompt M0 — Backend
**Agent:** agy · **Model:** Claude Opus 5.5 · **Effort:** medium · **Folder tulis:** `backend/` saja

---

## PERAN

Kamu adalah senior backend engineer. Tugasmu: membangun **fondasi** REST API FinManage (aplikasi pencatat keuangan pribadi untuk Android) di folder `backend/`. Ini tahap M0: **hanya kerangka, konfigurasi, skema database, dan endpoint `/health`**. Belum ada endpoint bisnis.

## BACA DULU (hanya ini, hemat token)

1. `AGENTS.md` (root) dan `backend/AGENTS.md`
2. `docs/data-model.md` (seluruhnya)
3. `docs/rules.md` bagian 2: subbagian Error dan log, Deployment, Rate limit, dan Sesi dan token (hanya untuk konteks; belum diimplementasikan)
4. `docs/contract.md` bagian 1 (Konvensi) dan baris `/health`

**Jangan membaca:** `frontend-finance-web/` (read-only, dilarang diubah), `mobile/`, PRD lengkap, `node_modules`.

## TUGAS

1. **Inisialisasi proyek** di `backend/`: `package.json` (nama `finmanage-backend`, `engines.node >= 20`, CommonJS, target ES2022), `tsconfig.json` strict, skrip sesuai tabel perintah di `backend/AGENTS.md`, ESLint dan Prettier dasar. Pasang hanya dependency yang diizinkan di `backend/AGENTS.md`. Pindahkan paket `prisma` (CLI) ke `dependencies` agar `npx prisma migrate deploy` bisa dipakai di image production.

2. **`src/config/env.ts`**: validasi Zod dan fungsi `parseEnv(source)` yang dapat dites. Variabel: `NODE_ENV` (development, test, production), `PORT` (default 3000), `DATABASE_URL`, `DIRECT_URL` (opsional di development dan test), `JWT_SECRET`, `JWT_EXPIRES_IN` (default `7d`), `GEMINI_API_KEY` dan `GEMINI_MODEL` (opsional), `SCAN_ENABLED` (default false), `SCAN_DAILY_LIMIT` (default 10), `CORS_ORIGINS` (daftar dipisah koma, default kosong), `TRUST_PROXY` (jumlah hop, default 1). Aturan production: `JWT_SECRET` minimal 32 karakter dan bukan nilai contoh; `CORS_ORIGINS` tidak boleh berisi `*`. Pelanggaran membuat proses gagal cepat dengan pesan yang tidak menampilkan nilai rahasia.

3. **Kesalahan dan middleware**:
   - `src/lib/errors.ts`: kelas `AppError(code, status, message, details?)` dan tipe union kode error sesuai `docs/contract.md` bagian 1.
   - `src/middleware/errorHandler.ts`: `AppError` menjadi respons sesuai kontrak; `ZodError` menjadi 400 `VALIDATION_ERROR` dengan `details` berisi path field (tanpa nilai input); JSON rusak menjadi 400; error tak dikenal menjadi 500 `INTERNAL_ERROR` hanya dengan `requestId` (tanpa stack, SQL, path). Handler `notFound` menghasilkan 404 `NOT_FOUND`.
   - `requestId` dibuat dengan `crypto.randomUUID()` per request dan dikirim di header `X-Request-Id`.

4. **`src/app.ts`** (`createApp()` tanpa `listen`) dan **`src/server.ts`**: nonaktifkan `x-powered-by`, atur `trust proxy` dari env, Helmet, CORS dengan allowlist dari env (kosong berarti tidak mengizinkan origin lintas situs), `express.json({ limit: '100kb' })`, `pino-http` dengan **redaksi** `authorization`, `password`, `token`, `otp`, `x-api-key` dan tanpa mencatat body, rate limit umum 120 permintaan per menit per IP, router di `/api/v1`, `notFound`, lalu `errorHandler`. `server.ts` membaca env, listen pada `PORT`, dan menutup Prisma dengan rapi saat sinyal berhenti.

5. **`GET /api/v1/health`** (tanpa auth, tanpa query database): `200` dengan `{ "data": { "status": "ok", "time": "<ISO>" } }`.

6. **`prisma/schema.prisma`** sesuai `docs/data-model.md`: semua model, enum, relasi, `onDelete`, unique, index, dan `@@map` serta `@map` ke `snake_case`. Datasource: `url = env("DATABASE_URL")` dan `directUrl = env("DIRECT_URL")`. Tambahkan `src/lib/prisma.ts` (singleton Prisma Client).

7. **Migrasi awal tanpa database**: hasilkan SQL dengan `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` ke `prisma/migrations/<timestamp>_init/migration.sql`, tambahkan `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`), lalu **tambahkan di akhir file SQL** constraint `CHECK`: `transactions.amount > 0`, `budgets.budget_amount > 0`, `budgets.month BETWEEN 1 AND 12`, `savings_goals.target_amount > 0`, `savings_deposits.amount > 0`. Jangan menjalankan `migrate dev` atau `migrate reset`; pemilik proyek yang menerapkan migrasi ke databasenya.

8. **`Dockerfile` dan `.dockerignore`** (untuk hosting SnapDeploy; **jangan menjalankan docker**): image `node:20-slim` atau LTS yang sama dengan `engines`, pasang `openssl`, `npm ci`, `npx prisma generate`, `npm run build`, jalankan sebagai user non-root `node`, baca port dari `PORT`, perintah start `sh -c "npx prisma migrate deploy && node dist/server.js"`.

9. **`.env.example`** (nama variabel saja, tanpa nilai rahasia), **`.gitignore`** backend (`node_modules`, `dist`, `.env`, `*.log`, `coverage`), dan **`README.md`** singkat: cara menjalankan lokal, daftar skrip, daftar env, cara menerapkan migrasi, dan catatan deploy.

10. **Tes (Vitest + Supertest, tanpa database)**:
    - `tests/health.test.ts`: `GET /api/v1/health` 200 dan bentuk respons benar; tidak ada header `X-Powered-By`; ada header Helmet (misalnya `X-Content-Type-Options`); header `X-Request-Id` ada; rute tak dikenal menghasilkan 404 berbentuk error kontrak.
    - `tests/env.test.ts`: production menolak `JWT_SECRET` pendek atau nilai contoh, menolak `CORS_ORIGINS` berisi `*`, dan menolak `DATABASE_URL` yang hilang; development menerima konfigurasi minimal.
    - `tests/errors.test.ts`: error tak dikenal menghasilkan 500 generik tanpa stack, SQL, atau path (cek bahwa body tidak memuat kata `prisma`, `at ` baris stack, atau path folder); `ZodError` menghasilkan 400 tanpa nilai input; semua respons error memuat `requestId`.

## BATASAN

- Jangan membuat endpoint selain `/health`. Jangan mengimplementasikan auth, sesi, atau modul bisnis.
- Jangan menyentuh `frontend-finance-web/` dan `mobile/`. Jangan menambah dependency di luar daftar tanpa bertanya.
- Jangan menjalankan server yang tidak berhenti, docker, deploy, atau perintah destruktif.
- Jangan menaruh nilai rahasia di file mana pun.

## VERIFIKASI (jalankan dan tampilkan hasilnya)

```
cd backend
npm run build
npm test
npm run lint
npx prisma validate
npx prisma generate
cd ..
git diff --stat -- frontend-finance-web     # harus kosong
```

## FORMAT LAPORAN AKHIR (bahasa Indonesia)

1. Daftar file yang dibuat.
2. Keluaran ringkas tiap perintah verifikasi (lulus atau gagal, jumlah tes).
3. Keputusan yang kamu ambil di luar instruksi, dan alasannya.
4. Hal yang harus dilakukan pemilik proyek (misalnya mengisi `.env`, menerapkan migrasi ke database lokal atau Neon).
5. Hal yang belum selesai atau perlu usulan perubahan kontrak.
