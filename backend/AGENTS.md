# AGENTS.md (backend/) — FinManage API

Aturan root di `../AGENTS.md` tetap berlaku. **Folder ini hanya boleh ditulis oleh jalur Backend.** Jangan menyentuh `mobile/` dan jangan menyentuh `frontend-finance-web/`.

## Stack (tetap, jangan diganti)

Node.js LTS, Express.js, TypeScript (strict), Prisma, PostgreSQL, Zod.

Dependency yang diizinkan:
- runtime: `express`, `zod`, `@prisma/client`, `jsonwebtoken`, `argon2` (cadangan `bcryptjs`), `helmet`, `cors`, `express-rate-limit`, `multer`, `exceljs`, `pdfkit`, `expo-server-sdk`, `pino`, `pino-http`, `dotenv`
- dev: `typescript`, `tsx`, `prisma`, `vitest`, `supertest`, `@types/*`, `eslint`, `prettier`

Dependency lain (misalnya `file-type`, library HTTP, SDK Gemini) **harus ditanyakan dulu**, dengan alasannya.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run build` | `tsc` ke `dist/` |
| `npm start` | `node dist/server.js` |
| `npm test` | `vitest run` |
| `npm run lint` | ESLint |
| `npx prisma validate` / `npx prisma migrate dev` | Skema dan migrasi lokal |

Jangan menjalankan `prisma migrate reset`, `db push` ke database selain lokal, atau menjalankan server dev yang tidak berhenti.

## Struktur

```
backend/
  prisma/            schema.prisma, migrations/, seed (nanti)
  src/
    config/          env.ts (Zod, gagal cepat)
    middleware/      auth, validate, errorHandler, rateLimit, upload
    lib/             prisma, jwt, password, dates (WIB), money, errors (AppError)
    modules/<nama>/  <nama>.routes.ts, .controller.ts, .service.ts, .schema.ts
    app.ts           rakitan Express (tanpa listen) agar mudah dites
    server.ts        listen
  tests/
  .env.example, Dockerfile, README.md
```

## Aturan kode

1. **Controller tipis, logika di service.** Controller hanya parse (Zod), panggil service, bentuk respons sesuai `docs/contract.md`.
2. **Setiap query data user memuat `userId` dari `req.auth.userId`** (dari token, tidak pernah dari body, query, atau params). Ubah dan hapus memakai `updateMany` atau `deleteMany` pada `{ id, userId }`. Milik orang lain berarti 404.
3. Skema Zod `strict()`; field tak dikenal ditolak 400.
4. Uang: bilangan bulat rupiah; hitung dengan SQL `SUM` atau tipe Decimal, **bukan float**. Operasi multi-langkah dalam `prisma.$transaction`; kunci baris target tabungan saat setoran dan penarikan.
5. Error lewat kelas `AppError(code, status, message, details)`; satu `errorHandler` global. Jangan pernah mengembalikan stack, pesan SQL atau Prisma, atau path.
6. Log hanya lewat `pino` dengan redaksi (`authorization`, `password`, `token`, `otp`, `x-api-key`). Jangan `console.log`. Jangan mencatat body auth, upload, atau isi file.
7. Bentuk respons dan kode error mengikuti `docs/contract.md`. Aturan bisnis mengikuti `docs/rules.md` (BR-xx). Skema database mengikuti `docs/data-model.md`.
8. Semua kode ditulis TypeScript strict tanpa `any` yang tidak perlu. Nama file dan identifier Inggris; pesan error untuk pengguna dalam bahasa Indonesia.
9. Setiap aturan bisnis atau kontrol keamanan baru **harus punya tes**. Tes memakai `app.ts` + Supertest dan database uji terpisah; jangan memakai database development.
10. Jangan mengubah kontrak API sendiri. Bila kontrak perlu berubah, tulis usulan di laporan dan berhenti.

## Environment (`.env.example` memuat nama saja, tanpa nilai)

`NODE_ENV`, `PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `SCAN_ENABLED`, `SCAN_DAILY_LIMIT`, `CORS_ORIGINS`. Divalidasi dengan Zod saat start; di production, `JWT_SECRET` kurang dari 32 karakter atau `CORS_ORIGINS` berisi wildcard membuat server menolak start.

## Larangan khusus

- Jangan menyimpan password, token, gambar nota, atau teks hasil OCR di database atau log.
- Jangan menaruh rahasia di kode, contoh, atau tes.
- Jangan membuat endpoint di luar `docs/contract.md`.
