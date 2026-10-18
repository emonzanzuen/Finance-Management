# FinManage

FinManage adalah aplikasi pencatat keuangan pribadi untuk Android. FinManage hanya mencatat pemasukan, pengeluaran, budget, dan tabungan — **bukan alat transaksi** dan tidak menghubungkan rekening bank mana pun.

## Struktur folder

| Folder | Isi | Status |
|---|---|---|
| `frontend-finance-web/` | Website lama (React + Vite) | **READ-ONLY, tidak boleh diubah** |
| `mobile/` | Aplikasi Android: React Native + Expo + TypeScript | Proyek baru |
| `backend/` | REST API: Express + TypeScript + Prisma + PostgreSQL | Proyek baru |
| `docs/` | PRD, kontrak API, aturan, prompt | Dokumentasi |

## Menjalankan backend secara lokal

```bash
cd backend
copy .env.example .env   # di Linux/macOS: cp .env.example .env
# isi nilai pada .env
npm install
npm run dev
```

## Menjalankan mobile di Expo Go

```bash
cd mobile
copy .env.example .env   # di Linux/macOS: cp .env.example .env
# isi EXPO_PUBLIC_API_URL pada .env
npm install
npx expo start
```

Pindai QR code yang muncul dengan aplikasi **Expo Go** di HP Android.

## Aturan penting

`frontend-finance-web/` adalah website lama berstatus read-only. **Jangan mengubah, menghapus, memindahkan, atau memformat apa pun di dalamnya**, termasuk `.gitignore` miliknya.

## Daftar dokumen di `docs/`

- `docs/contract.md` — konvensi dan kontrak API
- `docs/rules.md` — aturan bisnis dan kontrol keamanan
- `docs/data-model.md` — model data dan constraint
- `docs/screens.md` — navigasi dan kebutuhan layar
- `docs/prompts/` — prompt untuk agen AI per modul
