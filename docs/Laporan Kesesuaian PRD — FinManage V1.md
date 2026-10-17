# Laporan kesesuaian PRD — FinManage V1

## 1. Ringkasan eksekutif

Estimasi kesesuaian **84,5% (60 dari 71 kebutuhan berstatus Sesuai)** berdasarkan pemeriksaan kode frontend. Angka ini mengukur kecocokan fitur yang tampak di kode, bukan kelayakan V1: **integrasi REST API belum dipakai oleh alur aplikasi**, sehingga kriteria penerimaan V1 belum tercapai. Modul dengan gap paling jelas: **Categories** (duplikasi dan penghapusan kategori), **Budget** (tambah/hapus), dan **Settings** (Export/Import). **Savings** belum membatasi nilai `currentAmount` pada validasi skema, meski alur deposit membatasinya di context. Pengujian browser tidak dilakukan.

| Modul | Sesuai | Total | Kesesuaian |
|---|---:|---:|---:|
| Authentication | 4 | 7 | 57% |
| Dashboard | 8 | 9 | 89% |
| Transactions | 8 | 9 | 89% |
| Categories | 6 | 8 | 75% |
| Budget | 6 | 7 | 86% |
| Savings Goals | 6 | 7 | 86% |
| Reports | 6 | 7 | 86% |
| Profile | 4 | 4 | 100% |
| Settings | 7 | 8 | 88% |
| Notifications | 5 | 5 | 100% |

## 2. Kebutuhan fungsional

Status mengikuti bukti di kode, bukan label status pada PRD. **Sebagian** berarti fitur ada tetapi tidak lengkap atau punya keterbatasan; **Menyimpang** berarti implementasinya berlawanan dengan kebutuhan atau aturan PRD.

