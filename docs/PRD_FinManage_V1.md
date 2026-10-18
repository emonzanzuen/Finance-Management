# Product Requirements Document (PRD)

**FinManage — Personal Finance Management System** Versi dokumen: 1.0 | Rilis target: V1 (MVP) | Tanggal: 15 Oktober 2026 | Status: Draft untuk review

---

## 1. Ringkasan Eksekutif

FinManage adalah aplikasi web responsif untuk mencatat dan mengelola keuangan pribadi. Pengguna dapat mencatat pemasukan dan pengeluaran, mengelompokkan transaksi ke dalam kategori, menetapkan budget bulanan, membuat target tabungan, serta melihat laporan dan grafik kondisi keuangan secara otomatis.

V1 difokuskan sebagai **MVP**: hanya fitur yang benar-benar penting untuk pemakaian harian, tanpa fitur kompleks seperti Wallet atau transaksi berulang. Frontend saat ini sudah sekitar **50% selesai** (seluruh 9 halaman sudah ada dengan data di LocalStorage). Sisa pekerjaan utama adalah integrasi backend/REST API, penyempurnaan fitur yang masih berstatus simulasi, serta testing dan deployment.

| Item | Detail |
| --- | --- |
| Nama produk | FinManage (Personal Finance Management System) |
| Platform | Web responsif (mobile, tablet, laptop, desktop) |
| Versi | V1 (MVP) |
| Peran pengguna | Satu jenis: User (aplikasi personal, single user) |
| Tech stack frontend | React 19, Vite, Tailwind CSS, TailGrids, GSAP, Recharts, React Router, React Hook Form, Zod, Lucide React |
| Penyimpanan saat ini | LocalStorage (sementara, disiapkan untuk migrasi ke backend) |
| Penyimpanan target V1 | REST API (JSON Server + db.json) via Axios |

---

## 2. Latar Belakang dan Masalah

Masalah yang ingin diselesaikan:

1. Pengguna sulit mengetahui berapa uang yang masuk dan keluar.
2. Pengeluaran sering tidak terkontrol karena tidak ada batas yang jelas.
3. Tidak ada catatan transaksi yang rapi dan mudah dicari.
4. Sulit mengetahui kondisi keuangan setiap bulan.
5. Tidak ada target tabungan yang jelas dan terukur.

Project ini juga berfungsi sebagai sarana belajar React (component, props, state, routing, form, CRUD, context, API) sambil menghasilkan aplikasi yang benar-benar dapat dipakai sehari-hari.

---

## 3. Tujuan, Sasaran, dan Metrik Keberhasilan

### 3.1 Tujuan Produk

Aplikasi harus mampu:

- Mencatat pemasukan dan pengeluaran.
- Menghitung saldo secara otomatis.
- Mengelompokkan transaksi berdasarkan kategori.
- Membuat budget bulanan dan memantau progresnya.
- Membuat target tabungan dan memantau progresnya.
- Menampilkan laporan dan statistik keuangan.

### 3.2 Non-Goals (di luar V1)

- Wallet (Bank, Cash, E-Wallet) dan transfer antar wallet.
- Transaksi berulang (recurring) dan pengingat tagihan.
- Mata uang selain IDR, USD, EUR.
- Export PDF/Excel yang benar-benar berfungsi (di V1 masih simulasi).
- Notifikasi push dan sinkronisasi cloud.
- Dashboard analitik mendalam.
- Multi-user, role admin, dan manajemen akses.

### 3.3 Metrik Keberhasilan (usulan, perlu disepakati)

Materi sumber belum menetapkan angka target. Berikut usulan yang dapat disesuaikan oleh tim:

| Metrik | Usulan Target |
| --- | --- |
| Semua alur CRUD (transaksi, kategori, budget, target) berjalan melalui API tanpa error | 100% lolos uji manual |
| Pencatatan satu transaksi baru dari Dashboard | ≤ 3 langkah / kurang dari 30 detik |
| Layout tidak rusak pada semua breakpoint | 100% halaman lolos Responsive Checklist |
| Waktu muat halaman awal | < 3 detik pada koneksi normal |
| Konsistensi angka (saldo, budget, laporan) terhadap data transaksi | 0 selisih pada pengujian |

---

## 4. Target Pengguna

