# M7 — Notifikasi dalam aplikasi, impor transaksi, dan scan kuitansi

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- File halaman Notifications, Import Transactions, dan Scan Receipt aktual dari `frontend-finance-web/src/pages/`
- Service terkait dari `frontend-finance-web/src/api/services/notifications.js`, `imports.js`, dan `receipts.js`
- `frontend-finance-web/src/hooks/queries.js`
- Komponen upload, status, preview, dan dialog yang digunakan
- `frontend-finance-web/docs/contract.md` (endpoint notifikasi dalam aplikasi, impor, dan kuitansi yang relevan)
- Locale terkait

Push notification tidak diperlukan dan source/backend tidak dikirim.

## Prompt siap salin

```text
Kerjakan milestone M7 hanya untuk fungsi website yang tersedia: notifikasi dalam aplikasi, impor transaksi, dan scan/unggah kuitansi. Push notification tidak diperlukan. Sebelum mengubah UI, pastikan dari implementasi dan kontrak yang dikirim operasi mana yang benar-benar tersedia; jika capability tidak ada atau memang dinonaktifkan, tampilkan status nonaktif secara jelas dan jangan membuat fungsi palsu.

Untuk fitur aktif, rapikan daftar/status notifikasi in-app, alur pemilihan dan unggah file, validasi format/ukuran yang memang ditentukan kontrak atau implementasi, preview/hasil pemrosesan jika tersedia, dan langkah konfirmasi. Pertahankan endpoint, batas, bentuk data, serta alur error/sukses yang sudah ada. Jangan menyiratkan scan otomatis atau impor berhasil sebelum server mengonfirmasi.

Gunakan API services/hooks existing. Jangan mock, menyimpan data finansial di localStorage, menambah dependency, atau mengubah backend/kontrak. Beri loading, empty, error, dan status proses yang jelas; perhatikan keyboard, label file, dan tampilan mobile. Jangan mengirim atau menampilkan konten sensitif pada log.

Ubah hanya frontend-finance-web yang diperlukan untuk M7. Validasi aman tanpa install dan server dev. Laporkan fitur yang aktif/nonaktif berdasarkan kode, file berubah, hasil validasi, dan apa yang masih perlu diverifikasi manual.
```