| ID | Kebutuhan (singkat) | Status | Bukti | Catatan |
|---|---|---|---|---|
| FR-AUTH-01 | Login akun demo | Sesuai | `src/pages/Login/Login.jsx:10-28` | Kredensial demo dicantumkan di UI, `:125-140`. |
| FR-AUTH-02 | Validasi format email dan field wajib | Sebagian | `src/pages/Login/Login.jsx:59-73,88-95` | Validasi browser `required` dan `type=email`; belum memakai skema validasi. |
| FR-AUTH-03 | Redirect ke Dashboard setelah login | Sesuai | `src/pages/Login/Login.jsx:20-23` |  |
| FR-AUTH-04 | Logout dengan konfirmasi | Sesuai | `src/pages/Profile/Profile.jsx:115-120` | Sidebar menyediakan jalur logout lain tanpa dialog: `src/components/layout/Sidebar.jsx:36-40`. |
| FR-AUTH-05 | State autentikasi melalui AuthContext | Sesuai | `src/context/AuthContext.jsx:5-27` | Status auth disimpan di LocalStorage. |
| FR-AUTH-06 | Remember Me | Belum | `src/utils/validations.js:66-73` | Field `rememberMe` ada di skema, tetapi tidak ditemukan alur Remember Me di halaman login. |
| FR-AUTH-07 | Ubah password | Belum | `src/services/api.js:50-56` | Ada endpoint service, tetapi belum digunakan UI atau context. |
| FR-DASH-01 | Greeting dan bulan dinamis sesuai bahasa | Sesuai | `src/pages/Dashboard/Dashboard.jsx:293-300` |  |
| FR-DASH-02 | Summary cards dan popup detail | Sesuai | `src/pages/Dashboard/Dashboard.jsx:312-368` |  |
| FR-DASH-03 | Pie chart pengeluaran per kategori | Sesuai | `src/pages/Dashboard/Dashboard.jsx:103-114,376-410` |  |
| FR-DASH-04 | Tren enam bulan | Sesuai | `src/pages/Dashboard/Dashboard.jsx:120-136,422-454` |  |
| FR-DASH-05 | Lima transaksi terbaru | Sesuai | `src/context/AppContext.jsx:278-280`; `src/pages/Dashboard/Dashboard.jsx:461-515` |  |
| FR-DASH-06 | Konversi nilai sesuai mata uang pilihan | Sesuai | `src/context/AppContext.jsx:30-35,257-262` | Mengonversi nilai IDR ketika ditampilkan. |
| FR-DASH-07 | Tooltip kustom berisi nilai, persentase, selisih | Sesuai | `src/pages/Dashboard/Dashboard.jsx:190-254` |  |
| FR-DASH-08 | Animasi GSAP dan counter | Sesuai | `src/pages/Dashboard/Dashboard.jsx:70-97` | Ada animasi kartu; perlu verifikasi browser untuk perilaku counter. |
| FR-DASH-09 | Financial Insight otomatis | Belum | Belum ditemukan |  |
| FR-TRX-01 | Tambah, edit, hapus transaksi | Sesuai | `src/pages/Transactions/Transactions.jsx:78-100,114-145,148-151` |  |
| FR-TRX-02 | Cari deskripsi atau kategori | Sesuai | `src/pages/Transactions/Transactions.jsx:54-61` |  |
| FR-TRX-03 | Filter tipe dan kategori | Sesuai | `src/pages/Transactions/Transactions.jsx:25-27,54-61` |  |
| FR-TRX-04 | Sortir tanggal atau jumlah | Sesuai | `src/pages/Transactions/Transactions.jsx:28-29,63-73` |  |
| FR-TRX-05 | Pagination | Sesuai | `src/pages/Transactions/Transactions.jsx:30-31,75-76,653-684` |  |
| FR-TRX-06 | Modal portal dengan validasi form | Sebagian | `src/pages/Transactions/Transactions.jsx:114-145,169-180,264-382` | Validasi manual, bukan React Hook Form + Zod. |
| FR-TRX-07 | Preview sebelum submit | Sesuai | `src/pages/Transactions/Transactions.jsx` | Preview ada di UI form; kode submit di `:114-145`. |
| FR-TRX-08 | Konfirmasi sebelum hapus | Sesuai | `src/pages/Transactions/Transactions.jsx:148-151` |  |
| FR-TRX-09 | Modal Transaction Detail | Belum | Belum ditemukan |  |
| FR-CAT-01 | Kategori pemasukan bawaan | Sesuai | `src/data/initialData.js:44-50` |  |
| FR-CAT-02 | Kategori pengeluaran bawaan | Sesuai | `src/data/initialData.js:53-60` |  |
| FR-CAT-03 | Tambah, edit, hapus kategori | Sesuai | `src/pages/Categories/Categories.jsx:72-109`; `src/context/AppContext.jsx:310-375` |  |
| FR-CAT-04 | Dua belas warna dan color picker | Sesuai | `src/pages/Categories/Categories.jsx` | Ada preset dan pemilih warna. |
| FR-CAT-05 | Pindahkan kategori ketika tipe diubah | Sesuai | `src/context/AppContext.jsx:319-352` |  |
| FR-CAT-06 | Preview kategori | Sesuai | `src/pages/Categories/Categories.jsx` |  |
| FR-CAT-07 | Cegah nama duplikat dan kosong | Sebagian | `src/pages/Categories/Categories.jsx:72-88`; `src/context/AppContext.jsx:310-317` | Nama kosong ditolak di form; tidak ditemukan pengecekan duplikat. |
| FR-CAT-08 | Aturan hapus kategori yang sedang dipakai | Belum | `src/context/AppContext.jsx:355-375` | Kategori dihapus tanpa memeriksa transaksi atau budget yang merujuknya. |
| FR-BUD-01 | Ringkasan total budget, pengeluaran, sisa | Sesuai | `src/pages/Budget/Budget.jsx:89-92,121-165` |  |
| FR-BUD-02 | Warna progress hijau, kuning, merah | Sesuai | `src/pages/Budget/Budget.jsx:177-183` |  |
| FR-BUD-03 | Rincian progress per kategori | Sesuai | `src/pages/Budget/Budget.jsx:213-240` |  |
| FR-BUD-04 | Peringatan setelah 90% | Sesuai | `src/pages/Budget/Budget.jsx:190-197` |  |
| FR-BUD-05 | Pengeluaran dihitung dari transaksi | Sebagian | `src/pages/Budget/Budget.jsx:16-34` | Dihitung dari transaksi, tetapi hasilnya disalin ke objek budget dan disimpan melalui context. |
| FR-BUD-06 | Edit budget melalui modal | Sesuai | `src/pages/Budget/Budget.jsx:116-119`; `src/pages/Budget/BudgetForm.jsx:9-29,48-76` |  |
| FR-BUD-07 | Tambah dan hapus budget per kategori/bulan/tahun | Sebagian | `src/pages/Budget/BudgetForm.jsx:20-29,48-76` | Dapat mengubah bulan/tahun dan nilai kategori; tidak ditemukan alur tambah/hapus item budget. |
| FR-SAV-01 | Tambah, edit, hapus target | Sesuai | `src/pages/SavingsGoals/SavingsGoals.jsx:49-63`; `src/pages/SavingsGoals/GoalForm.jsx:55-75` |  |
| FR-SAV-02 | Progress per target dan total | Sesuai | `src/pages/SavingsGoals/SavingsGoals.jsx:84-87,108-131,146-149` |  |
| FR-SAV-03 | Deposit ke target | Sesuai | `src/pages/SavingsGoals/SavingsGoals.jsx:70-81,247-260` |  |
| FR-SAV-04 | Status berjalan, hampir selesai, selesai | Sesuai | `src/pages/SavingsGoals/SavingsGoals.jsx:148-150,228-243` |  |
| FR-SAV-05 | Badge saat target tercapai | Sesuai | `src/pages/SavingsGoals/SavingsGoals.jsx:240` |  |
| FR-SAV-06 | Deadline opsional | Sesuai | `src/pages/SavingsGoals/GoalForm.jsx:60-64` |  |
| FR-SAV-07 | Nilai tabungan tidak melebihi target | Sebagian | `src/context/AppContext.jsx:399-405`; `src/utils/validations.js:43-52` | Deposit dibatasi dengan `Math.min`, tetapi skema tidak membatasi `currentAmount` terhadap `targetAmount` dan jalur lain belum terjamin. |
| FR-REP-01 | Filter bulan dan tahun | Sesuai | `src/pages/Reports/Reports.jsx:30-39` |  |
| FR-REP-02 | Ringkasan pemasukan, pengeluaran, selisih | Sesuai | `src/pages/Reports/Reports.jsx:41-43` |  |
| FR-REP-03 | Pie chart pengeluaran per kategori | Sesuai | `src/pages/Reports/Reports.jsx:45-56` |  |
| FR-REP-04 | Bar chart pemasukan per kategori | Sesuai | `src/pages/Reports/Reports.jsx:58-67` |  |
| FR-REP-05 | Tren 12 bulan | Sesuai | `src/pages/Reports/Reports.jsx:69-79` |  |
| FR-REP-06 | Tabel transaksi per bulan | Sesuai | `src/pages/Reports/Reports.jsx` |  |
| FR-REP-07 | Export PDF/Excel simulasi | Sebagian | `src/pages/Reports/Reports.jsx:172-196` | PDF memanggil print browser; tombol “Excel” mengunduh CSV. |
| FR-PRO-01 | Avatar dengan upload foto | Sesuai | `src/pages/Profile/Profile.jsx:82-112` | Foto dibaca sebagai base64. |
| FR-PRO-02 | Edit nama dan email tervalidasi | Sesuai | `src/pages/Profile/Profile.jsx:59-79` | Validasi dilakukan manual. |
| FR-PRO-03 | Statistik profil | Sesuai | `src/pages/Profile/Profile.jsx:123-127` |  |
| FR-PRO-04 | Tombol logout | Sesuai | `src/pages/Profile/Profile.jsx:115-120` |  |
| FR-SET-01 | Tema tersimpan dan mengikuti preferensi sistem | Sesuai | `src/context/ThemeContext.jsx:13-27` | Menginisialisasi dari `prefers-color-scheme` jika belum ada tema tersimpan. |
| FR-SET-02 | IDR, USD, EUR | Sesuai | `src/context/AppContext.jsx:9,30-35`; `src/pages/Settings/Settings.jsx` |  |
| FR-SET-03 | Indonesia/English tanpa reload | Sesuai | `src/hooks/useTranslation.js`; `src/pages/Settings/Settings.jsx:58-63` |  |
| FR-SET-04 | Kurs, refresh, cache, fallback | Sesuai | `src/context/AppContext.jsx:9-13,123-197` | Cache TTL satu jam, refresh 30 menit, fallback saat gagal. |
| FR-SET-05 | Backup/restore, riwayat, hapus | Sesuai | `src/context/AppContext.jsx:423-489,511-524`; `src/pages/Settings/Settings.jsx:69-88` | Metadata dibatasi sepuluh riwayat di context; UI menampilkan tiga terbaru. |
| FR-SET-06 | Reset dengan ketik RESET dan backup | Sebagian | `src/pages/Settings/Settings.jsx:91-103,293-314,337-379`; `src/context/AppContext.jsx:498-508` | Konfirmasi dan backup otomatis ada; tombol reset tampak pada halaman Settings tanpa gating production yang teridentifikasi. |
| FR-SET-07 | Informasi aplikasi | Sesuai | `src/pages/Settings/Settings.jsx:316-334` |  |
| FR-SET-08 | Export/Import data | Belum | Belum ditemukan | Backup LocalStorage tidak menyediakan pertukaran file CSV/Excel. |
| FR-NOT-01 | Badge notifikasi belum dibaca | Sesuai | `src/context/AppContext.jsx:87`; `src/components/layout/Navbar.jsx` |  |
| FR-NOT-02 | Dropdown dengan ikon tiap tipe | Sesuai | `src/components/layout/Navbar.jsx`; `src/context/AppContext.jsx:233-241` |  |
| FR-NOT-03 | Timestamp relatif | Sesuai | `src/components/layout/Navbar.jsx` |  |
| FR-NOT-04 | Tandai terbaca dan semua terbaca | Sesuai | `src/components/layout/Navbar.jsx`; `src/context/AppContext.jsx` |  |
| FR-NOT-05 | Notifikasi saat CRUD berhasil | Sesuai | `src/context/AppContext.jsx:294-307,310-317,369-410` | Notifikasi disimpan lokal di state, bukan persistensi API. |

