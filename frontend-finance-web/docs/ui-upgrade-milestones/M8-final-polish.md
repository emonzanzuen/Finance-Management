# M8 — Penyelarasan akhir dan pemeriksaan UI

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- Screenshot halaman utama pada desktop dan mobile setelah milestone sebelumnya
- Hanya komponen/tokens/layout bersama dan halaman yang memiliki masalah visual; jangan kirim semua repo bila konteks tidak diperlukan
- `frontend-finance-web/src/App.css`, `src/index.css`, dan file theme/token aktual
- `frontend-finance-web/docs/contract.md` hanya jika perubahan menyentuh alur/API

Jangan kirim `node_modules/`, `dist/`, `.env`, backend, mobile, atau data pengguna.

## Prompt siap salin

```text
Kerjakan milestone M8 sebagai review dan polishing lintas halaman atas hasil milestone UI yang sudah dikerjakan. Jangan melakukan redesign besar atau mengganti fitur.

Periksa screenshot dan file yang saya kirim untuk menemukan inkonsistensi visual nyata: spacing, tipografi, warna, tombol, form, tabel, dialog, navigasi, responsivitas, overflow, kontras, fokus keyboard, dan state loading/error/empty. Prioritaskan masalah yang menghambat pemakaian. Perbaiki hanya isu yang terbukti dari konteks/screenshot, dan jaga pola komponen bersama.

Jangan mengubah perilaku API, autentikasi, business rules, struktur data, atau menambahkan dependency. Jangan mengaktifkan backup/restore/reset data atau push notification. Jangan menambahkan mock/localStorage untuk data finansial. Jika ada masalah yang memerlukan keputusan produk/backend, jelaskan sebagai temuan dan jangan menebak implementasinya.

Lakukan pemeriksaan yang aman dan sesuai skrip yang tersedia; jangan install dependency dan jangan menjalankan server dev. Laporkan temuan sebelum/sesudah, file yang berubah, validasi dan hasilnya, daftar pemeriksaan manual desktop/mobile, serta gap yang masih tersisa. Jangan membuat milestone atau fitur baru.
```
