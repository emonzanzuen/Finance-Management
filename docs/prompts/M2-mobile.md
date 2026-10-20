# Prompt M2 — Fitur Inti P0 Mobile (Beranda, Anggaran, Tabungan, Laporan, Pengaturan Dasar, & Konfigurasi APK)

## 1. Peran & Konteks
Anda adalah Mobile/Frontend AI Agent untuk proyek **FinManage Android V1** (React Native + Expo + TypeScript)[cite: 1].
- Kerjakan seluruh kode HANYA di dalam folder `mobile/`[cite: 1].
- DILARANG mengubah folder `frontend-finance-web/` (hanya baca untuk referensi teks `id.json`/`en.json`) maupun `backend/`[cite: 1].
- Pada M1, autentikasi, kategori, dan transaksi sudah selesai[cite: 1]. Fokus M2 adalah menyelesaikan seluruh layar **Fitur Inti P0** (Beranda/Dashboard, Anggaran/Budget, Tabungan/Savings Goals, Laporan/Reports dengan grafik, serta Pengaturan Dasar & Kurs IDR/USD/EUR) sehingga aplikasi mencapai **Titik Aman Demo P0**[cite: 1].

## 2. Aturan Teknis, Visualisasi, & Aturan Bisnis Ketat
1. **Aturan Mata Uang & Input Nominal (`BR-01`, `BR-02`, `BR-18`)**:
   - Semua angka dari server berada dalam **IDR**[cite: 1]. Fungsi pemformat tampilan mengonversi angka IDR ke mata uang pilihan pengguna (`IDR`, `USD`, atau `EUR` pada P0) menggunakan kurs dari `GET /api/v1/currencies`[cite: 1].
   - Pembulatan tampilan: **IDR** tanpa desimal; **USD** dan **EUR** menggunakan 2 desimal (`BR-18`)[cite: 1].
   - **Input nominal pada seluruh form (Transaksi, Budget, Target Tabungan, Setoran) SELALU dalam IDR** (bilangan bulat) dan berlabel **Nominal** (bukan Jumlah)[cite: 1]. Jika mata uang tampilan aktif bukan IDR (mis. USD atau EUR), tampilkan teks perkiraan konversi di bawah kolom input (`BR-02`)[cite: 1].
2. **Aturan Grafik (`11.2`, `14.4`, `14.5`)**:
   - Gunakan `react-native-gifted-charts` + `react-native-svg`[cite: 1].
   - Ukuran grafik menyesuaikan lebar layar, legenda diletakkan di bawah grafik, dan nilai ditampilkan saat pengguna **mengetuk** elemen grafik (tidak ada hover)[cite: 1].
   - **Grafik hanya ditampilkan bila datanya cukup**: misalnya Line Chart tren 6 bulan membutuhkan minimal 2 bulan yang berisi data, dan Pie Chart membutuhkan total pengeluaran > 0[cite: 1]. Jika data kosong atau belum cukup, tampilkan `EmptyState` singkat atau daftar angka/peringkat kategori[cite: 1]. Jika kategori pada Pie Chart lebih dari 6, kelompokkan sisanya atau tampilkan daftar batang horizontal yang rapi agar tidak sempit di layar kecil[cite: 1].
3. **State & UX Standar**:
   - Setiap layar daftar/agregasi wajib memiliki `Skeleton` (loading awal), `EmptyState`, `ErrorState` (dengan tombol *Coba lagi*), dan mendukung `pull-to-refresh`[cite: 1].
   - Semua teks antarmuka wajib mengambil dari `useTranslation` (`id.json` dan `en.json`) dan semua warna mengambil dari token `theme` (mendukung mode Terang, Gelap, dan Ikuti Sistem)[cite: 1].

## 3. Ruang Lingkup Pekerjaan M2

### A. Preferensi, Kurs Mata Uang, & Layar Pengaturan Dasar (`SET-01` s/d `SET-03`, `CUR-01`, `CUR-02`, `CUR-04`)
1. **`PreferencesContext` (`src/context/PreferencesContext.tsx`)**:
   - Kelola state `themeMode` (`system` | `light` | `dark`), `language` (`id` | `en`), dan `currency` (`IDR` | `USD` | `EUR`)[cite: 1].
   - Simpan perubahan ke `@react-native-async-storage/async-storage` dan terapkan seketika **tanpa perlu restart aplikasi** (`SET-01`, `SET-02`, `SET-03`)[cite: 1].
2. **Hook Kurs (`src/hooks/useCurrencies.ts`)**:
   - Ambil data kurs dari `GET /api/v1/currencies` menggunakan TanStack Query[cite: 1].
   - Simpan kurs terakhir yang berhasil diambil ke `AsyncStorage` sebagai cadangan lokal bila aplikasi dibuka saat jaringan lambat (`7.4`, `8.6`)[cite: 1].
