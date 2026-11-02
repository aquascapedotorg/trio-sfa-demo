// Konten naratif dan diagram Mermaid per aplikasi.
// Sumber: pohon layer + label section pada file Figma (dibaca 2026-11-02).

export const apps = [
  {
    id: 'mofi',
    name: 'MOFI RO App',
    client: 'Moladin',
    figma: 'https://www.figma.com/design/Ph7agWYtY96YOHa2t9imGt/-MOFI--RO-App?node-id=355-80856',
    figmaScope: 'Halaman "RO App - 24 Juli 2023": Login Flow, Homepage, Daftar Pengajuan, Transaction Detail Page, Initial Data, Additional Data Flow, Performa',
    oneLiner: 'Aplikasi Relationship Officer untuk mengajukan, memantau, dan menuntaskan pembiayaan kendaraan (contoh produk: MoTunai) sampai dana cair.',
    users: [
      ['RO (Relationship Officer)', 'Pengguna utama. Membuat atau mereview pengajuan, melengkapi data, memantau status, konfirmasi BPKB.'],
      ['Customer', 'Mengonfirmasi pengajuan dan menandatangani perjanjian lewat tautan yang dikirim sistem.'],
      ['DT / Agen / Telesales', 'Sumber leads. Leads masuk ke RO sebagai "Pengajuan perlu direview".'],
      ['Tim kredit dan cabang', 'Credit Analyst, Surveyor, Branch Manager. Menganalisis, memutus, dan memverifikasi akhir.'],
    ],
    modules: [
      ['Login', 'Nomor HP + OTP 4 digit, kirim ulang setelah 30 detik, status kedaluwarsa, akun diblokir, nomor tidak ditemukan.'],
      ['Homepage', 'Total nilai Go Live bulan ini dan perbandingan bulan lalu, tugas mendesak (perlu review, menunggu customer, butuh data tambahan), tombol Buat Pengajuan.'],
      ['Buat / Review Pengajuan', '4 langkah: sumber dan SKU kendaraan, pilih paket dan provisi, data customer dan pasangan, review lalu kirim.'],
      ['Daftar Pengajuan', '3 tab: Perlu Tindakan, Dalam Proses, Selesai. Filter status dan produk.'],
      ['Detail Transaksi', 'Stepper status, ringkasan pengajuan (pokok utang, pencairan, tenor, cicilan), kontak, jaminan, salin data.'],
      ['Data Tambahan', 'Kelompok data: status tempat tinggal, pendidikan dan pekerjaan, kontak darurat, pasangan, STNK, BPKB, rekening pencairan.'],
      ['Performa', 'Ringkasan capaian RO.'],
    ],
    value: [
      'RO tahu pengajuan mana yang butuh tindakan hari ini tanpa menelepon cabang.',
      'Status pengajuan transparan dari kirim sampai Go Live, termasuk alasan batal dan tolak.',
      'Data tambahan dikumpulkan bertahap, hanya saat analis kredit memintanya.',
    ],
    flowchart: `flowchart TD
  A(["Buka aplikasi"]) --> B["Input nomor HP"]
  B --> C{"Nomor terdaftar dan aktif?"}
  C -- "Tidak / diblokir" --> C1["Pesan: akun tidak ditemukan atau diblokir"] --> B
  C -- Ya --> D["Input OTP"]
  D --> E{"OTP valid?"}
  E -- Salah --> D
  E -- Kedaluwarsa --> E1["Kirim ulang OTP setelah 30 detik"] --> D
  E -- Benar --> H["Homepage: Go Live bulan ini, tugas mendesak"]
  H --> I{"Aksi RO"}
  I -- "Pengajuan perlu direview" --> J["Review leads dari DT atau Agen"]
  I -- "Buat pengajuan" --> K["Step 1: sumber Telesales/Agen, nama, no HP, SKU kendaraan"]
  K --> K1{"SKU ditemukan?"}
  K1 -- Tidak --> K2["Pilih kendaraan manual"] --> L
  K1 -- Ya --> L["Step 2: pilih paket, atur provisi"]
  J --> L
  L --> M["Step 3: data customer, alamat, pekerjaan, pasangan jika menikah"]
  M --> N["Step 4: review ringkasan, centang persetujuan, kirim"]
  N --> P["Menunggu konfirmasi customer"]
  P --> Q{"Respons customer"}
  Q -- "Waktu habis" --> Q1["Kirim ulang atau ganti nomor HP"] --> P
  Q -- Menolak --> X1(["Dibatalkan"])
  Q -- Setuju --> R["Pengecekan identitas"]
  R --> S["Analisis kredit oleh CA"]
  S --> T{"Hasil analisis"}
  T -- "Data kurang" --> T1["RO lengkapi data tambahan"] --> S
  T -- Deviasi --> T2["Pengajuan deviasi"] --> U
  T -- Ditolak --> X2(["Ditolak"])
  T -- Disetujui --> U["Pengesahan perjanjian oleh customer"]
  U --> U1{"Ditandatangani sebelum batas waktu?"}
  U1 -- Tidak --> U2["Kirim ulang perjanjian"] --> U
  U1 -- Ya --> V["Verifikasi akhir"]
  V --> W{"Take over?"}
  W -- Ya --> W1["Tunggu dokumen take over dari BM"] --> W2["RO konfirmasi BPKB diserahkan ke cabang"] --> Y
  W -- Tidak --> W3["Pengecekan akhir sebelum Go Live"] --> Y
  Y["Go Live: pencairan dana"] --> Z(["Selesai, kontrak bisa diunduh"])`,
    state: `flowchart TB
  S0((start)) -- "leads dari DT" --> PR["Perlu Review"]
  S0 -- "RO kirim pengajuan" --> MK["Menunggu Konfirmasi Customer"]
  PR --> MK
  subgraph PA["Proses Analisis"]
    PI["Pengecekan Identitas"] --> AK["Analisis Kredit"]
    AK --> PD["Perlu Dilengkapi"]
    PD --> AK
    AK --> DV["Pengajuan Deviasi"]
    DV --> OK["Pengajuan Disetujui"]
    AK --> OK
  end
  MK -- "customer setuju" --> PI
  MK -- "customer menolak" --> BT["Dibatalkan"]
  AK -- "tidak layak" --> TL["Ditolak"]
  OK --> PP["Pengesahan Perjanjian"] --> VA["Verifikasi Akhir"] --> GL["Go Live"] --> E1((end))
  BT --> E2((end))
  TL --> E3((end))`,
    stateNote: 'Pengelompokan tab di Daftar Pengajuan. Perlu Tindakan: Perlu Review, Menunggu Konfirmasi Customer, Perlu Dilengkapi, Pengesahan Perjanjian. Dalam Proses: Pengecekan Identitas, Analisis Kredit, Pengajuan Disetujui, Proses Verifikasi. Selesai: Go Live, Dibatalkan, Ditolak.',
    sitemap: `flowchart LR
  APP["MOFI RO App"] --> L["Login"]
  L --> L1["Nomor HP"] & L2["OTP"] & L3["Error: diblokir, tidak ditemukan"]
  APP --> H["Homepage"]
  H --> H1["Performa Go Live"] & H2["Tugas mendesak"] & H3["Profil"] & H4["Tombol Buat Pengajuan"]
  APP --> D["Daftar Pengajuan"]
  D --> D1["Perlu Tindakan"] & D2["Dalam Proses"] & D3["Selesai"]
  APP --> B["Buat / Review Pengajuan"]
  B --> B1["Step 1 Sumber dan SKU"] & B2["Step 2 Paket"] & B3["Step 3 Data customer"] & B4["Step 4 Review dan kirim"]
  APP --> T["Detail Transaksi"]
  T --> T1["Status dan stepper"] & T2["Ringkasan pengajuan"] & T3["Kirim ulang consent"] & T4["Batalkan pengajuan"] & T5["Unduh kontrak"]
  APP --> A["Data Tambahan"]
  A --> A1["Tempat tinggal"] & A2["Pekerjaan"] & A3["Kontak darurat"] & A4["Pasangan"] & A5["STNK dan BPKB"] & A6["Rekening pencairan"]
  APP --> P["Performa"]`,
    demo: [
      ['Login', 'Masuk dengan nomor HP dan OTP. Tunjukkan kirim ulang OTP dan pesan nomor tidak ditemukan.', 'Tanpa password. RO di lapangan cukup pakai nomor HP kantor.'],
      ['Homepage', 'Nilai Go Live bulan ini, perbandingan bulan lalu, tiga kartu tugas mendesak.', 'RO langsung tahu prioritas hari ini.'],
      ['Review pengajuan dari DT', 'Buka kartu "Pengajuan perlu direview", cek data leads, lanjut ke paket.', 'Leads digital tidak tercecer, ada pemilik yang jelas.'],
      ['Buat pengajuan sendiri', 'Step 1 sampai 4: SKU kendaraan, paket dan provisi, data customer, review lalu kirim.', 'Satu alur terpandu, validasi di tiap langkah.'],
      ['Menunggu konfirmasi customer', 'Timer, kirim ulang, ganti nomor HP.', 'Customer menyetujui sendiri, jejak persetujuan tercatat.'],
      ['Data tambahan', 'Lengkapi grup data yang diminta analis: STNK, BPKB, pasangan, rekening.', 'Data diminta hanya saat perlu, beban input awal ringan.'],
      ['Detail status sampai Go Live', 'Stepper status, verifikasi akhir, konfirmasi BPKB untuk take over, unduh kontrak.', 'Transparansi sampai dana cair, satu layar untuk semua pihak.'],
    ],
    questions: [
      'Apakah ada SLA (batas waktu) baku untuk konfirmasi customer dan tanda tangan perjanjian? Wireframe menampilkan timer tanpa angka.',
      'Siapa yang memutus deviasi, CA atau BM? Wireframe hanya menampilkan layar "Pengajuan Deviasi".',
      'Leads dari Non-RO (halaman terpisah di Transaction Detail) mengikuti alur yang sama atau ada perbedaan hak akses?',
    ],
  },
  {
    id: 'sfa',
    name: 'SFA (SOFIA / Sales Force App)',
    client: 'NNA',
    figma: 'https://www.figma.com/design/rYhDDGHUwaJRwM9tH7KVGP/NNA---SFA?node-id=6978-28164',
    figmaScope: 'Halaman "User Story 1" (US 001-025 alur kunjungan), "User Story 3" (US 001-007 istirahat, luar rute, sisa stok), "User Story 4" (US 001-026 menu, kas, stok, laporan, sync)',
    oneLiner: 'Aplikasi sales lapangan (canvasser / taking order) untuk kunjungan pelanggan WS dan RRO: check in, stok, retur, penagihan, penjualan, cetak faktur, lalu sync ke DMS.',
    users: [
      ['Sales', 'Pengguna utama. Menjalankan rute kunjungan, bertransaksi di outlet, mengelola stok kendaraan dan kas.'],
      ['Pelanggan WS / RRO', 'Wholesaler dan retail outlet. Membayar, menerima faktur, tanda tangan.'],
      ['Sales lain', 'Pihak mutasi stok antar sales (beri, terima, konfirmasi).'],
      ['DMS', 'Distributor Management System. Sumber master data dan tujuan sync transaksi.'],
    ],
    modules: [
      ['Berita harian dan dashboard', 'Call plan, hit rate, pencapaian target, AR, efektif call, penjualan per produk.'],
      ['Persiapan', 'Cek rute dan stok sebelum berangkat.'],
      ['Kunjungan', 'Pelanggan dalam rute dan luar rute, petunjuk arah Google Maps, check in dan check out, istirahat.'],
      ['Di outlet', 'Info pelanggan, sisa stok (gudang WS, BNS, RRO), price list, retur, penagihan, penjualan, biaya promosi, POSM.'],
      ['Penagihan', 'Tunai, transfer dengan foto bukti, giro, lunas atau kurang, reschedule jika gagal bayar.'],
      ['Penjualan', 'Input produk dan jumlah, jenis bayar tunai, transfer, kredit penuh atau sebagian, cetak dan lihat faktur, tanda tangan.'],
      ['Manajemen stok', 'Mutasi stok antar sales, cetak bukti mutasi, pergerakan stok.'],
      ['Manajemen kas', 'Biaya operasional: BBM, ATK, bongkar muat, tiket, hotel, parkir, pemeliharaan kendaraan, biaya bank.'],
      ['Laporan', 'Faktur, summary penjualan, penagihan, retur, status kunjungan, cetak BKB.'],
      ['Akhiri perjalanan', 'Kembalikan stok, akhiri kegiatan, sync ke DMS, request transaksi ke DMS.'],
    ],
    value: [
      'Kunjungan terbukti: lokasi dan waktu check in dan check out tersimpan.',
      'Satu kunjungan menuntaskan stok, retur, tagihan, dan order sekaligus.',
      'Akhir hari langsung rekonsiliasi: stok kembali, kas tercatat, transaksi masuk DMS.',
    ],
    flowchart: `flowchart TD
  A(["Mulai hari"]) --> B["Login"] --> C["Sync data dari DMS"] --> D["Berita harian"] --> E["Dashboard: call plan, hit rate, target"]
  E --> F["Persiapan: cek rute dan stok"]
  F --> G{"Pelanggan dalam rute?"}
  G -- Ya --> G1["Pilih dari call plan"] --> G2["Petunjuk arah Google Maps"] --> K
  G -- Tidak --> H{"Pelanggan sudah terdaftar?"}
  H -- Ya --> K
  H -- Tidak --> H1["Daftarkan RRO baru dan ambil foto"] --> K
  K["Check in: lokasi dan waktu"] --> L["Info pelanggan dan input sisa stok"]
  L --> N{"Ada retur?"}
  N -- Ya --> N1["Input retur beli dan submit"] --> O
  N -- Tidak --> O{"Ada tagihan?"}
  O -- Ya --> P{"Pelanggan bayar?"}
  P -- "Tunai / transfer / giro" --> P1["Catat bayar lunas atau kurang, foto bukti transfer"] --> Q
  P -- "Gagal bayar" --> P2["Reschedule tanggal penagihan"] --> Q
  O -- Tidak --> Q{"Ada order?"}
  Q -- Ya --> R["Input produk dan jumlah"] --> R1["Pilih bayar: tunai, transfer, kredit"] --> R2["Submit penjualan"] --> R3["Cetak faktur, tanda tangan pelanggan"] --> S
  Q -- Tidak --> S["Check out"]
  S --> T{"Berikutnya"}
  T -- "Pelanggan lain" --> G
  T -- Istirahat --> T1["Mulai lalu akhiri istirahat"] --> G
  T -- "Selesai rute" --> U["Input biaya operasional"]
  U --> V["Akhiri perjalanan: kembalikan stok, cetak BKB dan summary"]
  V --> W["Sync transaksi ke DMS"] --> Z(["Selesai"])`,
    state: `flowchart TB
  S0((start)) --> BK["Belum dikunjungi"]
  BK -- "tiba di lokasi" --> CI["Check in"]
  subgraph DO["Di outlet"]
    SS["Sisa stok"] --> RT["Retur"]
    SS --> PN["Penagihan"]
    SS --> PJ["Penjualan"]
    RT --> PN
    PN --> PJ
  end
  CI --> SS
  PJ -- "aplikasi ditutup" --> DR["Draft transaksi"]
  DR -- "re-login, lanjutkan" --> SS
  PJ -- "selesai di outlet" --> CO["Check out"]
  CO --> IS["Istirahat"] --> BK
  CO -- "semua rute selesai" --> E1((end))`,
    stateNote: 'Status "Draft" dan "lanjutkan transaksi saat re-login" berasal dari US-023 di halaman User Story 4. Urutan aktivitas di outlet bisa berbeda per pelanggan.',
    sitemap: `flowchart LR
  APP["SFA"] --> M["Main menu"]
  M --> P["Persiapan"]
  M --> K["Kunjungan"]
  K --> K1["Dalam rute"] & K2["Luar rute"] & K3["Check in dan check out"] & K4["Istirahat"]
  K3 --> O["Menu outlet"]
  O --> O1["Info pelanggan"] & O2["Sisa stok"] & O3["Price list"] & O4["Retur"] & O5["Penagihan"] & O6["Penjualan"] & O7["Biaya promosi"] & O8["POSM"]
  M --> S["Manajemen stok"]
  S --> S1["Mutasi beri"] & S2["Mutasi terima"] & S3["Bukti mutasi"] & S4["Pergerakan stok"]
  M --> C["Manajemen kas"]
  C --> C1["8 jenis biaya operasional"]
  M --> R["Laporan"]
  R --> R1["Faktur"] & R2["Summary penjualan"] & R3["Summary penagihan"] & R4["Summary retur"] & R5["Status kunjungan"] & R6["Cetak BKB"]
  M --> E["Akhiri perjalanan"]
  E --> E1["Kembali stok"] & E2["Akhiri kegiatan"] & E3["Sync ke DMS"]
  APP --> D["Dashboard dan berita harian"]`,
    demo: [
      ['Login dan sync', 'Login, sync data, berita harian tampil di carousel.', 'Sales selalu bekerja dengan harga dan stok terbaru.'],
      ['Dashboard', 'Call plan, hit rate, target, penjualan per produk.', 'Target harian terlihat sebelum berangkat.'],
      ['Kunjungan dalam rute', 'Pilih pelanggan, buka petunjuk arah, check in.', 'Kunjungan terbukti dengan lokasi dan jam.'],
      ['Luar rute', 'Check in pelanggan baru, daftarkan RRO dan foto.', 'Peluang di jalan tetap tercatat.'],
      ['Di outlet', 'Sisa stok, retur, penagihan tunai atau transfer, penjualan, cetak faktur.', 'Satu kunjungan, semua transaksi selesai.'],
      ['Check out dan akhir hari', 'Check out, input biaya operasional, kembalikan stok, sync ke DMS.', 'Rekonsiliasi harian tanpa input ulang di kantor.'],
    ],
    questions: [
      'Di Figma, halaman User Story 1 dan 2 berisi daftar US yang hampir sama. Mana yang berlaku untuk tahap ini?',
      'Apakah approval diperlukan untuk penjualan kredit atau reschedule tagihan? Wireframe tidak menampilkan layar persetujuan.',
      'Mutasi stok antar sales: apakah perlu supervisor, atau cukup konfirmasi sales penerima (US-022C)?',
    ],
  },
  {
    id: 'hebat',
    name: 'HeBAT',
    client: 'BAT',
    figma: 'https://www.figma.com/design/yqUEErlN4OfG6KhZMk9Sbm/HEBAT---PROTOTYPE?node-id=6101-42401',
    figmaScope: 'Halaman "Prototyping": Splash, Sign In dan Forgot Password, Home dengan dashboard, Absence, Route Display, Main Flow (Visit), komponen popup, fitur tambahan "Melanjutkan Aktivitas Visit"',
    oneLiner: 'Aplikasi field force untuk absensi, rute, dan kunjungan outlet: hitung stok, ambil order, edukasi, dan merchandising dengan foto.',
    users: [
      ['Field force', 'Pengguna utama. Absen, mengikuti rute, menjalankan aktivitas visit.'],
      ['Outlet', 'Toko yang dikunjungi. Menyetujui order dan pemasangan merchandise.'],
      ['Supervisor', 'Memantau status di dashboard (Ongoing, Pending, To Approve, Approved, Completed, Declined).'],
    ],
    modules: [
      ['Akun', 'Sign in, sign up, lupa password dengan kode email lalu buat password baru.'],
      ['Home', 'Dashboard grafik dan donut status, pengingat absen, pengeluaran bulan ini, menu bawah: Home, Visit, Absence, Route.'],
      ['Absence', 'Absen dengan sisa waktu dan tombol stop, riwayat dengan pagination, status ditolak atau berhasil.'],
      ['Route', 'Daftar rute per tanggal.'],
      ['Visit', 'Daftar outlet dengan progres (contoh 6/10), cari outlet, peta dan jarak, check in.'],
      ['Visit activity', 'Count stock, order capture, education, merchandise dengan unggah foto.'],
      ['Lanjutkan visit', 'Fitur tambahan untuk melanjutkan aktivitas visit yang terputus.'],
    ],
    value: [
      'Absensi dan kunjungan tercatat di satu aplikasi, mudah diaudit.',
      'Data stok dan order dari outlet masuk saat itu juga, bukan dari laporan mingguan.',
      'Foto merchandise menjadi bukti eksekusi program di toko.',
    ],
    flowchart: `flowchart TD
  A(["Buka HeBAT"]) --> B["Splash"] --> C{"Punya akun?"}
  C -- Belum --> C1["Sign up"] --> D
  C -- Ya --> D["Sign in: username dan password"]
  D --> D1{"Lupa password?"}
  D1 -- Ya --> D2["Masukkan email"] --> D3["Input kode dari email"] --> D4["Buat password baru"] --> D
  D1 -- Tidak --> E["Home: dashboard dan status"]
  E --> F{"Sudah absen?"}
  F -- Belum --> F1["Pengingat: absen sebelum mulai kerja"] --> G["Absen masuk"] --> H
  F -- Sudah --> H["Route: rute hari ini"]
  H --> I["Visit: daftar outlet dan progres"]
  I --> I1{"Ada visit terputus?"}
  I1 -- Tidak --> J["Cari dan pilih outlet"] --> K["Peta lokasi dan jarak"] --> K1["Check in"] --> L
  I1 -- Ya --> I2["Lanjutkan aktivitas visit"] --> L
  L["Visit activity"] --> L1["Count stock"] & L2["Order capture"] & L3["Education"] & L4["Merchandise dan foto"]
  L1 & L2 & L3 & L4 --> M["Selesaikan visit"]
  M --> N{"Validasi"}
  N -- "Peringatan atau galat" --> L
  N -- Sukses --> O["Progres outlet bertambah"]
  O --> P{"Masih ada outlet?"}
  P -- Ya --> J
  P -- Tidak --> Q["Absen pulang"] --> Z(["Selesai"])`,
    state: `flowchart LR
  S0((start)) -- "visit dimulai" --> ON["Ongoing"]
  ON -- "belum lengkap" --> PE["Pending"]
  PE -- "dilanjutkan" --> ON
  ON -- "diselesaikan" --> TA["To Approve"]
  TA -- "disetujui" --> AP["Approved"] --> CP["Completed"] --> E1((end))
  TA -- "ditolak" --> DC["Declined"] --> E2((end))`,
    stateNote: 'Enam status ini tampil di donut dashboard Home. Urutan transisi adalah asumsi dari nama status, belum ada layar yang menjelaskan siapa yang menyetujui.',
    sitemap: `flowchart LR
  APP["HeBAT"] --> A["Akun"]
  A --> A1["Sign in"] & A2["Sign up"] & A3["Lupa password"]
  APP --> H["Home"]
  H --> H1["Dashboard grafik"] & H2["Donut status"] & H3["Pengingat absen"]
  APP --> AB["Absence"]
  AB --> AB1["Absen"] & AB2["Riwayat"]
  APP --> R["Route"]
  APP --> V["Visit"]
  V --> V1["Daftar outlet"] & V2["Peta dan check in"] & V3["Visit activity"] & V4["Lanjutkan visit"]
  V3 --> X1["Count stock"] & X2["Order capture"] & X3["Education"] & X4["Merchandise"]`,
    demo: [
      ['Sign in', 'Masuk, tunjukkan lupa password dengan kode email.', 'Akun pribadi per field force.'],
      ['Home', 'Dashboard, donut status, pengingat absen.', 'Supervisor dan field force melihat angka yang sama.'],
      ['Absence', 'Absen masuk, riwayat, status ditolak.', 'Kehadiran terverifikasi sebelum kunjungan.'],
      ['Route dan Visit', 'Rute hari ini, daftar outlet 6/10, peta dan jarak, check in.', 'Progres harian terlihat per outlet.'],
      ['Visit activity', 'Count stock, order capture, education, merchandise dengan foto.', 'Data toko dan bukti eksekusi masuk real time.'],
      ['Lanjutkan visit', 'Buka visit yang terputus.', 'Sinyal hilang atau aplikasi tertutup tidak membuat data hilang.'],
    ],
    questions: [
      'Siapa yang mengubah status To Approve menjadi Approved atau Declined, dan apakah itu untuk visit, absensi, atau pengeluaran?',
      'Sign up dibuka untuk umum atau akun dibuat admin? Untuk aplikasi internal biasanya admin.',
      'Banyak frame berstatus "On progress". Apakah prototipe ini sudah final?',
    ],
  },
];

