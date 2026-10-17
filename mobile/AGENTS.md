# AGENTS.md (mobile/) — FinManage Android

Aturan root di `../AGENTS.md` tetap berlaku. **Folder ini hanya boleh ditulis oleh jalur Mobile.** Jangan menyentuh `backend/` dan jangan menyentuh `frontend-finance-web/` (boleh dibaca hanya file yang disebut prompt, misalnya `src/locales/*.json`, lalu disalin ke `mobile/`).

Website lama tidak bisa dipakai langsung: komponen web, Tailwind, TailGrids, Recharts, GSAP, React Router DOM, `localStorage`, dan `react-hot-toast` **tidak boleh** dibawa ke sini. UI ditulis ulang dengan komponen React Native.

## Stack (tetap, jangan diganti)

React Native + Expo (SDK stabil terbaru yang didukung aplikasi Expo Go di Play Store), TypeScript strict, Expo Router, Axios.

Dependency yang diizinkan:
- TanStack Query (`@tanstack/react-query`), React Hook Form + `@hookform/resolvers` + Zod
- `react-native-gifted-charts`, `react-native-svg`, `expo-linear-gradient` (bila diminta peer dependency)
- `@expo/vector-icons`, `expo-secure-store`, `@react-native-async-storage/async-storage`
- `@react-native-community/datetimepicker`
- `expo-image-picker`, `expo-image-manipulator`, `expo-document-picker`, `expo-file-system`, `expo-sharing`
- `expo-notifications`, `expo-device`, `expo-constants`, `expo-build-properties`
- `react-native-safe-area-context` dan paket bawaan template Expo Router
- `vitest` (dev, hanya untuk util murni TypeScript tanpa import `react-native` atau `expo`)

Pasang paket Expo dengan `npx expo install <paket>` agar versinya cocok dengan SDK. Dependency lain **harus ditanyakan dulu**. Jangan memakai NativeWind, Redux, atau library UI pihak ketiga.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npx tsc --noEmit` | Cek tipe (harus bersih) |
| `npx eslint .` | Lint |
| `npx expo install --check` | Cek kecocokan versi paket |
| `npx expo-doctor` | Diagnosis proyek |

**Jangan** menjalankan `npx expo start` yang tidak berhenti, `eas build`, atau `eas submit`; pemilik proyek yang menjalankannya.

## Struktur

```
mobile/
  app/                     Expo Router: _layout.tsx, (auth)/, (tabs)/, dan layar stack
  src/
    api/                   client.ts (Axios), service per resource (auth.ts, transactions.ts, ...)
    components/            ui/, forms/, charts/
    hooks/                 hook TanStack Query per fitur
    context/               AuthContext, PreferencesContext
    i18n/                  id.json, en.json, useTranslation.ts
    theme/                 colors.ts, spacing.ts, typography.ts, useTheme.ts
    schemas/               Zod untuk form
    types/                 tipe request dan respons API (mengikuti docs/contract.md)
    utils/                 formatCurrency, formatDate, dll.
  app.config.ts, eas.json, package.json, tsconfig.json, .env.example
```

## Aturan kode

1. **Komponen layar tidak memanggil Axios langsung.** Alur: komponen, hook TanStack Query, service di `src/api`, instance Axios. Tipe request dan respons ada di `src/types` dan mengikuti `docs/contract.md`.
2. Token JWT hanya di `expo-secure-store` (satu kunci). **Data keuangan tidak boleh disimpan ke disk** (hanya cache memori TanStack Query). AsyncStorage hanya untuk tema, bahasa, mata uang tampilan, dan kurs terakhir.
3. Logout, 401, dan logout-all: cabut push token (usaha terbaik), hapus token, `queryClient.clear()`, kosongkan state auth, arahkan ke Login.
4. Instance Axios: `baseURL` dari `EXPO_PUBLIC_API_URL`, interceptor menempelkan token, error dinormalisasi menjadi `ApiError { code, message, details, status }`, 401 memicu logout. Request pertama memakai timeout 60 detik (server hosting gratis bisa tidur); panggil `GET /health` saat aplikasi dibuka.
5. Tidak ada warna, spasi, atau ukuran font yang di-hardcode di layar; semua dari `src/theme`. Mendukung terang dan gelap.
6. Semua teks lewat `useTranslation`; tidak ada string UI yang di-hardcode. Istilah antarmuka: **Nominal** (bukan Jumlah).
7. Uang tampil lewat `formatCurrency(amountInIdr, currencyCode, rates)`. Nilai tersimpan selalu IDR; konversi hanya untuk tampilan. Input nominal selalu IDR.
8. Setiap daftar wajib punya loading, empty, error (dengan Coba lagi), dan success (toast). Grafik hanya tampil bila data cukup.
9. Target sentuh minimal 48 dp; pakai safe area; form tidak tertutup keyboard; tombol back Android menutup sheet atau dialog dulu.
10. Tidak ada rahasia di aplikasi. Variabel `EXPO_PUBLIC_*` hanya berisi alamat API.
11. Build production hanya HTTPS. Izin HTTP (`usesCleartextTraffic`) dan layar ganti alamat server hanya untuk profil build `local-demo`. `android.allowBackup` bernilai `false`.
12. Kode registrasi push harus dilewati saat berjalan di Expo Go (`Constants.executionEnvironment`), karena push jarak jauh tidak didukung di sana.
13. Jangan mengubah kontrak API sendiri; bila ada ketidakcocokan, laporkan lalu berhenti.

## Larangan khusus

- Jangan mengimpor atau menyalin kode JSX, CSS, atau konfigurasi dari `frontend-finance-web/`. Hanya file JSON terjemahan dan logika murni (misalnya daftar kategori bawaan) yang boleh dijadikan referensi, dan ditulis ulang dalam TypeScript.
- Jangan membuat fitur di luar daftar di `docs/screens.md`.
