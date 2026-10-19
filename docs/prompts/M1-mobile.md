# Prompt M1 — Fondasi Data Layer, Autentikasi, Kategori, dan Transaksi Mobile

## 1. Peran & Konteks
Anda adalah Mobile/Frontend AI Agent untuk proyek **FinManage Android V1** (React Native + Expo + TypeScript)[cite: 1].
- Kerjakan seluruh kode HANYA di dalam folder `mobile/`[cite: 1].
- DILARANG mengubah `frontend-finance-web/` (hanya baca untuk referensi terjemahan `id.json`/`en.json` atau warna kategori) dan jangan mengubah `backend/`[cite: 1].
- Ikuti spesifikasi `docs/PRD-FinManage-Android-V1.md` (Bagian 7.1 Tech Stack, Bagian 10 Navigasi, Bagian 11.1/11.3/11.4 Fungsional, Bagian 14 UI/UX, Bagian 15 State Management, dan Bagian 18 Kontrak API)[cite: 1].

## 2. Aturan Teknis & UX Ketat
1. **Tanpa Library Web**: Jangan gunakan Tailwind/NativeWind, Recharts, GSAP, atau `react-hot-toast`[cite: 1]. Gunakan `StyleSheet` dengan token theme (`#4F46E5` Indigo sebagai warna primer, `#10B981` Emerald untuk pemasukan, `#EF4444` Red untuk pengeluaran), `@expo/vector-icons` (Feather), dan komponen `Modal` / `Animated` bawaan React Native[cite: 1].
2. **Pemisahan Layer**: Komponen UI dilarang memanggil Axios secara langsung[cite: 1]. Gunakan alur: `Komponen Layar -> Hook TanStack Query (src/hooks/) -> API Service (src/api/) -> Axios Instance`[cite: 1].
3. **Penyimpanan & Keamanan**:
   - Simpan token JWT HANYA di `expo-secure-store`[cite: 1].
   - Jangan pernah menyimpan data transaksi/keuangan ke `AsyncStorage` (biarkan hanya di memori cache TanStack Query)[cite: 1].
   - Saat logout atau menerima HTTP 401 dari server: hapus token dari SecureStore, panggil `queryClient.clear()`, kosongkan state auth, dan arahkan ke layar Login (`AUTH-03`, `AUTH-04`, `16.5`)[cite: 1].
4. **Terminologi & Input**:
   - Gunakan istilah **Nominal** (bukan Jumlah) di seluruh label form dan antarmuka (`BR-01`, `D20`)[cite: 1].
   - Semua input nominal selalu dalam **IDR** (bilangan bulat positif) dengan `keyboardType="numeric"` dan pemisah ribuan otomatis[cite: 1].
   - Target sentuh minimal `48 dp`, gunakan `react-native-safe-area-context`, dan pastikan `KeyboardAvoidingView` menjaga tombol Simpan tetap terjangkau[cite: 1].

## 3. Ruang Lingkup Pekerjaan M1

### A. Lapisan API & State (`src/api/`, `src/context/`, `src/hooks/`)
1. **Axios Client (`src/api/client.ts`)**:
   - `baseURL` dari `process.env.EXPO_PUBLIC_API_URL`[cite: 1].
   - Timeout khusus 60 detik untuk menangani cold start server disertai indikator *"Menyiapkan server…"* saat memanggil `/health` (`8.7`, `13`)[cite: 1].
   - Request interceptor menempelkan `Authorization: Bearer <token>`[cite: 1].
   - Response interceptor menormalisasi error menjadi `ApiError` (`code`, `message`, `details`, `status`) dalam bahasa aktif (`id`/`en`) dan memicu logout otomatis pada status 401[cite: 1].
2. **AuthContext (`src/context/AuthContext.tsx`)**:
   - Saat aplikasi dibuka, baca token dari SecureStore dan validasi sesi ke `GET /api/v1/profile`[cite: 1]. Jika valid masuk ke `(tabs)`, jika 401 bersihkan sesi dan arahkan ke `(auth)/login`[cite: 1].
   - Sediakan fungsi `login`, `register`, dan `logout` (dengan dialog konfirmasi sebelum memanggil `POST /api/v1/auth/logout`)[cite: 1].
