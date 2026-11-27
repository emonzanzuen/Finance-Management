# M4 — Transaksi dan kategori

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- File halaman Transactions dan Categories aktual dari `frontend-finance-web/src/pages/`
- `frontend-finance-web/src/api/services/transactions.js` dan `categories.js`
- Service mata uang yang dipakai, jika relevan
- `frontend-finance-web/src/hooks/queries.js`
- Komponen tabel, filter, dialog, form, dan layout yang digunakan
- `frontend-finance-web/docs/contract.md` (endpoint transaksi/kategori relevan)
- Locale terkait

## Prompt siap salin

```text
Kerjakan milestone M4: poles pengalaman transaksi dan kategori FinManage, mencakup daftar, pencarian/filter, tambah/edit/hapus jika operasi tersebut memang tersedia, dan navigasi antarhalaman yang sudah ada.

Audit implementasi serta kontrak frontend yang saya kirim. Pertahankan field, validasi, jenis transaksi, kategori, mata uang, paginasi/filter, konfirmasi, dan aturan bisnis yang sudah didukung. Jangan menciptakan kemampuan CRUD atau field baru hanya demi UI. Tingkatkan keterbacaan daftar, ringkasan informasi, form/dialog, umpan balik aksi, dan usability mobile; tabel desktop dapat menjadi kartu/daftar mobile tanpa menghilangkan informasi penting.

Semua baca/tulis data tetap lewat API services dan hooks yang sudah ada. Jangan pakai data mock, localStorage untuk transaksi, atau filter lokal untuk menggantikan filter server. Tampilkan loading, error, empty, validasi, sukses, dan konfirmasi aksi destruktif dengan tepat. Hindari mengungkap detail sensitif pada log atau pesan error.

Jangan mengubah backend/kontrak dan jangan menambah dependency. Ubah hanya frontend-finance-web yang diperlukan untuk M4. Lakukan validasi aman tanpa install atau server dev; laporkan file berubah, operasi yang telah dicocokkan dengan API, validasi dan hasilnya, serta pemeriksaan manual yang belum dilakukan.
```