| Segmen | Kebutuhan Utama |
| --- | --- |
| Mahasiswa | Mengatur uang saku, menghindari boros, menabung untuk target kecil |
| Karyawan | Memantau gaji vs pengeluaran bulanan, menjaga budget tagihan |
| Freelancer | Mencatat pemasukan tidak tetap dari berbagai sumber |
| Pengguna umum | Gambaran sederhana kondisi keuangan pribadi |

**Peran:** hanya satu, yaitu *User*. Tidak ada admin pada V1.

---

## 5. Ruang Lingkup dan Status Implementasi

Legenda status: ✅ Selesai di frontend (data LocalStorage) | 🔶 Sebagian / simulasi | ⏳ Belum dikerjakan.

| Modul | Status Frontend | Sisa Pekerjaan untuk V1 |
| --- | --- | --- |
| Authentication (Login) | ✅ (akun demo) | Validasi ke API, Remember Me, Change Password |
| Dashboard | ✅ | Financial Insight, data dari API |
| Transactions | ✅ | Integrasi API, Transaction Detail |
| Categories | ✅ | Integrasi API, pencegahan duplikasi nama |
| Budget | ✅ | Integrasi API, hapus budget |
| Savings Goals | ✅ | Integrasi API |
| Reports | 🔶 | Export PDF/Excel masih simulasi |
| Profile | ✅ | Integrasi API, Change Password |
| Settings | ✅ | Integrasi API, penyesuaian fitur Reset (lihat 8.9) |
| Notifications | ✅ (lokal) | Persistensi ke API (opsional) |
| Multi-language & Multi-currency | ✅ | Tetap; pastikan nilai tersimpan konsisten di IDR |
| Integrasi Backend/API | ⏳ | Seluruh modul |
| Testing & Deployment | ⏳ | Seluruh modul |

---

## 6. User Flow Utama

**Alur inti harian:** Login → Dashboard → Tambah Transaksi → Saldo otomatis dihitung → Dashboard ter-update → Laporan ter-update.

**Alur budget:** Pengguna menetapkan budget per kategori → mencatat pengeluaran → progress bar budget bergerak otomatis (hijau → kuning → merah) → muncul peringatan saat pemakaian melewati 90%.

**Alur tabungan:** Pengguna membuat target → melakukan deposit berkala → progres bertambah → status berubah menjadi Hampir selesai (80–99%) dan Selesai (100%).

### Sitemap

- Login
- Dashboard Layout
  - Dashboard
  - Transactions
  - Categories
  - Budget
  - Savings Goals
  - Reports
  - Profile
  - Settings

---

## 7. User Stories Utama

| ID | Sebagai User, saya ingin… | Agar… |
| --- | --- | --- |
| US-01 | login dengan email dan password | data keuangan saya terlindungi |
| US-02 | melihat saldo, pemasukan, pengeluaran, dan tabungan di satu layar | saya cepat tahu kondisi keuangan |
| US-03 | menambah, mengubah, dan menghapus transaksi | catatan saya selalu akurat |
| US-04 | mencari, memfilter, dan mengurutkan transaksi | saya mudah menemukan transaksi tertentu |
| US-05 | mengelola kategori sendiri | pengelompokan sesuai kebiasaan saya |
| US-06 | menetapkan budget bulanan per kategori | pengeluaran saya terkendali |
| US-07 | membuat target tabungan dan menyetor ke dalamnya | saya termotivasi mencapai target |
| US-08 | melihat laporan per bulan dan tahun | saya bisa mengevaluasi keuangan |
| US-09 | mengganti tema, bahasa, dan mata uang | aplikasi nyaman dipakai |
| US-10 | memakai aplikasi di HP maupun laptop | saya bisa mencatat kapan saja |

---

## 8. Kebutuhan Fungsional

Prioritas: **P0** = wajib untuk V1, **P1** = penting, **P2** = opsional.

### 8.1 Authentication (Login)

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-AUTH-01 | Login dengan email dan password; akun demo `demo@finmanage.com` / `demo123` | P0 | ✅ |
| FR-AUTH-02 | Validasi form login (format email, field wajib) | P0 | ✅ |
| FR-AUTH-03 | Redirect otomatis ke Dashboard setelah login berhasil | P0 | ✅ |
| FR-AUTH-04 | Logout dengan dialog konfirmasi | P0 | ✅ |
| FR-AUTH-05 | State autentikasi reaktif melalui AuthContext | P0 | ✅ |
| FR-AUTH-06 | Opsi Remember Me | P2 | ⏳ |
| FR-AUTH-07 | Ubah password (opsional, jika login terhubung backend) | P2 | ⏳ |

