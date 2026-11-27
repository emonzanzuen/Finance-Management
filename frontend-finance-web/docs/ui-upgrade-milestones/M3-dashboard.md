# M3 — Dashboard

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- File halaman Dashboard aktual di `frontend-finance-web/src/pages/`
- `frontend-finance-web/src/api/services/dashboard.js`, `transactions.js`, `budgets.js`, dan service lain yang dipakai dashboard
- `frontend-finance-web/src/hooks/queries.js`
- Komponen/layout/chart yang dipakai dashboard dari `src/components/` dan `src/layouts/`
- `frontend-finance-web/docs/contract.md` (endpoint dashboard dan bentuk data yang relevan)
- File locale yang memuat teks dashboard, jika dipisah
- Screenshot dashboard saat ini, bila tersedia

## Prompt siap salin

```text
Kerjakan milestone M3: tingkatkan UI dashboard FinManage agar pengguna dapat memahami kondisi keuangan dengan cepat dan percaya diri.

Periksa dashboard dan kontrak/integrasi frontend yang saya kirim. Tata ringkasan saldo, pemasukan/pengeluaran, tren, anggaran, dan aktivitas terbaru hanya berdasarkan data dan widget yang memang didukung implementasi sekarang. Buat hierarki informasi dan visualisasi yang mudah dibaca, format angka/tanggal konsisten dengan preferensi aplikasi, serta tampilan desktop dan mobile yang rapi. Jangan menambah metrik atau kesimpulan finansial yang tidak tersedia dari API.

Pertahankan service dan query hooks, parameter/filter yang sudah ada, pemuatan ulang, serta penanganan unauthorized. Data keuangan harus tetap berasal dari backend melalui integrasi frontend yang tersedia; jangan membuat data contoh, menyimpan data keuangan ke localStorage, atau menggantinya dengan filtering client-only. Tangani loading, error, dan akun tanpa data secara jelas. Grafik harus punya label/aksesibilitas yang masuk akal dan fallback jika data kosong.

Jangan mengubah backend, endpoint/kontrak, atau menambah dependency. Ubah hanya frontend-finance-web yang diperlukan untuk M3. Jalankan validasi aman yang tersedia tanpa install dependency dan tanpa server dev; laporkan perubahan, sumber data setiap bagian utama, hasil validasi, dan verifikasi manual yang masih diperlukan.
```