## 3. Ketidaksesuaian poin B–F

| Topik | Kata PRD | Kondisi di kode | Dampak |
|---|---|---|---|
| Collection dan model | `users`, `categories`, `transactions`, `budgets`, `savings_goals` | `src/data/initialData.js` memakai data awal lokal; transaksi/category disimpan dalam bentuk frontend dengan `date`/`category`; belum tampak struktur collection/API yang sama. | Migrasi butuh pemetaan field dan relasi. |
| Saldo dan laporan | Hasil hitung tidak disimpan | Saldo dihitung dari transaksi di `src/context/AppContext.jsx:266-280`; laporan juga dihitung dari transaksi di `src/pages/Reports/Reports.jsx:36-79`. | Sesuai untuk saldo/laporan. |
| `spentAmount` | Tidak disimpan; hitung realtime | `src/pages/Budget/Budget.jsx:16-34` menghitung dari transaksi, lalu memanggil `updateBudget`; `src/context/AppContext.jsx:199-210` menyimpan seluruh `budget`. Data awal juga memiliki `spentAmount` (`src/data/initialData.js:64-75`). | Nilai turunan ikut tersimpan dan berisiko basi/tidak konsisten. |
| Mata uang dasar | Simpan IDR, konversi hanya untuk tampilan | Nilai transaksi contoh berupa angka rupiah (`src/data/initialData.js:1-42`); konversi tampilan dilakukan di context/dashboard. | Konsisten dengan desain IDR, meski kode belum menetapkan kontrak data API. |
| Validasi form | RHF + Zod; nominal > 0; tipe income/expense; nama kategori wajib | Skema Zod tersedia (`src/utils/validations.js:4-23,43-73`), tetapi halaman transaksi/kategori/budget/savings memakai state dan validasi manual. `budgetAmount` memakai `.min(0)` (`:30-37`), sehingga nilai nol diterima. | Aturan validasi tersebar; skema tidak menjadi pengaman aktual semua form. |
| Service/API | Service Layer → Axios → REST API; UI terpisah dari akses data | `src/services/api.js:1-102` mendefinisikan Axios service, tetapi alur UI memakai `useApp` dan `localStorage` (`src/context/AppContext.jsx:40-80,199-225`). | Service belum terintegrasi; kode UI saat ini tidak membaca/menulis lewat API. |
| Axios / endpoint | Endpoint sesuai rencana API | Service memakai route seperti `/budget/current`, `/goals`, `/auth/profile` (`src/services/api.js:50-98`), berbeda dari sejumlah resource PRD seperti `/budgets` dan `/savingsGoals`. | Kontrak frontend dan rencana API perlu diselaraskan sebelum integrasi. |
| Warna primer | Perlu memilih blue-600 atau indigo | `src/tailwind.config.js` dan `src/index.css` menggunakan token primary; beberapa halaman memakai kelas `indigo-*`, misalnya `src/pages/Dashboard/Dashboard.jsx:146-149`. | Penggunaan warna primer belum sepenuhnya seragam; konflik pilihan blue/indigo masih perlu diputuskan. |
| Toast | Komponen Toast kustom menurut posisi PRD; planning awal React Hot Toast | Root merender React Hot Toast (`src/main.jsx:6,17-19`) dan banyak aksi memanggil `react-hot-toast`; komponen kustom juga ada di `src/components/ui/Toast.jsx`. | Dua pendekatan tersedia; komponen kustom dapat menjadi kode tak terpakai. |
| Navigasi mobile | PRD memilih bottom navigation | `src/components/layout/MobileNav.jsx:85-119` menyediakan bottom nav dan drawer “lainnya”. | Sesuai keputusan PRD; implementasi sidebar mobile juga ada (`src/components/layout/Sidebar.jsx:50-64`), sehingga perilaku aktual perlu dicek. |
| Tema default | Mengikuti `prefers-color-scheme` | `src/context/ThemeContext.jsx:13-16` mengikuti preferensi sistem saat belum ada nilai tersimpan. | Sesuai posisi PRD, bukan dark default. |
| Custom hook | PRD menganggap tiga hook | Ada `useLocalStorage`, `useTheme`, `useTranslation` di `src/hooks/`. Ada pula `useTheme` lain yang diekspor `src/context/ThemeContext.jsx:5`. | Jumlah di folder hooks adalah tiga; implementasi `useTheme` berpotensi membingungkan karena duplikasi. |
| Responsive dan tabel | Mobile satu kolom, tabel bisa scroll; grid adaptif | Kelas responsive terlihat di Dashboard dan halaman lain; tabel Dashboard memakai `overflow-x-auto` (`src/pages/Dashboard/Dashboard.jsx:312,376,475`). | Dukungan layout tampak dari kode; breakpoint, overflow, dan target sentuh aktual perlu diuji di browser. |
| Aksesibilitas | Label input, focus state, navigasi keyboard, tooltip tombol ikon | Beberapa input punya kelas focus dan label visual, misalnya Login (`src/pages/Login/Login.jsx:61-73,88-95`); label tidak semuanya mengikat input melalui `htmlFor`/`id`. | Pembaca layar dan akses keyboard belum dapat dipastikan; tombol ikon perlu audit lebih menyeluruh. |