export const compare = {
  head: ['Aspek', 'MOFI RO App', 'SFA', 'HeBAT'],
  rows: [
    ['Domain', 'Pembiayaan kendaraan', 'Distribusi dan penjualan (canvassing)', 'Trade marketing outlet'],
    ['Pengguna utama', 'Relationship Officer', 'Sales lapangan', 'Field force'],
    ['Pemicu proses', 'Leads atau calon customer', 'Rute harian (call plan)', 'Rute harian dan absensi'],
    ['Objek utama', 'Pengajuan pembiayaan', 'Kunjungan dan transaksi pelanggan', 'Visit outlet'],
    ['Titik kontrol', 'Konfirmasi customer, analisis kredit, verifikasi akhir', 'Check in dan check out, sync DMS', 'Absensi, check in, status approval'],
    ['Bukti lapangan', 'Persetujuan digital, BPKB', 'Lokasi dan waktu, faktur, tanda tangan, foto transfer', 'Lokasi, foto merchandise'],
    ['Angka di beranda', 'Nilai Go Live bulan ini', 'Call plan, hit rate, target', 'Grafik dan donut status'],
    ['Lama satu siklus', 'Hari sampai minggu', 'Satu hari kerja', 'Satu hari kerja'],
  ],
  pattern: 'SFA dan HeBAT berbagi pola yang sama: absen atau login, rute, check in, aktivitas di outlet, check out, rekap akhir hari. MOFI berbeda: satu pengajuan berjalan berhari-hari melewati beberapa pihak, sehingga fokus aplikasinya pada pemantauan status dan tindakan yang tertunda.',
};
