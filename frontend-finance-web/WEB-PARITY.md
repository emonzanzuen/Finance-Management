# Kesejajaran Website dan Aplikasi Android (FinManage)

Dokumen ini mencatat kesenjangan antara website (React + Vite) dan PRD Android V1, status upgrade, dan sisa pekerjaan.
Sumber kebenaran fitur: `PRD-FinManage-Android-V1`. Sumber kebenaran API: backend yang berjalan (lihat bagian 5).

## 1. Prinsip

- Website memakai **REST API yang sama** dengan aplikasi Android. Data keuangan tidak lagi disimpan di LocalStorage.
- Aturan bisnis mengikuti `docs/rules.md` (BR-xx). Server tetap sumber kebenaran; form web hanya memberi umpan balik cepat.
- Tampilan lama (Tailwind, TailGrids, komponen UI, tema, bahasa) dipertahankan. Yang berubah adalah lapisan data, autentikasi, dan halaman yang sudah dimigrasikan.
- Perbedaan platform yang disengaja: web memakai sidebar, tabel, dan paginasi (Android: bottom tab, kartu, infinite scroll).

## 2. Status per modul

Legenda: **Selesai** = sudah memakai API dan lolos uji render; **Lama** = masih halaman LocalStorage lama (belum dimigrasikan).

| Modul (PRD Android) | Kondisi website sebelumnya | Status sekarang | Sisa pekerjaan |
|---|---|---|---|
| Autentikasi: register, login, logout, sesi, 401 (P0) | Login demo, tanpa register | **Selesai** | Ubah password dan keluar dari semua perangkat (P1), lupa password OTP (P2) |
| Kategori (P0) | CRUD lokal, nama sebagai kunci | **Selesai**: CRUD via API, nama unik, 409 dipakai/duplikat/tipe terkunci | - |
| Transaksi (P0, P1) | CRUD lokal, kategori berupa teks | **Selesai**: paginasi, filter tipe/kategori/rentang tanggal, cari, sortir dari server; detail; form dengan validasi; ringkasan | Scan nota (P2) |
| Dashboard (P0) | Kartu, pie, tren dari data lokal | **Lama** | Pindah ke `GET /dashboard/summary`: Saldo Catatan, tren 6 bulan, terbaru, insight (P2) |
| Anggaran (P0) | Satu anggaran per bulan, `spentAmount` ikut tersimpan | **Lama** | Budget per kategori-bulan, terpakai dihitung server, status 70/90, terlampaui tetap menerima transaksi (BR-24), tambah budget (P1) |
| Tabungan (P0) | Satu angka `currentAmount` | **Lama** | Riwayat setoran, setoran melebihi target ditolak, hapus setoran (P1), tarik tabungan dan alih ke budget (P2) |
| Laporan (P0) | Ringkasan lokal, ekspor CSV dan print | **Lama** | `GET /reports/*`, export PDF dan XLSX dari server (P1) |
| Import Excel (P1) | Tidak ada | Belum | Halaman aturan, error nama kolom, preview, konfirmasi |
| Mata uang (P0, P1) | 3 mata uang, ambil kurs sendiri | **Lama** | Ambil dari `GET /currencies` (12 mata uang) |
| Notifikasi (P1) | Lokal, tiap CRUD | **Lama** | 3 jenis peristiwa dari API |
| Profil (P1) | Lokal, avatar base64 | **Lama** | `PATCH /profile`, ubah password, avatar |
| Pengaturan (P0) | Tema, bahasa, mata uang, Backup/Restore/Reset | **Lama** | Hapus Backup, Restore, Reset Data (server menjadi sumber data) |
| Push, scan nota (P2) | Tidak ada | Belum | Push tidak direncanakan di web; scan nota opsional |

## 3. Yang sudah dibangun (tahap 1)

- `src/api/`: klien Axios (`http.js`), penyimpanan token, normalisasi error (`ApiError`), service auth, kategori, transaksi.
- `src/hooks/queries.js`: hook TanStack Query dengan invalidasi cache sesuai `docs/screens.md` bagian 5.
- `src/context/AuthContext.jsx`: status `loading | signedOut | signedIn | error`, verifikasi token lewat `GET /profile`, 401 memicu logout, layar "Menyiapkan server" saat server belum siap.
- Halaman Login, Register, Kategori, Transaksi (dengan `TransactionForm`), komponen `ConfirmDialog`, `ErrorState`, `Pagination`.
- `src/lib/rules.js` dan `schemas.js`: aturan yang dicerminkan dari backend (kebijakan password, tanggal WIB, nominal bulat).
- Terjemahan baru (id dan en, 293 kunci identik), termasuk pesan untuk semua kode error kontrak. Istilah "Nominal" menggantikan "Jumlah".
- Proxy Vite `/api` ke backend (tanpa masalah CORS saat development) dan `.env.example`.
- Pengujian: 32 tes (aturan, error, Login, Register, status sesi, halaman Kategori dan Transaksi dengan layanan API ditiru).

## 4. Cara menjalankan

```
npm install
copy .env.example .env      # isi VITE_PROXY_TARGET bila backend bukan di http://localhost:3000
npm run dev
npm test
npm run build
```

Backend harus berjalan. Untuk build production, isi `VITE_API_URL` dengan alamat lengkap backend (HTTPS) dan pastikan origin website ada di `CORS_ORIGINS` backend.

## 5. Hal yang perlu diverifikasi terhadap backend sebenarnya

Tahap 1 **belum diuji terhadap backend sungguhan** (hanya terhadap kontrak dan layanan tiruan di tes). Perhatikan:

1. **Kontrak dan prompt M2 tidak sama.** `docs/contract.md` (dan PRD) mendefinisikan kurs sebagai `{ base, updatedAt, source, currencies: [...] }`, tabungan dengan `currentAmount` dan `remaining`, serta laporan `difference` dan `{ year, months }`. Prompt M2 backend menyebut `{ base, fetchedAt, isFallback, rates }`, `savedAmount`, `remainingAmount`, `net`, dan tren berupa array. Tahap berikutnya (Dashboard, Anggaran, Tabungan, Laporan, Mata uang) bergantung pada bentuk yang benar-benar dikembalikan backend.
2. Bentuk `details` pada `VALIDATION_ERROR`: web menerima array `[{ path, message }]` atau objek `{ field: pesan }`.
3. Kategori yang bukan milik pengguna pada body transaksi: web menampilkan pesan dari kode error apa pun yang dikembalikan.
4. `description` kosong dikirim sebagai string kosong pada pembaruan (bukan `null`).
5. Meta paginasi diharapkan `{ page, limit, total, totalPages }`.
6. CORS: backend menolak origin yang tidak ada di `CORS_ORIGINS`. Proxy Vite menghindari masalah ini saat development.

## 6. Catatan keamanan web

- Token JWT disimpan di `localStorage` karena kontrak memakai header `Authorization` (cookie httpOnly butuh perubahan backend). Risiko: skrip apa pun di halaman dapat membacanya (XSS). Jangan memuat skrip pihak ketiga yang tidak tepercaya.
- Cache TanStack Query hanya di memori dan dikosongkan saat logout atau 401.

## 7. Rencana tahap berikutnya

1. Dashboard, Mata uang (12), Pengaturan (hapus Backup dan Reset), Profil, Notifikasi.
2. Anggaran dan Tabungan sesuai aturan baru.
3. Laporan, export PDF dan XLSX, Import Excel.
4. P2 yang relevan untuk web.
5. Hapus sisa kode LocalStorage lama (`AppContext` data keuangan, `useLocalStorage`, data awal).