3. **Komponen UI Inti (`src/components/ui/`)**:
   - `Button` (dengan loading spinner & disabled state saat mutasi berjalan untuk mencegah klik ganda), `Card`, `TextField`, `AmountField`, `DatePickerField` (`@react-native-community/datetimepicker`), `Select` (bottom sheet), `CategoryChip`, `EmptyState`, `ErrorState` (dengan tombol *Coba lagi*), `Skeleton`, `Toast`, `ConfirmDialog`, dan `BottomSheet`[cite: 1].

### B. Layar Autentikasi (`app/(auth)/login.tsx` & `register.tsx`)
- Form menggunakan **React Hook Form + Zod**:
  - Register (`AUTH-01`, `AUTH-07`): `name` (wajib), `email` (format email valid), `password` (8–128 karakter, wajib kombinasi huruf dan angka)[cite: 1].
  - Login (`AUTH-02`): `email` dan `password`[cite: 1].
- Tampilkan pesan error yang ramah pengguna bila `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, atau `RATE_LIMITED` (429)[cite: 1].

### C. Fitur & Layar Kategori (`app/categories.tsx`, diakses dari tab Lainnya)
- Daftar kategori dikelompokkan berdasarkan tab/filter **Pengeluaran** (`expense`) dan **Pemasukan** (`income`) (`CAT-01`)[cite: 1].
- Form Tambah & Edit Kategori (`CAT-02`, `CAT-03`):
  - Pilih tipe (`income` / `expense`), nama kategori, dan warna dari **12 warna preset**[cite: 1].
  - Jika kategori sedang diedit dan sudah dipakai (atau server mengembalikan `CATEGORY_TYPE_LOCKED`), nonaktifkan pengubahan tipe kategori (`CAT-06`)[cite: 1].
- Hapus Kategori (`CAT-05`): Konfirmasi hapus; jika server membalas 409 `CATEGORY_IN_USE`, tampilkan pesan jelas beserta jumlah transaksi/budget yang masih menggunakan kategori tersebut dari `error.details`[cite: 1].
- Invalidasi query `categories`, `transactions`, dan `budgets` setiap selesai mutasi[cite: 1].

### D. Fitur & Layar Transaksi (`app/(tabs)/transactions.tsx` & `app/transaction/form.tsx`)
1. **Daftar Transaksi (`TRX-03` s/d `TRX-06`)**:
   - Gunakan `FlatList` dengan tampilan kartu, pull-to-refresh, dan **infinite scroll** (`useInfiniteQuery`, 20 item per halaman)[cite: 1].
   - Bar pencarian (`search` deskripsi/kategori), bottom sheet filter (`type`, `categoryId`, rentang tanggal `dateFrom`–`dateTo`), dan pengurutan (`transactionDate` atau `amount`, naik/turun)[cite: 1].
   - Wajib memiliki `Skeleton` saat loading awal, `EmptyState` saat belum ada data, dan `ErrorState` dengan tombol *Coba lagi* saat gagal memuat[cite: 1].
2. **Form Tambah & Edit Transaksi (`TRX-01`, `TRX-02`, `TRX-09`)**:
   - Validasi dengan React Hook Form + Zod:
     - `type`: Pengeluaran / Pemasukan (mengubah daftar pilihan kategori secara dinamis agar tipe selalu cocok sesuai `BR-06`)[cite: 1].
     - `categoryId`: Pilih dari daftar kategori milik pengguna[cite: 1].
     - `amount` (Label: **Nominal**): Bilangan bulat IDR > 0 (`BR-01`)[cite: 1].
     - `transactionDate`: Default hari ini, batas maksimum (`maximumDate`) adalah hari ini WIB (`BR-05`)[cite: 1].
     - `description`: Opsional, maks 255 karakter[cite: 1].
   - Aksi hapus transaksi dilengkapi `ConfirmDialog`[cite: 1].
   - Setelah tambah/ubah/hapus transaksi berhasil: tampilkan `Toast` sukses dan invalidasi cache query `transactions`, `dashboard`, `budgets`, `reports`, serta `notifications` (Bagian 15)[cite: 1].

## 4. Kriteria Selesai (Definition of Done)
- `npx tsc --noEmit` dan ESLint lulus tanpa error[cite: 1].
- Alur Register -> Login -> Kelola Kategori -> Tambah/Filter/Edit/Hapus Transaksi -> Logout berjalan penuh di HP fisik melalui Expo Go yang terhubung ke backend nyata[cite: 1].