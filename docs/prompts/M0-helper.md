# Prompt M0 — Tugas ringan
**Agent:** opencode · **Model:** Big Pickle (gratis) · **Folder tulis:** hanya `README.md`, `.gitignore`, dan `docs/demo-checklist.md` di root repositori

---

## PERAN

Kamu membantu merapikan dokumen dasar repositori FinManage (aplikasi pencatat keuangan Android). Tugas ini kecil dan hanya menyentuh tiga file dokumentasi. **Jangan membuat atau mengubah kode.**

## BACA DULU (hanya ini)

1. `AGENTS.md` (root)
2. Daftar folder di root repositori (hanya nama folder, jangan isinya)

**Jangan membaca atau mengubah:** `frontend-finance-web/` (read-only, dilarang diubah, termasuk `.gitignore` miliknya), `backend/`, `mobile/`, dan PRD.

## TUGAS

1. **`README.md` (root, bahasa Indonesia)**: apa itu FinManage (pencatat keuangan pribadi, bukan alat transaksi); tabel struktur folder (`frontend-finance-web/` website lama read-only, `mobile/`, `backend/`, `docs/`); cara menjalankan backend lokal (`cd backend`, salin `.env.example` menjadi `.env`, isi nilai, `npm install`, `npm run dev`); cara menjalankan mobile di Expo Go (`cd mobile`, salin `.env.example` menjadi `.env`, isi `EXPO_PUBLIC_API_URL`, `npm install`, `npx expo start`, pindai QR); aturan bahwa `frontend-finance-web/` tidak boleh diubah; daftar dokumen di `docs/` (`contract.md`, `rules.md`, `data-model.md`, `screens.md`, `prompts/`). Tulis perintah apa adanya; jangan mengarang fitur atau perintah yang belum ada.

2. **`.gitignore` (root)**: abaikan `node_modules/`, `dist/`, `build/`, `coverage/`, `.expo/`, `.env`, `.env.*` (kecuali `.env.example`), `*.log`, `android/`, `ios/`, `google-services.json`, `*.jks`, `*.keystore`, `*.pem`, `*.sql` hasil dump (`dumps/`), `.DS_Store`, `Thumbs.db`, folder editor (`.idea/`, `.vscode/` kecuali berkas konfigurasi bersama bila ada). **Jangan menyentuh `.gitignore` di dalam `frontend-finance-web/`.**

3. **`docs/demo-checklist.md`**: daftar periksa sebelum demo, berisi persis butir berikut dalam bentuk kotak centang:
   - Server hosting dibangunkan lewat `/api/v1/health` satu sampai dua menit sebelum demo (atau backend lokal berjalan).
   - Akun demo berisi data contoh dan kredensialnya tertulis di catatan pribadi (bukan di repositori).
   - APK terpasang di HP cadangan; baterai dan kuota internet cukup.
   - Rekaman layar demo tersedia sebagai cadangan.
   - Satu `pg_dump` sudah dibuat dan restore sudah diuji.
   - Urutan demo: Register atau Login, catat transaksi, scan nota, budget berubah, tabungan, laporan, export dan import, push.

## BATASAN

- Jangan menyentuh file lain, jangan menjalankan `npm install`, dan jangan menjalankan perintah apa pun selain membaca daftar folder dan `git status`.
- Jangan menulis rahasia atau nilai `.env` di dokumen.

## LAPORAN AKHIR (bahasa Indonesia, singkat)

Daftar tiga file yang dibuat dan hasil `git diff --stat -- frontend-finance-web` (harus kosong).
