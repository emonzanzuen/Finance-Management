# Prompt M0 — Mobile
**Agent:** agy · **Model:** Claude Sonnet 5.5 · **Effort:** medium · **Folder tulis:** `mobile/` saja

---

## PERAN

Kamu adalah senior React Native engineer. Tugasmu: membangun **fondasi** aplikasi Android FinManage (aplikasi pencatat keuangan pribadi) di folder `mobile/` memakai Expo, TypeScript, dan Expo Router. Ini tahap M0: **kerangka, tema, navigasi, lapisan API, dan satu layar uji koneksi**. Belum ada fitur bisnis.

## BACA DULU (hanya ini, hemat token)

1. `AGENTS.md` (root) dan `mobile/AGENTS.md`
2. `docs/screens.md` bagian 1 (Navigasi), 3 (Design system), 4 (Perilaku Android dan state), 5 (State dan penyimpanan), 6 (Lokalisasi)
3. `docs/contract.md` bagian 1 (Konvensi) dan baris `/health`

**Boleh dibaca (baca saja, untuk disalin):** `frontend-finance-web/src/locales/id.json` dan `frontend-finance-web/src/locales/en.json`. **Jangan membaca atau menyalin apa pun lagi dari `frontend-finance-web/`** dan jangan mengubahnya sedikit pun. Jangan membaca `backend/` atau PRD lengkap.

## TUGAS

1. **Buat proyek Expo di `mobile/`.** Karena `mobile/` sudah berisi `AGENTS.md`, buat dulu di folder sementara dengan template resmi (TypeScript + Expo Router): `npx create-expo-app@latest mobile-tmp --template default`, pindahkan isinya ke `mobile/` (jangan menimpa `AGENTS.md`), lalu hapus `mobile-tmp`. Hapus layar contoh bawaan template. TypeScript strict.

2. **Pasang dependency** yang diizinkan di `mobile/AGENTS.md` dengan `npx expo install` (kecuali `axios`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, dan `react-native-gifted-charts`, yang dipasang dengan `npm install`). Pasang hanya yang dibutuhkan M0: Axios, TanStack Query, React Hook Form + resolvers + Zod, `expo-secure-store`, AsyncStorage, `react-native-svg`, `@expo/vector-icons`, `react-native-safe-area-context`, `expo-build-properties`, `expo-constants`. Sisanya (gambar, dokumen, notifikasi, chart) ditunda.

3. **`app.config.ts`**: nama FinManage, slug `finmanage`, scheme `finmanage`, versi 1.0.0, orientasi portrait; Android `package` = `com.finmanage.app` dan **`allowBackup: false`**. Plugin `expo-router`, `expo-secure-store`, dan `expo-build-properties` dengan `usesCleartextTraffic: true` **hanya bila** `process.env.EAS_BUILD_PROFILE === 'local-demo'`. Sediakan juga flag `EXPO_PUBLIC_ALLOW_SERVER_OVERRIDE` (hanya `true` pada profil `local-demo`).

4. **`eas.json`** dengan profil: `preview` (Android APK, distribusi internal, `EXPO_PUBLIC_API_URL` berisi placeholder jelas seperti `https://GANTI-INI/api/v1`) dan `local-demo` (Android APK, distribusi internal, `EXPO_PUBLIC_ALLOW_SERVER_OVERRIDE=true`, URL placeholder). Jangan membuat profil production. Jangan menjalankan `eas build`.

5. **Tema** (`src/theme`): token warna terang dan gelap, spasi, tipografi, radius sesuai `docs/screens.md` bagian 3; hook `useTheme` yang mengikuti preferensi (ikuti sistem, terang, gelap). Tidak ada warna di-hardcode di layar.

6. **Terjemahan** (`src/i18n`): salin `id.json` dan `en.json` dari `frontend-finance-web/src/locales/` ke `mobile/src/i18n/` (salinan; **file asli tidak boleh diubah**). Sesuaikan: pakai istilah **Nominal** (bukan Jumlah), hapus atau abaikan kunci Backup, Restore, Reset Data, dan Remember Me, tambahkan kunci baru yang dibutuhkan M0 (nama tab, judul layar, tombol umum, status loading, empty, error) beserta namespace `errors` yang memetakan **semua kode error** di `docs/contract.md` ke pesan Indonesia dan English. Buat hook `useTranslation` sendiri (interpolasi `{nama}`, bahasa dari preferensi). Tambahkan skrip pengecek bahwa kunci `id.json` dan `en.json` identik; jalankan hasilnya.

