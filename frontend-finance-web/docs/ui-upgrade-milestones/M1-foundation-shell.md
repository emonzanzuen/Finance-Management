# M1 — Fondasi visual dan kerangka aplikasi

## Bahan yang dikirim ke Gemini

- `frontend-finance-web/docs/ui-upgrade-milestones/README.md`
- File ini
- `frontend-finance-web/src/App.jsx`, `src/App.css`, `src/index.css`, `src/main.jsx`
- `frontend-finance-web/src/components/layout/` dan `src/layouts/`
- `frontend-finance-web/src/components/ui/` (jika ada)
- `frontend-finance-web/src/context/ThemeContext.jsx` dan file provider konteks lain yang dipakai layout
- Screenshot website sekarang untuk desktop dan mobile, bila tersedia

Jangan kirim `node_modules/`, `dist/`, `.env`, `backend/`, atau source mobile.

## Prompt siap salin

```text
Kamu adalah senior product designer dan frontend engineer. Kerjakan milestone M1 untuk meningkatkan kualitas visual website FinManage agar profesional, konsisten, mudah dibaca, dan nyaman dipakai pada desktop maupun ponsel.

Mulai dengan memeriksa file yang saya kirim. Usulkan arah visual singkat berdasarkan pola yang memang sudah ada di produk; lalu implementasikan fondasi tersebut pada kerangka aplikasi: hierarki tipografi, warna dan token, spacing, permukaan/kartu, tombol, field, fokus keyboard, navigasi, header/sidebar, dan layout responsif. Hindari dashboard atau fitur baru di milestone ini.

Pertahankan routing, provider, autentikasi, theme terang/gelap, bahasa Indonesia/Inggris, dan semua perilaku yang sudah ada. Jangan menambah dependency. Jangan mengarang konten bisnis atau mengganti integrasi API. Jangan menyimpan data keuangan di localStorage.

Lakukan perubahan hanya di frontend-finance-web dan hanya pada file yang diperlukan untuk M1. Cek penggunaan komponen sebelum mengubah API/props agar halaman yang ada tidak rusak. Sertakan aksesibilitas dasar: kontras, label, fokus yang terlihat, navigasi keyboard, dan reduced motion jika ada animasi.

Validasi hanya dengan perintah yang aman dan tersedia pada proyek; jangan menjalankan server dev atau install dependency. Laporkan file yang berubah, keputusan desain, validasi dan hasilnya, serta risiko/perlu verifikasi manual. Jangan lanjut mengerjakan milestone lain.
```