### 8.2 Dashboard

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-DASH-01 | Greeting dengan nama bulan dinamis sesuai bahasa | P1 | ✅ |
| FR-DASH-02 | Summary Cards: Saldo, Pemasukan, Pengeluaran, Tabungan; klik membuka popup detail | P0 | ✅ |
| FR-DASH-03 | Pie Chart pengeluaran per kategori | P0 | ✅ |
| FR-DASH-04 | Line Chart tren 6 bulan terakhir | P0 | ✅ |
| FR-DASH-05 | Daftar 5 transaksi terbaru | P0 | ✅ |
| FR-DASH-06 | Seluruh nilai dikonversi sesuai mata uang terpilih | P0 | ✅ |
| FR-DASH-07 | Tooltip chart kustom (nilai, persentase, selisih) | P1 | ✅ |
| FR-DASH-08 | Animasi masuk halaman dan counter angka (GSAP) | P1 | ✅ |
| FR-DASH-09 | Financial Insight (ringkasan/insight otomatis) — ada di planning, belum ada di daftar fitur yang selesai | P1 | ⏳ |

### 8.3 Transactions

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-TRX-01 | Tambah, edit, dan hapus transaksi | P0 | ✅ |
| FR-TRX-02 | Pencarian berdasarkan deskripsi atau kategori | P0 | ✅ |
| FR-TRX-03 | Filter berdasarkan tipe (pemasukan/pengeluaran) dan kategori | P0 | ✅ |
| FR-TRX-04 | Sortir berdasarkan tanggal atau jumlah (naik/turun) | P0 | ✅ |
| FR-TRX-05 | Pagination dengan navigasi lengkap | P0 | ✅ |
| FR-TRX-06 | Form dalam modal (portal) dengan validasi tanggal, tipe, kategori, jumlah, deskripsi | P0 | ✅ |
| FR-TRX-07 | Preview transaksi sebelum submit | P1 | ✅ |
| FR-TRX-08 | Dialog konfirmasi sebelum hapus | P0 | ✅ |
| FR-TRX-09 | Transaction Detail (modal detail, sesuai sitemap) | P2 | ⏳ |

### 8.4 Categories

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-CAT-01 | Kategori pemasukan bawaan: Salary, Freelance, Bonus, Investment, Other | P0 | ✅ |
| FR-CAT-02 | Kategori pengeluaran bawaan: Food, Transportation, Shopping, Bills, Entertainment, Education, Health, Other | P0 | ✅ |
| FR-CAT-03 | Tambah, ubah, hapus kategori | P0 | ✅ |
| FR-CAT-04 | Pilihan warna (12 preset + color picker) | P1 | ✅ |
| FR-CAT-05 | Mengubah tipe memindahkan kategori otomatis antar kartu (income ↔ expense) | P1 | ✅ |
| FR-CAT-06 | Preview kategori sebelum submit | P2 | ✅ |
| FR-CAT-07 | Mencegah nama kategori duplikat dan kosong | P0 | ⏳ |
| FR-CAT-08 | Aturan saat kategori yang sudah dipakai transaksi/budget dihapus (diblokir atau dialihkan) — **perlu keputusan** | P0 | ⏳ |

### 8.5 Budget (Anggaran Bulanan)

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-BUD-01 | Summary: Total Budget, Total Pengeluaran, Sisa Budget | P0 | ✅ |
| FR-BUD-02 | Progress bar dengan warna status (hijau → kuning → merah) | P0 | ✅ |
| FR-BUD-03 | Breakdown dan progress per kategori | P0 | ✅ |
| FR-BUD-04 | Alert saat pemakaian budget melewati 90% | P0 | ✅ |
| FR-BUD-05 | Pengeluaran budget dihitung otomatis dari transaksi (tidak disimpan) | P0 | ✅ |
| FR-BUD-06 | Edit budget melalui modal | P0 | ✅ |
| FR-BUD-07 | Tambah dan hapus budget per kategori, bulan, dan tahun | P1 | 🔶 |

