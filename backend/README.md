# FinManage Backend API

REST API untuk aplikasi Android **FinManage** (Express + TypeScript + Prisma + PostgreSQL).

## Prasyarat

- Node.js `>= 20` (LTS)
- PostgreSQL (lokal atau layanan seperti Neon)

## Menjalankan Lokal

1. Masuk ke folder backend dan pasang dependensi:
   ```bash
   cd backend
   npm install
   ```
2. Salin `.env.example` menjadi `.env` lalu isi variabel yang dibutuhkan. Saat development dengan Neon, isi `DIRECT_URL` memakai connection string langsung (unpooled); untuk PostgreSQL lokal, variabel ini boleh dikosongkan.
   ```bash
   cp .env.example .env
   ```
3. Hasilkan Prisma Client dan terapkan migrasi ke database lokal:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Endpoint pemeriksaan status tersedia di `GET http://localhost:3000/api/v1/health`.

## Skrip NPM

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan (`tsx watch src/server.ts`) |
| `npm run build` | Kompilasi TypeScript ke folder `dist/` |
| `npm start` | Menjalankan hasil build (`node dist/server.js`) |
| `npm test` | Menjalankan suite pengujian (`vitest run`) |
| `npm run lint` | Memeriksa kode dengan ESLint |
| `npm run typecheck` | Memeriksa tipe TypeScript (`tsc --noEmit`) |
| `npm run format` | Memformat kode dengan Prettier |

## Variabel Environment

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `NODE_ENV` | Tidak | `development` | `development`, `test`, atau `production` |
| `PORT` | Tidak | `3000` | Port HTTP server |
| `DATABASE_URL` | Ya | - | Connection string PostgreSQL (pooled pada production/Neon) |
| `DIRECT_URL` | Prod | - | Connection string PostgreSQL langsung (Neon unpooled) untuk migrasi; opsional di development dan wajib di production |
| `JWT_SECRET` | Ya | - | Kunci rahasia JWT (di production wajib minimal 32 karakter acak dan bukan nilai contoh) |
| `JWT_EXPIRES_IN` | Tidak | `7d` | Masa berlaku akses token JWT |
| `GEMINI_API_KEY` | Tidak | - | Kunci API Gemini untuk fitur scan nota |
| `GEMINI_MODEL` | Tidak | - | Nama model Gemini yang digunakan |
| `SCAN_ENABLED` | Tidak | `false` | Mengaktifkan/menonaktifkan fitur scan nota (`true`/`false`) |
| `SCAN_DAILY_LIMIT` | Tidak | `10` | Kuota harian scan nota per pengguna |
| `CORS_ORIGINS` | Tidak | `""` | Daftar origin yang diizinkan dipisah koma (di production dilarang memakai `*`) |
| `TRUST_PROXY` | Tidak | `1` | Jumlah hop reverse proxy untuk penentuan IP rate-limit |
| `DEMO_USER_PASSWORD` | Seed demo | - | Password akun demo; wajib disetel di production. Di lokal, seed dapat membuat password acak satu kali jika kosong. |

## Data Demo

Setel `DEMO_USER_PASSWORD` untuk memilih password akun `demo@finmanage.local`, lalu jalankan:

```bash
npx prisma db seed
```

Seed membuat atau memperbarui akun demo, 13 kategori, transaksi enam bulan, empat status budget, dan tiga status target tabungan. Seed aman diulang. Jika password tidak diisi di lingkungan lokal, perintah menampilkan password acak satu kali; simpan di tempat aman. Untuk database hosting, atur `DEMO_USER_PASSWORD` secara eksplisit dan cabut atau hapus akun demo setelah demo.

## Menerapkan Migrasi

- **Lokal / Development**: Pastikan `DATABASE_URL` (dan `DIRECT_URL` bila memakai pooler) mengarah ke database lokal atau dev, lalu jalankan:
  ```bash
  npx prisma migrate deploy
  ```
  *(Atau `npx prisma migrate dev` saat menambahkan perubahan skema baru).*
- **Production**: Hanya gunakan `npx prisma migrate deploy` (otomatis dijalankan pada startup container di `Dockerfile`). Jangan pernah menjalankan `migrate reset` atau `db push` ke database production.

## Catatan Deploy (SnapDeploy / Container)

- Build menggunakan `Dockerfile` multi-stage berbasis `node:22-slim` dengan `openssl` terpasang dan berjalan sebagai user non-root `node`.
- Paket `prisma` CLI berada di `dependencies` sehingga perintah start container `sh -c "npx prisma migrate deploy && node dist/server.js"` dapat langsung mengeksekusi migrasi sebelum server membuka port `PORT`.
- Pastikan seluruh variabel wajib (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` kuat >= 32 karakter) diatur pada environment hosting; server akan gagal cepat (fail-fast) bila validasi gagal.
