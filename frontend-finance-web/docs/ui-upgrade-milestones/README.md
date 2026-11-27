# Milestone Upgrade UI Website FinManage

Paket ini membagi upgrade UI menjadi delapan milestone berdasarkan kelompok fitur dan alur pengguna, bukan jumlah file. Kirim satu file milestone yang sedang dikerjakan beserta konteks proyek yang diminta di bagian **Bahan yang dikirim**. Prompt di setiap file berdiri sendiri dan siap disalin ke Gemini.

## Model

Target: Gemini 4 Neon, thinking level Medium (sesuai pilihan yang tersedia pada akun). Ketersediaan model dapat berbeda menurut akun, paket, dan wilayah. Jika model tersebut tidak tampil, gunakan model Gemini yang tersedia dengan tingkat penalaran Medium.

## Aturan bersama

- Ruang lingkup implementasi hanya `frontend-finance-web/`. Jangan mengubah backend, mobile, atau kontrak API.
- Jangan meminta atau mengirim source code backend, kredensial, token, `.env`, atau data pengguna. Kontrak API dan kode integrasi frontend yang relevan cukup untuk konteks.
- Pertahankan endpoint, bentuk request/response, autentikasi, query/mutation, dan perilaku bisnis yang sudah ada. Jangan menggantinya dengan mock, data statis, `localStorage`, atau client-only filtering.
- Jangan menambah dependency tanpa persetujuan pemilik proyek.
- Pertahankan bahasa Indonesia/Inggris, tema terang/gelap, dan preferensi tampilan yang ada.
- Backup/restore/reset data tetap dinonaktifkan; push notification tidak diperlukan.
- Kerjakan hanya milestone yang dikirim. Sebelum mengubah file, periksa implementasi saat ini. Jangan merombak modul lain.
- Sertakan state loading, error, empty, sukses, validasi, aksesibilitas dasar, dan tampilan responsif sesuai relevansi fitur.
- Setelah implementasi, laporkan file yang berubah, fungsi yang dipertahankan, validasi yang dijalankan beserta hasil, serta hal yang masih perlu diverifikasi manual.

## Urutan milestone

1. [Fondasi visual dan kerangka aplikasi](./M1-foundation-shell.md)
2. [Autentikasi, profil, dan pengaturan](./M2-auth-profile-settings.md)
3. [Dashboard](./M3-dashboard.md)
4. [Transaksi dan kategori](./M4-transactions-categories.md)
5. [Anggaran dan tujuan tabungan](./M5-budgets-savings.md)
6. [Laporan dan ekspor](./M6-reports-export.md)
7. [Notifikasi dalam aplikasi, impor transaksi, dan scan kuitansi](./M7-notifications-import-receipts.md)
8. [Penyelarasan akhir dan pemeriksaan UI](./M8-final-polish.md)

Milestone dapat dikerjakan berurutan. Jika milestone fitur tertentu tidak digunakan, lewati file itu dan lanjutkan ke milestone berikutnya.