## 4. Fitur ekstra di luar PRD

- Tombol “Lupa sandi?” pada halaman Login (`src/pages/Login/Login.jsx:82-84`), tanpa alur pemulihan yang ditemukan.
- Animasi/komponen progress tambahan dan popup chart; sebagian melampaui kebutuhan minimum yang tertulis.
- Service API menyediakan endpoint registrasi dan statistik (`src/services/api.js:50-65`), sementara registrasi bukan fitur V1 dan service belum terhubung ke UI.

## 5. Risiko dan bug potensial

1. **P0 — Data finansial tidak memakai REST API.** `src/context/AppContext.jsx:199-225` menyimpan transaksi, kategori, budget, goals, dan user ke LocalStorage; service Axios terpisah dari alur halaman. Kriteria penerimaan API belum terpenuhi.
2. **P0 — Data sensitif di LocalStorage dan login bukan autentikasi nyata.** `src/context/AuthContext.jsx:5-17` hanya mengatur flag autentikasi; Login memeriksa kredensial hard-coded (`src/pages/Login/Login.jsx:15-28`). Nilai user disimpan lokal (`src/context/AppContext.jsx:216-217`).
3. **P1 — Hapus kategori dapat meninggalkan referensi yatim.** Penghapusan hanya menghapus kategori dari daftar (`src/context/AppContext.jsx:355-375`); tidak memeriksa transaksi/budget pemakainya.
4. **P1 — Budget menyimpan hasil hitungan transaksi.** `src/pages/Budget/Budget.jsx:19-34` menulis `spentAmount` hasil hitung kembali ke budget, berlawanan dengan aturan model data.
5. **P1 — Validasi belum seragam dan Zod tidak mengikat form.** Form memakai validasi manual; `budgetAmount` boleh nol menurut skema (`src/utils/validations.js:30-37`), padahal aturan data meminta nominal > 0.
6. **P1 — Reset tersedia di UI tanpa pembatasan production yang tampak.** Tombol ditampilkan di Settings (`src/pages/Settings/Settings.jsx:293-314`); PRD meminta fitur tidak tampil pada build production.
7. **P1 — Format ekspor berpotensi menghasilkan CSV tidak valid.** Field seperti deskripsi/kategori disisipkan tanpa escaping tanda kutip atau koma (`src/pages/Reports/Reports.jsx:181-194`).
8. **P2 — Foto avatar base64 menambah ukuran LocalStorage.** Pembacaan data URI terlihat di `src/pages/Profile/Profile.jsx:103-110`; batas ukuran foto 2 MB (`:91-100`).
9. **P2 — Format tanggal berbeda dari nama field PRD.** Frontend memakai `date` pada transaksi, sedangkan PRD menyebut `transactionDate`; pemetaan diperlukan saat migrasi.

