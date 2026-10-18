# FinManage Mobile

Aplikasi Android pencatat keuangan pribadi (React Native + Expo + TypeScript + Expo Router).
Tahap M0: kerangka, tema, navigasi, lapisan API, dan layar uji koneksi.

## Menjalankan di Expo Go

```bash
cd mobile
npm install
cp .env.example .env      # Windows: copy .env.example .env
npx expo start
```

Pindai QR dengan Expo Go (Android). Buka tab **Lainnya**, lalu tekan **Cek koneksi server**.

## Mengisi `.env`

```
EXPO_PUBLIC_API_URL=http://<IP-laptop>:3000/api/v1   # atau https://<url-hosting>/api/v1
EXPO_PUBLIC_ALLOW_SERVER_OVERRIDE=false
```

- HP dan laptop harus di jaringan Wi-Fi yang sama; izinkan port 3000 di firewall.
- `EXPO_PUBLIC_*` hanya berisi alamat API, tidak boleh ada rahasia.
- Restart `npx expo start` (tambahkan `-c`) setelah mengubah `.env`.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npx tsc --noEmit` | Cek tipe |
| `npx eslint .` | Lint |
| `npm run check:i18n` | Pastikan kunci `id.json` dan `en.json` identik |
| `npx expo install --check` | Cek kecocokan versi paket |
| `npx expo-doctor` | Diagnosis proyek |

## Struktur

```
app/            Expo Router: _layout.tsx, (auth)/, (tabs)/
src/api/        Axios client, token store, service per resource
src/context/    AuthContext, PreferencesContext
src/i18n/       id.json, en.json, useTranslation
src/theme/      colors, spacing, typography, useTheme
src/components/ Komponen UI bertema
src/hooks/      Hook TanStack Query
src/types/      Tipe API (mengikuti docs/contract.md)
scripts/        check-i18n.mjs
```
