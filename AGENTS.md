# AGENTS.md (root) — FinManage

Bahasa komunikasi dengan pemilik proyek: **Indonesia**. Kode, nama file, dan identifier: Inggris.

## Struktur repositori

| Folder | Isi | Status |
|---|---|---|
| `frontend-finance-web/` | Website lama (React + Vite), progres sekitar 50% | **READ-ONLY. DILARANG DIUBAH** |
| `mobile/` | Aplikasi Android: React Native + Expo + TypeScript | Proyek baru |
| `backend/` | REST API: Express + TypeScript + Prisma + PostgreSQL | Proyek baru |
| `docs/` | PRD, kontrak API, aturan, prompt | Dokumentasi |

## Aturan mutlak

1. **Jangan mengubah, menghapus, memindahkan, me-rename, memformat, atau men-stage apa pun di `frontend-finance-web/`.** Jangan menjalankan `npm install`, build, lint, atau formatter di sana. Folder itu hanya boleh dibaca, dan hanya file yang disebut eksplisit di prompt.
2. Tulis hanya di folder milik tugasmu (disebut di prompt). Jangan menyentuh folder lain.
3. Jangan menambah dependency di luar daftar pada `AGENTS.md` folder masing-masing tanpa bertanya.
4. Kontrak API ada di `docs/contract.md`. Jangan mengubahnya diam-diam: bila perlu perubahan, usulkan di laporan lalu berhenti.
5. Rahasia (`.env`, kunci API, token, password) tidak boleh di-commit, dicetak ke log, atau dituliskan di jawaban.
6. **Baca hanya dokumen yang disebut prompt.** Jangan membaca seluruh PRD, `node_modules`, `dist`, `.git`, atau folder besar. Hemat token.
7. Jangan menjalankan perintah destruktif (`rm -rf`, `git reset --hard`, `git clean`, `prisma migrate reset`, drop database) tanpa izin eksplisit.
8. Jangan menjalankan server dev yang tidak berhenti, `eas build`, atau deploy. Itu dikerjakan pemilik proyek.

## Definisi selesai

- `tsc --noEmit` bersih, tes lulus, lint tanpa error.
- Laporan akhir berisi: file dibuat atau diubah, perintah yang dijalankan beserta hasil, hal yang belum selesai, dan keputusan yang kamu ambil.
- Bukti proteksi: `git diff --stat -- frontend-finance-web` menghasilkan keluaran kosong.

## Peta dokumen konteks (baca sesuai kebutuhan tugas)

| File | Isi | Dibaca oleh |
|---|---|---|
| `docs/contract.md` | Konvensi API, endpoint, bentuk request dan respons, kode error | Backend dan mobile |
| `docs/rules.md` | Aturan bisnis BR-xx dan kontrol keamanan | Backend (wajib), mobile (bagian terkait) |
| `docs/data-model.md` | Tabel database dan constraint | Backend |
| `docs/screens.md` | Navigasi, kebutuhan layar, design token, perilaku Android | Mobile |
| `docs/PRD-FinManage-Android-V1.md` | PRD lengkap | Hanya bila prompt menyuruh, per bagian |