### 8.6 Savings Goals

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-SAV-01 | Tambah, ubah, hapus target tabungan | P0 | ✅ |
| FR-SAV-02 | Progress bar per target dan total progress semua target | P0 | ✅ |
| FR-SAV-03 | Deposit untuk menambah tabungan ke target | P0 | ✅ |
| FR-SAV-04 | Status: Sedang berjalan, Hampir selesai (80–99%), Selesai (100%) | P0 | ✅ |
| FR-SAV-05 | Badge "Selesai! 🎉" saat target tercapai | P2 | ✅ |
| FR-SAV-06 | Deadline opsional | P1 | ✅ |
| FR-SAV-07 | Jumlah tabungan saat ini tidak boleh melebihi target | P0 | perlu verifikasi |

### 8.7 Reports

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-REP-01 | Filter bulan dan tahun | P0 | ✅ |
| FR-REP-02 | Summary: Pemasukan, Pengeluaran, Selisih | P0 | ✅ |
| FR-REP-03 | Pie Chart pengeluaran per kategori | P0 | ✅ |
| FR-REP-04 | Bar Chart pemasukan per kategori | P0 | ✅ |
| FR-REP-05 | Line Chart tren bulanan 12 bulan | P0 | ✅ |
| FR-REP-06 | Tabel detail transaksi per bulan | P0 | ✅ |
| FR-REP-07 | Export PDF dan Excel — di V1 masih simulasi (siap koneksi backend) | P2 | 🔶 |

Laporan dihasilkan **realtime dari data transaksi**, bukan disimpan sebagai data tersendiri.

### 8.8 Profile

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-PRO-01 | Avatar dengan upload foto (saat ini base64 di LocalStorage) | P1 | ✅ |
| FR-PRO-02 | Edit nama dan email dengan validasi | P0 | ✅ |
| FR-PRO-03 | Statistik: total transaksi, jumlah target tabungan, total tabungan | P1 | ✅ |
| FR-PRO-04 | Tombol logout | P0 | ✅ |

### 8.9 Settings

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-SET-01 | Tema Dark/Light, tersimpan dan sinkron dengan `prefers-color-scheme` | P0 | ✅ |
| FR-SET-02 | Pilihan mata uang: IDR, USD, EUR | P0 | ✅ |
| FR-SET-03 | Pilihan bahasa: Indonesia, English (tanpa reload) | P0 | ✅ |
| FR-SET-04 | Kurs real-time dari `open.er-api.com`: auto-refresh 30 menit, cache TTL 1 jam, refresh manual, fallback bila API gagal (USD 16.500, EUR 20.600) | P1 | ✅ |
| FR-SET-05 | Backup & Restore data (maks. 10 riwayat backup, bisa dihapus) | P1 | ✅ (LocalStorage) |
| FR-SET-06 | Reset Data: konfirmasi ketik "RESET" dan backup otomatis sebelum reset | P2 | ✅ (khusus development) |
| FR-SET-07 | Info Tentang FinManage | P2 | ✅ |
| FR-SET-08 | **Export/Import data (CSV/Excel)** menggantikan Backup LocalStorage pada mode production | P1 | ⏳ |

**Catatan kebijakan:** Reset Data dan Backup LocalStorage hanya relevan selama masa pengembangan. Setelah terhubung ke database, tombol Reset harus dihapus dari UI pengguna (atau disembunyikan dengan environment variable), karena kesalahan input cukup diperbaiki dengan edit/hapus transaksi. Solusi backup sesungguhnya adalah Export/Import file.

### 8.10 Notifications

| ID | Kebutuhan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-NOT-01 | Badge jumlah notifikasi belum dibaca di navbar | P1 | ✅ |
| FR-NOT-02 | Dropdown daftar notifikasi dengan ikon per tipe (Success, Warning, Error, Info) | P1 | ✅ |
| FR-NOT-03 | Timestamp relatif (Baru saja, X menit/jam/hari lalu) | P1 | ✅ |
| FR-NOT-04 | Tandai terbaca saat diklik dan tandai semua terbaca | P1 | ✅ |
| FR-NOT-05 | Notifikasi otomatis setiap CRUD berhasil | P1 | ✅ |

Catatan: Notifikasi in-app sudah masuk V1, sedangkan **notifikasi push** tetap di V2.

### 8.11 Multi-Language dan Multi-Currency

