# M2 — Autentikasi, profil, dan pengaturan

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- `frontend-finance-web/src/pages/` untuk Login, Register, Forgot Password, Reset Password, Profile, Settings (pilih file aktual yang ada)
- `frontend-finance-web/src/context/AuthContext.jsx` dan `ThemeContext.jsx`
- `frontend-finance-web/src/api/services/auth.js` dan service profil/pengaturan yang benar-benar digunakan
- `frontend-finance-web/src/hooks/queries.js`
- `frontend-finance-web/src/components/ui/` dan komponen form terkait
- `frontend-finance-web/docs/contract.md` (bagian endpoint auth/profil yang relevan)
- `frontend-finance-web/src/locales/` bila perubahan menyentuh teks terjemahan

Jangan kirim backend atau rahasia. Jangan mengirim seluruh halaman yang tidak berkaitan.

## Prompt siap salin

```text
Kerjakan milestone M2: poles UI autentikasi, profil, dan pengaturan FinManage agar terasa profesional, jelas, dan konsisten dengan fondasi desain yang sudah ada.

Tinjau alur dan implementasi aktual dari file yang saya kirim. Perbaiki presentasi form login/register/lupa atau reset kata sandi (sesuai halaman yang tersedia), profil, serta preferensi pengaturan. Buat hirarki form yang jelas, validasi dan pesan kesalahan yang mudah dipahami, indikator proses/sukses, empty/error state bila relevan, dan layout responsif. Jangan mengubah proses bisnis atau menambahkan field yang tidak didukung kontrak.

Integrasi tetap memakai AuthContext, API services, dan query hooks yang ada. Jangan menebak endpoint atau bentuk respons. Jangan memakai mock/localStorage sebagai sumber kebenaran profil atau autentikasi. Simpan preferensi tampilan hanya melalui mekanisme yang memang sudah ada. Pertahankan tema terang/gelap dan bahasa yang tersedia.

Jangan mengubah backend, kontrak API, atau menambah dependency. Backup/restore/reset data harus tetap dinonaktifkan. Ubah hanya frontend-finance-web dan file yang diperlukan untuk M2. Validasi tanpa install dependency atau menjalankan server dev; laporkan file berubah, alur yang tetap bekerja, perintah dan hasil validasi, serta pemeriksaan manual yang masih dibutuhkan. Jangan lanjut ke milestone lain.
```