7. **Lapisan API** (`src/api`, `src/types`): `client.ts` (Axios, `baseURL` dari `EXPO_PUBLIC_API_URL`, interceptor menempelkan token dari penyimpanan auth, normalisasi error menjadi `ApiError { code, message, details, status }`, kegagalan jaringan menjadi `ApiError` berkode `NETWORK_ERROR`, 401 memanggil handler logout yang dapat didaftarkan, timeout 60 detik untuk request pertama dan 20 detik sesudahnya). `health.ts` memanggil `GET /health`. Tipe respons mengikuti `docs/contract.md`.

8. **Context dan provider**:
   - `PreferencesContext`: tema, bahasa, mata uang tampilan (default IDR), disimpan di AsyncStorage dengan kunci berawalan `finmanage.`.
   - `AuthContext`: status `loading | signedOut | signedIn`, token di **SecureStore** (satu kunci, `auth_token`), fungsi `signIn(token, user)` dan `signOut()`. `signOut` mengosongkan cache TanStack Query dan menghapus token. Saat start: bila token ada, status `signedIn` (verifikasi ke `/profile` ditambahkan pada M1; beri komentar `TODO(M1)`).
   - `app/_layout.tsx`: `SafeAreaProvider`, `QueryClientProvider` (tanpa persistensi ke disk), provider preferensi dan auth, serta penjaga rute (belum login diarahkan ke `(auth)/login`, sudah login ke `(tabs)`).

9. **Layar** (placeholder yang rapi, memakai tema dan terjemahan):
   - `(auth)/login` dan `(auth)/register`: judul dan tata letak dasar saja. Sediakan tombol **Masuk sebagai dev** yang hanya muncul bila `__DEV__` bernilai true, mengatur token palsu untuk menguji navigasi; beri komentar `TODO(M1): hapus`.
   - `(tabs)`: 5 tab (Beranda, Transaksi, Anggaran, Tabungan, Lainnya) dengan ikon Feather dan tab bar bertema; tiap tab berisi placeholder judul.
   - `Lainnya` memuat item **Cek koneksi server**: menekan tombol memanggil `GET /health` dan menampilkan hasil (sukses atau error, waktu respons, dan hanya **host** alamat API, bukan token). Tampilkan pesan Menyiapkan server... bila request lebih dari 3 detik.
   - Tombol **Keluar** di Lainnya memanggil `signOut()`.

10. **`.env.example`** (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_ALLOW_SERVER_OVERRIDE=false`), `.gitignore` mobile (termasuk `.env`, `.expo`, `dist`, `android/`, `ios/`, `google-services.json`, `*.keystore`, `*.jks`), dan `README.md` singkat (cara menjalankan di Expo Go, cara mengisi `.env`, struktur folder).

## BATASAN

- Jangan mengimplementasikan fitur bisnis (transaksi, budget, dan seterusnya) atau memanggil endpoint selain `/health`.
- Jangan menyalin JSX, CSS, atau konfigurasi dari `frontend-finance-web/`; hanya dua file JSON terjemahan.
- Jangan memakai NativeWind, Redux, atau library UI pihak ketiga. Jangan menambah dependency di luar daftar tanpa bertanya.
- Jangan menjalankan `npx expo start`, `eas build`, atau `eas submit`. Jangan menyimpan data keuangan ke disk.
- Jangan menyentuh `backend/` dan `frontend-finance-web/`.

## VERIFIKASI (jalankan dan tampilkan hasilnya)

```
cd mobile
npx tsc --noEmit
npx eslint .
npx expo install --check
npx expo-doctor
(skrip pengecek kunci terjemahan)
cd ..
git diff --stat -- frontend-finance-web     # harus kosong
```

## FORMAT LAPORAN AKHIR (bahasa Indonesia)

1. Versi Expo SDK, React Native, dan daftar dependency yang terpasang.
2. Daftar file utama yang dibuat dan struktur folder akhir.
3. Keluaran ringkas tiap perintah verifikasi.
4. Keputusan di luar instruksi dan alasannya; kunci terjemahan yang dihapus atau ditambah.
5. **Langkah untuk pemilik proyek menguji di HP:** isi `mobile/.env` dengan alamat backend (`http://<IP-laptop>:3000/api/v1` atau URL hosting), jalankan `npx expo start`, pindai QR dengan Expo Go, buka Lainnya, tekan Cek koneksi server.
6. Hal yang belum selesai atau perlu usulan perubahan kontrak.
