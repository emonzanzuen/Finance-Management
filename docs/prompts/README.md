# Paket prompt agent FinManage

| File | Agent dan model | Effort | Kapan |
|---|---|---|---|
| `M0-backend.md` | agy, Claude Opus 5.5 | medium | 17-18 Okt |
| `M0-mobile.md` | agy, Claude Sonnet 5.5 | medium | 17-18 Okt (paralel dengan backend) |
| `M0-helper.md` | opencode, Big Pickle | - | 17-18 Okt (paralel) |
| `review-template.md` | Codex GPT-6-Luna, read-only | - | Akhir M1, akhir M3, 1 Nov |

## Sebelum menjalankan agent pertama

1. Salin isi paket ini ke root repositori (folder `frontend-finance-web/` tetap di tempatnya, tidak disentuh).
2. Commit kondisi saat ini sebagai snapshot: `git add -A` lalu `git commit -m "snapshot sebelum pengembangan Android"`.
3. Buat branch per jalur, misalnya `be/m0` dan `fe/m0`. Jangan membiarkan dua agent menulis di folder yang sama.
4. Jalankan agent satu per satu pada folder miliknya. Tempel isi prompt (dari baris PERAN hingga FORMAT LAPORAN) ke agent; jika agent tidak membaca `AGENTS.md` otomatis, tempel juga isi `AGENTS.md` root di awal.

## Setelah setiap sesi agent

- `git diff --stat -- frontend-finance-web` harus kosong. Bila tidak, batalkan perubahan itu (`git checkout -- frontend-finance-web`) dan jangan gabungkan branch.
- Jalankan sendiri `npm test` (backend) atau `npx tsc --noEmit` (mobile), lalu gabungkan ke `main` bila lulus.
- Tanyakan ke agent hanya hal yang perlu; jangan menempelkan seluruh PRD.
