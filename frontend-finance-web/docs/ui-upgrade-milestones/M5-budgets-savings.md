# M5 — Anggaran dan tujuan tabungan

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- File halaman Budget dan Savings Goals aktual dari `frontend-finance-web/src/pages/`
- `frontend-finance-web/src/api/services/budgets.js` dan `savings.js`
- `frontend-finance-web/src/hooks/queries.js`
- Komponen form/progress/chart/dialog yang digunakan
- `frontend-finance-web/docs/contract.md` (endpoint anggaran dan tabungan yang relevan)
- Locale terkait

## Prompt siap salin

```text
Kerjakan milestone M5: tingkatkan UI fitur anggaran dan tujuan tabungan FinManage agar progres, batas, periode, dan tindakan pengguna mudah dipahami.

Gunakan hanya fitur/field yang sudah terlihat dalam halaman, service, hooks, dan kontrak API yang dikirim. Perjelas status progres, sisa/batas anggaran, periode, nominal tujuan, dan aksi tambah/edit/hapus bila tersedia. Gunakan indikator visual yang tidak mengandalkan warna saja; jangan memberi nasihat finansial atau membuat perhitungan baru yang tidak didukung kontrak. Pastikan angka, mata uang, dan tanggal mengikuti konvensi aplikasi.

Jangan ubah makna rumus atau business rules. Pertahankan operasi server melalui API services/query hooks. Jangan membuat mock atau menyimpan data finansial di localStorage. Tangani loading, error, empty, validasi, keberhasilan, batas/over-budget, dan konfirmasi dengan jelas. Pastikan layout responsif dan kontrol dapat diakses dengan keyboard.

Jangan mengubah backend/kontrak dan jangan menambah dependency. Ubah hanya frontend-finance-web yang diperlukan untuk M5. Validasi secara aman tanpa install dan server dev; laporkan perubahan, fungsi yang dipertahankan, hasil validasi, dan hal yang perlu dicek manual.
```