- Terjemahan lewat file `src/locales/id.json` dan `en.json` dengan hook `useTranslation`, mendukung interpolasi placeholder seperti `{name}` dan `{year}`.
- Namespace: app, auth, nav, dashboard, transactions, categories, budget, savings, reports, profile, settings, common, months, months\_full.
- Mata uang: IDR (Rp), USD ($), EUR (€) dengan badge mata uang di navbar dan konversi otomatis di seluruh aplikasi.
- **Aturan data:** nominal disimpan dalam satu mata uang dasar (IDR), konversi hanya untuk tampilan.

---

## 9. Kebutuhan Non-Fungsional

### 9.1 Desain dan UI

- Gaya: dashboard modern, flat design, soft shadow, rounded corner, palet minimal, layout lega. Dark theme sebagai tema utama, light theme tersedia.
- Font: Inter. Ikon: hanya Lucide React.
- Warna: Income selalu hijau (emerald-500), Expense selalu merah (red-500), Budget warning amber-500, Information sky-500. Warna primer hanya untuk aksi utama.
- Komponen: 80–90% dari TailGrids, sisanya Tailwind utility dan custom; komponen dibuat reusable.
- Radius: Card dan Modal `rounded-xl`, Button dan Input `rounded-lg`, Badge dan Avatar `rounded-full`.

### 9.2 Responsive

| Perangkat | Layout |
| --- | --- |
| Mobile (<640px) | Satu kolom; navigasi bawah (bottom navigation) dengan drawer "Lainnya"; tabel dapat digeser horizontal; toast di tengah atas |
| Tablet (640–1023px) | Sidebar collapse (ikon saja); grid 2 kolom |
| Desktop (≥1024px) | Sidebar tetap di kiri; dashboard 3–4 kolom |

Aturan tambahan: pendekatan mobile first, area sentuh minimal 44×44 px, tidak ada overflow horizontal kecuali tabel, modal hampir selebar layar di mobile.

### 9.3 Animasi

GSAP dengan durasi standar 0,3 / 0,5 / 0,8 detik dan ease `power2.out`: page transition, sidebar, stagger card, modal (scale 0,9 → 1), drawer mobile, counter angka. Animasi tidak boleh mengganggu performa.

### 9.4 Aksesibilitas

Kontras warna baik, label pada setiap input, focus state jelas, navigasi keyboard, tooltip untuk tombol hanya-ikon, pesan error mudah dipahami.

### 9.5 Performa, Keandalan, dan Keamanan

- Waktu muat awal target < 3 detik; animasi tetap mulus pada perangkat menengah.
- Kegagalan API kurs tidak boleh merusak aplikasi (fallback ke kurs default).
- Seluruh komunikasi data lewat REST API; frontend tidak membaca file database langsung.
- Password pada V1 disimpan plain text di JSON Server (hanya untuk pembelajaran) — **wajib diganti hashing + JWT** pada migrasi ke Express. Aplikasi tidak boleh dipakai untuk data keuangan sungguhan sebelum itu.
- Validasi input dilakukan di frontend (React Hook Form + Zod) dan wajib diulang di server saat backend custom tersedia.

---

## 10. Arsitektur dan Teknologi

### 10.1 Alur Data

User → React Component → Service Layer → Axios → REST API → JSON Server → db.json → Response → Update UI.

Komponen React hanya bertanggung jawab pada tampilan; akses data lewat service layer.

### 10.2 Stack

| Lapisan | Teknologi |
| --- | --- |
| UI | React 19, Vite, JavaScript ES6+, Tailwind CSS, TailGrids |
| Routing dan form | React Router DOM, React Hook Form, Zod |
| Visualisasi dan ikon | Recharts (Pie, Line, Bar, Area), Lucide React |
| Animasi | GSAP |
| State | Context API (AppContext, ThemeContext, AuthContext) + LocalStorage |
| Notifikasi/toast | Komponen Toast kustom (planning awal: React Hot Toast) |
| HTTP | Axios (tahap integrasi API) |
| Backend V1 | Node.js + JSON Server + db.json |
| Kualitas kode | ESLint, Prettier, Git/GitHub |

### 10.3 Struktur Project

Monorepo dengan folder `frontend/`, `backend/`, dan `docs/`. Frontend dikelompokkan per fitur: `components/` (common, layout, ui, forms, charts), `pages/` (9 halaman), `layouts/`, `routes/`, `hooks/`, `context/`, `services/`, `utils/`, `constants/`, `data/`, `styles/`.

### 10.4 Jalur Migrasi