## 6. Gap yang perlu ditutup untuk V1

| ID PRD | Pekerjaan | Usaha |
|---|---|---|
| FR-AUTH-01–05, seluruh modul / kriteria penerimaan | Integrasikan alur aplikasi ke REST API; selaraskan endpoint dan bentuk data, lalu tambahkan loading/error state. | Besar |
| FR-CAT-08 | Putuskan aturan hapus kategori yang sedang dipakai dan tegakkan di kode. | Sedang |
| FR-CAT-07 | Tambahkan validasi duplikat nama kategori, termasuk aturan case/spasi. | Kecil |
| FR-BUD-07 | Sediakan tambah/hapus budget per kategori untuk bulan dan tahun. | Sedang |
| FR-BUD-05, model data | Hentikan penyimpanan `spentAmount`; hitung dari transaksi ketika dibutuhkan. | Kecil |
| FR-SAV-07 | Validasi batas `currentAmount <= targetAmount` di semua jalur perubahan data. | Kecil |
| FR-SET-06 | Sembunyikan Reset Data di production sesuai environment. | Kecil |
| FR-SET-08 | Implementasikan ekspor/impor file data; tentukan format V1. | Sedang |
| FR-TRX-09 | Tambahkan modal/detail transaksi. | Sedang |
| FR-DASH-09 | Tambahkan Financial Insight atau putuskan penghapusannya dari ruang lingkup V1. | Sedang |
| FR-AUTH-06 | Tambahkan Remember Me dan aturan persistensi sesi. | Kecil |
| FR-AUTH-07 | Tambahkan alur ubah password bila tetap masuk lingkup login/backend V1. | Sedang |

## 7. Hal yang perlu dites manual di browser

- Login, redirect, logout dan dialog konfirmasi, serta perilaku sesi setelah refresh.
- Layout di mobile/tablet/desktop: bottom nav, drawer “lainnya”, sidebar, overflow tabel, ukuran target sentuh, dan modal.
- Dark/light theme, termasuk perubahan preferensi sistem dan tema tersimpan; bahasa dan mata uang tanpa reload.
- Animasi GSAP, tooltip grafik, popup ringkasan, toast, dan akses keyboard/focus.
- Perhitungan dashboard, budget, dan laporan saat transaksi ditambah, diubah, atau dihapus.
- Kegagalan API kurs, cache/refresh, fallback, dan konsistensi mata uang yang ditampilkan.
- Alur restore/reset/backup, batas sepuluh backup, serta apakah reset benar-benar disembunyikan pada konfigurasi production.
- Label pembaca layar dan keterikatan setiap label input, termasuk kontrol ikon.

**Catatan:** audit hanya membaca kode dan konfigurasi yang diminta. Build, pengujian otomatis, dan pengujian browser tidak dijalankan.
