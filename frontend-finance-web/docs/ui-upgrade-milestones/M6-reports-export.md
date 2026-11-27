# M6 — Laporan dan ekspor

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- File halaman Reports aktual dari `frontend-finance-web/src/pages/`
- `frontend-finance-web/src/api/services/reports.js` dan service ekspor/unduh terkait yang dipakai
- `frontend-finance-web/src/hooks/queries.js`
- Komponen grafik/filter/rentang tanggal yang digunakan
- `frontend-finance-web/docs/contract.md` (endpoint laporan dan ekspor relevan)
- Locale terkait

## Prompt siap salin

```text
Kerjakan milestone M6: poles UI laporan dan ekspor FinManage agar pengguna bisa membaca ringkasan dengan jelas, memilih rentang/periode yang tersedia, dan mengunduh laporan melalui fungsi yang memang telah didukung.

Ikuti data, agregasi, format, filter, dan format ekspor yang ada pada service, hook, halaman, dan kontrak yang saya kirim. Jangan menghitung laporan baru di browser jika API yang ada menjadi sumbernya; jangan mengarang endpoint, format file, atau klaim analitik. Susun filter periode, ringkasan, tabel/grafik, serta kontrol ekspor dengan responsif dan jelas. Jelaskan state proses unduh dan error tanpa membocorkan informasi sensitif.

Data laporan harus tetap berasal dari API yang sudah terintegrasi. Jangan menggunakan mock atau localStorage untuk data finansial, dan jangan mengubah kontrak/backend. Jangan menambah dependency. Tangani loading/error/empty dan aksesibilitas grafik. Validasi secara aman tanpa install atau server dev. Laporkan file berubah, operasi laporan/ekspor yang dipertahankan, perintah serta hasil validasi, dan verifikasi manual yang masih diperlukan.
```