LocalStorage → JSON Server → Express.js → MySQL/PostgreSQL → JWT Authentication → Cloud Database. Frontend tidak perlu banyak berubah karena kontrak komunikasi tetap REST API.

---

## 11. Model Data

Lima collection utama. Data hasil perhitungan **tidak disimpan** (saldo, total, progress budget, laporan, insight dihitung realtime).

| Collection | Field Utama |
| --- | --- |
| users | id, name, email, password, avatar, createdAt, updatedAt |
| categories | id, name, type (income/expense), color, icon, createdAt, updatedAt |
| transactions | id, userId, categoryId, type, amount, description (opsional), transactionDate, createdAt, updatedAt |
| budgets | id, userId, categoryId, month, year, budgetAmount, createdAt, updatedAt |
| savings\_goals | id, userId, title, targetAmount, currentAmount, deadline (opsional), createdAt, updatedAt |

**Relasi:** satu user memiliki banyak categories, transactions, budgets, dan savings goals; satu category memiliki banyak transactions dan budgets.

**Aturan data:**

- Semua collection memiliki `id` unik; nominal bertipe Number; timestamp format ISO.
- Transaksi: kategori dan user valid, nominal > 0, tipe hanya `income` atau `expense`.
- Kategori: nama tidak boleh kosong, tipe hanya `income` atau `expense`.
- Budget: wajib kategori, bulan, dan tahun; nominal > 0.
- Savings goal: target > 0, jumlah saat ini tidak melebihi target, deadline opsional.

---

## 12. Rencana API (REST)

| Resource | Endpoint |
| --- | --- |
| Profile | GET, PUT `/profile` |
| Transactions | GET `/transactions`, GET `/transactions/:id`, POST, PUT, PATCH, DELETE `/transactions/:id` |
| Categories | GET, POST `/categories`; PUT, DELETE `/categories/:id` |
| Budgets | GET, POST `/budgets`; PUT, DELETE `/budgets/:id` |
| Savings Goals | GET, POST `/savingsGoals`; PUT, DELETE `/savingsGoals/:id` |
| Settings | GET, PUT `/settings` |

**Penanganan error:** 404 (data tidak ditemukan), 400 (request tidak valid), gagal simpan/hapus, dan koneksi API gagal. Semua error diteruskan ke frontend dan ditampilkan sebagai toast.

---

## 13. Roadmap dan Milestone

| Fase | Pekerjaan | Status |
| --- | --- | --- |
| 1–2 | Planning dan UI/UX design (design system, responsive, sitemap) | ✅ |
| 3 | Setup React + Tailwind + TailGrids | ✅ |
| 4 | Layout (Sidebar, Navbar, Mobile Nav) | ✅ |
| 5–11 | Dashboard, Transactions, Categories, Budget, Savings, Reports, Profile & Settings | ✅ (versi LocalStorage) |
| 12 | Integrasi API / Backend (JSON Server + Axios, service layer) | ⏳ |
| 13 | Testing dan Deployment | ⏳ |

**Prioritas pekerjaan berikutnya:**

1. Setup `backend/` (JSON Server, `db.json` dari `initialData.js`) dan service layer Axios.
2. Migrasi per modul dari LocalStorage ke API, mulai dari Transactions, lalu Categories, Budget, Savings, Profile, Settings.
3. Tambah loading (skeleton) dan error state untuk semua pemanggilan API.
4. Lengkapi fitur sisa V1: Financial Insight, validasi duplikat kategori, Export/Import data.
5. Testing manual lintas breakpoint dan lintas tema/bahasa/mata uang, lalu deployment.

---

## 14. Kriteria Penerimaan V1

- Seluruh modul (9 halaman) berfungsi dan membaca/menulis data melalui REST API.
- CRUD transaksi, kategori, budget, dan target tabungan berhasil, dengan toast sukses/gagal.
- Saldo, budget, laporan, dan dashboard selalu konsisten dengan data transaksi.
- Aplikasi lolos Responsive Checklist pada mobile, tablet, dan desktop.
- Dark/light mode, dua bahasa, dan tiga mata uang berfungsi tanpa reload.
- Fitur Reset Data tidak tampil pada build production.
- Tidak ada error kritis pada pengujian manual alur inti.

---