3. **Tab Lainnya (`app/(tabs)/more.tsx`) & Layar Pengaturan (`app/settings.tsx`)**:
   - Di tab **Lainnya**, tampilkan menu navigasi ke: **Kategori**, **Laporan**, **Pengaturan**, serta tombol **Keluar (Logout)** dengan dialog konfirmasi (`Section 10`, `AUTH-03`)[cite: 1].
   - Di layar **Pengaturan**, sediakan pemilih Tema (Ikuti sistem, Terang, Gelap), Bahasa (Indonesia, English), dan Mata Uang Tampilan (`IDR`, `USD`, `EUR`)[cite: 1].

### B. Layar Beranda / Dashboard (`app/(tabs)/index.tsx`) — `DASH-01` s/d `DASH-08`
Susun layar Beranda dari atas ke bawah dengan dukungan `pull-to-refresh` (`DASH-08`)[cite: 1]:
1. **Header & Filter Periode (`DASH-01`, `DASH-06`)**:
   - Salam dinamis dan nama bulan/tahun sesuai bahasa aktif, dilengkapi pemilih Bulan & Tahun serta ikon lonceng di kanan atas (mengarah ke layar notifikasi/placeholder M3)[cite: 1].
2. **Empat Kartu Ringkasan (`DASH-02`, `DASH-07`, `BR-03`)**:
   - **Saldo Catatan**: Tampilkan teks bantuan/info kecil bahwa ini adalah hasil hitung catatan (pemasukan dikurangi pengeluaran seluruh waktu) dan setoran tabungan tidak mengurangi saldo (`BR-03`)[cite: 1].
   - **Pemasukan Bulan Ini**, **Pengeluaran Bulan Ini**, dan **Total Tabungan**[cite: 1].
   - Mengetuk kartu mengarahkan pengguna ke tab/layar terkait (Transaksi atau Tabungan)[cite: 1].
3. **Grafik Beranda (`DASH-03`, `DASH-04`)**:
   - **Pie Chart Pengeluaran per Kategori** pada bulan terpilih beserta legenda persentase dan nominal di bawahnya[cite: 1].
   - **Line Chart Tren 6 Bulan** (Pemasukan hijau `#10B981` vs Pengeluaran merah `#EF4444`)[cite: 1].
4. **Lima Transaksi Terbaru (`DASH-05`)**:
   - Daftar 5 transaksi terakhir beserta tombol *"Lihat Semua"* menuju tab Transaksi[cite: 1].
5. **Floating Action Button (`+`)**:
   - Tersedia di Beranda dan Transaksi untuk membuka form tambah transaksi (`Section 10`)[cite: 1].

### C. Layar Anggaran / Budget (`app/(tabs)/budget.tsx`) — `BUD-01` s/d `BUD-08`
1. **Pemilih Bulan & Tahun (`BUD-07`)** di bagian atas layar[cite: 1].
2. **Kartu Ringkasan Budget (`BUD-03`, `BR-12`)**:
   - Menampilkan **Total Budget**, **Total Terpakai**, dan **Sisa**[cite: 1]. Jika Sisa bernilai negatif, tampilkan dengan warna merah (`#EF4444`)[cite: 1].
3. **Banner Peringatan (`BUD-06`)**:
   - Tampilkan banner peringatan di atas daftar bila ada kategori budget yang mencapai status **Kritis (>= 90%)** atau **Terlampaui (> 100%)**[cite: 1].
4. **Daftar Kartu Budget per Kategori (`BUD-04`, `BUD-08`, `BR-11`, `BR-24`)**:
   - Progress bar dengan warna status:
     - `< 70%`: **Aman** (Hijau `#10B981`)[cite: 1].
     - `70% – < 90%`: **Waspada** (Kuning/Amber `#F59E0B`)[cite: 1].
     - `90% – 100%`: **Kritis** (Merah `#EF4444`)[cite: 1].
     - `> 100%`: **Terlampaui** (Merah `#EF4444`), sisa budget tampil **negatif berwarna merah** (`BUD-08`, `BR-24`)[cite: 1].
5. **Form Tambah, Edit, & Hapus Budget (`BUD-01`, `BUD-02`)**:
   - Bottom sheet atau layar form dengan React Hook Form + Zod[cite: 1].
   - Pilihan kategori **hanya menampilkan kategori bertipe Pengeluaran (`expense`)** (`BR-09`)[cite: 1].
   - Input **Nominal** budget > 0 dalam IDR (tampilkan estimasi mata uang aktif di bawah input bila bukan IDR)[cite: 1].
   - Tangani error 409 `BUDGET_DUPLICATE` dengan pesan yang jelas[cite: 1].
   - Invalidasi query `budgets`, `dashboard`, dan `notifications` setelah mutasi[cite: 1].

