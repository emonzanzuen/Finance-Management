# Template review read-only
**Agent:** Codex (GPT-6-Luna) · **Mode:** read-only, tanpa mengubah file · Gunakan terbatas (kuota bulanan)

---

## Salin prompt ini, isi bagian dalam [kurung siku]

```
PERAN
Kamu code reviewer keamanan dan kebenaran bisnis. Lakukan review READ-ONLY terhadap [FOKUS: mis. autentikasi, sesi, dan otorisasi objek di backend].

ATURAN WAJIB
- JANGAN mengubah, membuat, menghapus, memindahkan, atau memformat file apa pun. JANGAN menjalankan npm install, build, atau server. Boleh membaca, grep, dan menjalankan tes yang sudah ada (npm test) bila tidak menulis ke disk di luar folder cache tes.
- JANGAN membaca frontend-finance-web/, node_modules, dist, .git.
- Laporan hanya ditampilkan di chat.

BACA HANYA INI
- Kode: [mis. backend/src/** dan backend/tests/**]
- Aturan: docs/rules.md bagian [mis. Sesi dan token, Otorisasi objek, Rate limit, Error dan log]
- Kontrak: docs/contract.md bagian [mis. 1 dan 3.1]
- Uji yang harus ada: [mis. SEC-01 sampai SEC-08, SEC-13, SEC-14]

YANG DIPERIKSA
Untuk tiap kontrol pada aturan di atas, tentukan: Sesuai, Sebagian, Belum, atau Menyimpang, dengan bukti path:baris. Jangan menebak: bila tidak ada bukti tulis Belum ditemukan. Cari khusus: userId yang berasal dari body atau params, query tanpa filter userId, relasi yang tidak divalidasi kepemilikannya, JWT yang tidak memeriksa algoritma, iss, aud, atau sesi, rahasia atau token di log, pesan error yang membocorkan detail internal, operasi uang memakai float, dan tes SEC yang belum ada.

FORMAT LAPORAN (bahasa Indonesia)
1. Ringkasan maksimal 6 baris.
2. Tabel: ID kontrol | Status | Bukti (path:baris) | Catatan.
3. Daftar temuan berurut keparahan (Kritis, Tinggi, Sedang, Rendah): masalah, bukti, dampak, saran perbaikan satu kalimat.
4. Tes SEC yang belum ada.
5. Hal yang tidak bisa dipastikan dari kode saja.
Jangan memperbaiki apa pun.
```

## Isian siap pakai

| Sesi | Kapan | [FOKUS] | Kode | rules.md | Uji SEC |
|---|---|---|---|---|---|
| 1 | Akhir M1 | Autentikasi, sesi, dan otorisasi objek | `backend/src/**`, `backend/tests/**` | Sesi dan token; Password dan akun; Otorisasi objek; Rate limit; Error dan log | SEC-01 sampai 08, 13, 14 |
| 2 | Akhir M3 | Integritas keuangan, upload, dan import | `backend/src/**`, `backend/tests/**` | Integritas finansial; Upload; Privasi scan nota | SEC-09 sampai 12, 15 sampai 18 |
| 3 | 1 November | Audit akhir terhadap acceptance criteria | `backend/**`, `mobile/**` | Seluruh `docs/rules.md` | Semua SEC dan kriteria PRD bagian 23 (pemilik proyek menempelkan daftarnya) |