## 15. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Data LocalStorage tidak dibawa ke API | Data uji hilang saat migrasi | Buat skrip seed dari `initialData.js` dan fitur Restore dari backup |
| JSON Server tidak memiliki validasi dan autentikasi nyata | Data tidak aman, password plain text | Batasi pemakaian ke tahap belajar; rencanakan Express + hashing + JWT |
| Kurs API eksternal gagal atau dibatasi | Konversi tidak akurat | Cache 1 jam dan fallback rate (sudah ada) |
| Avatar base64 membengkakkan penyimpanan | Performa turun, batas storage | Simpan sebagai file/URL pada backend |
| Konversi mata uang memengaruhi data tersimpan | Angka tidak konsisten | Simpan selalu dalam IDR, konversi hanya di tampilan |
| Kategori yang dihapus masih dipakai transaksi/budget | Data yatim | Tentukan aturan hapus (blokir atau alihkan ke "Other") |

---

## 16. Perbedaan Antar Dokumen Sumber yang Perlu Diputuskan

Saat menyusun PRD ini ditemukan beberapa ketidaksesuaian antara catatan planning dan kondisi implementasi. PRD ini mengambil posisi berikut, silakan dikoreksi jika berbeda dari maksud tim:

| Topik | Perbedaan | Posisi dalam PRD |
| --- | --- | --- |
| Multi Currency dan Notifikasi | Planning awal menaruhnya di V2, tetapi sudah diimplementasikan | Dimasukkan ke V1 (3 mata uang dan notifikasi in-app); mata uang tambahan dan push tetap V2 |
| Penyimpanan data | Planning: JSON Server + Axios; implementasi saat ini: LocalStorage | LocalStorage = kondisi saat ini; JSON Server = target V1 |
| Arsitektur backend | Dokumen tech backend: hanya JSON Server; dokumen struktur project: Express + JSON Server | V1 memakai JSON Server saja; Express masuk jalur migrasi berikutnya |
| Nama collection | Dokumen backend: `profile`, `savingsGoals`, `settings`; dokumen database: `users`, `savings_goals` (tanpa settings) | Mengikuti dokumen database; `settings` perlu diputuskan apakah collection tersendiri atau bagian dari `users` |
| Warna primer | Design system: blue-600; deskripsi implementasi: indigo | Perlu dipilih satu dan disamakan |
| Navigasi mobile | Design system: drawer dengan hamburger; implementasi: bottom navigation tanpa hamburger | Mengikuti implementasi (bottom navigation) |
| Tema utama | Design system: dark theme sebagai default | Toggle dark/light tersedia; default mengikuti `prefers-color-scheme` |
| Toast | Planning: React Hot Toast; implementasi: komponen Toast kustom | Pilih salah satu agar konsisten |
| Field `spentAmount` pada Budget | Planning data menyertakannya; dokumen database menyatakan dihitung otomatis | Tidak disimpan, dihitung dari transaksi |
| Jumlah custom hook | Statistik menyebut 2, tetapi daftar menyebut 3 (useTranslation, useLocalStorage, useTheme) | Dianggap 3 hook |

---

## 17. Backlog V2 (Di Luar Lingkup V1)

- Wallet (Bank, Cash, E-Wallet) dan transfer antar wallet.
- Recurring transactions dan Bills Reminder.
- Multi currency lebih dari 3 mata uang.
- Export PDF dan Excel yang nyata.
- Notifikasi push.
- Sinkronisasi cloud.
- Dashboard analitik yang lebih mendalam.
- Backend dan database sungguhan (Express.js, MySQL/PostgreSQL, JWT).
- Collection baru: wallets, wallet\_transactions, recurring\_transactions, bill\_reminders, notifications, currencies, exchange\_rates, attachments, activity\_logs.

---

## 18. Pertanyaan Terbuka

1. Apakah V1 final akan dirilis dengan JSON Server saja, atau backend Express langsung dikerjakan?
2. Apakah Financial Insight tetap masuk V1? Jika ya, jenis insight apa (misalnya perbandingan pengeluaran vs bulan lalu, kategori terboros)?
3. Bagaimana aturan penghapusan kategori yang masih dipakai transaksi atau budget?
4. Apakah autentikasi V1 tetap akun demo tunggal, atau mendukung registrasi?
5. Apakah Export Excel/PDF dipindah penuh ke V2, atau cukup Export CSV sederhana di V1?
6. Target deployment dan platform hosting apa yang dipakai?
7. Apakah metrik keberhasilan pada bagian 3.3 sudah sesuai atau perlu diubah?