### D. Layar Tabungan / Savings Goals (`app/(tabs)/savings.tsx`) — `SAV-01`, `SAV-02`, `SAV-04` s/d `SAV-06`
1. **Ringkasan Total Progres Tabungan (`SAV-04`)** di bagian atas[cite: 1].
2. **Daftar Target Tabungan (`SAV-04`, `SAV-05`, `BR-14`)**:
   - Setiap kartu menampilkan judul, jumlah terkumpul vs nominal target, persentase progress bar, deadline (jika ada), dan badge status:
     - `< 80%`: **Sedang berjalan**[cite: 1].
     - `80% – 99%`: **Hampir selesai** (Amber `#F59E0B`)[cite: 1].
     - `100%`: **Selesai** (Emerald `#10B981`) beserta badge **Selesai**[cite: 1].
   - Tombol **Setor** dinonaktifkan pada target yang sudah berstatus **Selesai** (`BR-13`)[cite: 1].
3. **Form Tambah/Edit/Hapus Target (`SAV-01`, `BR-13`)**:
   - Input `title`, `targetAmount` (label **Nominal Target**), dan `deadline` opsional[cite: 1].
   - Jika saat edit server membalas 400 `TARGET_BELOW_SAVED`, tampilkan pesan bahwa nominal target tidak boleh lebih kecil dari jumlah yang sudah terkumpul[cite: 1].
4. **Form Setor Tabungan (`SAV-02`, `SAV-06`, `BR-13`)**:
   - Bottom sheet form untuk mengisi **Nominal Setoran** (`amount`), tanggal setoran (`depositDate`), dan catatan opsional (`note`)[cite: 1].
   - Tampilkan informasi **Sisa Target** di atas input agar pengguna tahu batas maksimal setoran[cite: 1].
   - Jika input/server menolak karena melebihi sisa (`DEPOSIT_EXCEEDS_TARGET`), tampilkan pesan error yang menyebutkan nominal sisa yang masih bisa disetor (`error.details.remaining`) (`SAV-06`)[cite: 1].
   - Invalidasi query `savings`, `dashboard`, dan `notifications` setelah mutasi[cite: 1].

### E. Layar Laporan / Reports (`app/reports.tsx`) — `REP-01` s/d `REP-06`
Diakses melalui tab **Lainnya -> Laporan**:
1. **Filter Bulan dan Tahun (`REP-01`)**[cite: 1].
2. **Kartu Ringkasan Laporan (`REP-02`)**: Pemasukan, Pengeluaran, dan Selisih (Net) pada bulan terpilih[cite: 1].
3. **Visualisasi Grafik (`REP-03`, `REP-04`, `REP-05`)**:
   - **Pie Chart Pengeluaran per Kategori** (`REP-03`) dari `GET /api/v1/reports/monthly`[cite: 1].
   - **Bar Chart Pemasukan per Kategori** (`REP-04`) dari `GET /api/v1/reports/monthly`[cite: 1].
   - **Line Chart Tren 12 Bulan** (`REP-05`) pada tahun terpilih dari `GET /api/v1/reports/trend?year=`[cite: 1].
4. **Daftar Transaksi Bulan Terpilih (`REP-06`)**:
   - Mengambil data dari `GET /api/v1/transactions` dengan parameter `dateFrom` (tanggal 1 bulan terpilih) dan `dateTo` (tanggal terakhir bulan terpilih) sesuai spesifikasi Bagian 18.2[cite: 1].

### F. Konfigurasi Build APK P0 (`app.config.ts` & `eas.json`) — Bagian 16.5 & 22.3
Siapkan konfigurasi untuk **Titik Aman Demo P0**:
- Di `app.config.ts`: pastikan `android.package` bernilai `"com.finmanage.app"` (`D11`) dan `android.allowBackup` diatur ke `false` (`16.5`, `SEC-19`)[cite: 1].
- Di `eas.json`: siapkan profil `preview` (output APK internal, HTTPS penuh) dan `local-demo` (output APK dengan izin cleartext HTTP hanya untuk profil ini melalui `expo-build-properties`) (`7.1`, `22.3`, `22.4`)[cite: 1].

## 4. Kriteria Selesai (Definition of Done)
- `npx tsc --noEmit` dan ESLint bersih tanpa error[cite: 1].
- Seluruh layar P0 (Beranda, Transaksi, Anggaran, Tabungan, Kategori, Laporan, Pengaturan) berfungsi penuh di HP fisik dengan data nyata dari API[cite: 1].
- Perubahan tema, bahasa (`id`/`en`), dan mata uang (`IDR`/`USD`/`EUR`) langsung memperbarui seluruh layar dan grafik tanpa restart[cite: 1].