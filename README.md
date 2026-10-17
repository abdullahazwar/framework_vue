# Ruang Kerja

Aplikasi Vue untuk mengelola proyek, tugas, agenda, dan catatan pribadi.
Antarmuka berbahasa Indonesia, responsif, dan memiliki tampilan terang, gelap,
serta mengikuti perangkat. Data disimpan pada browser yang digunakan.

Repository ini berisi aplikasi mandiri. Dependency, build, pengujian, dan
dokumentasi tersedia pada root proyek.

## Jalankan

Gunakan Node.js 24+ dan npm 11+.

```sh
git clone https://github.com/abdullahazwar/framework_vue.git
cd framework_vue
npm ci
npm run dev
```

Buka alamat lokal yang ditampilkan Vite. Untuk build produksi:

```sh
npm run build
npm run preview
```

Unggah isi `dist/` ke hosting statis untuk menerbitkan aplikasi. Vite memakai
base relatif dan router memakai hash, sehingga aplikasi dapat dipasang pada
subfolder tanpa aturan rewrite rute SPA. Sumber harus dijalankan melalui Vite;
bukan dengan membuka `index.html` langsung sebagai file lokal.

## Yang dapat dilakukan

- Membuat dan mengedit proyek berdasarkan kategori, tenggat, dan penanda.
- Mengelola tugas melalui daftar atau papan tiga status. Setiap tugas memiliki
  proyek, prioritas, detail, dan tenggat opsional.
- Mencari serta menggabungkan filter proyek, status, prioritas, dan tenggat.
  Filter daftar disimpan di URL dan bertahan setelah reload.
- Meninjau agenda mingguan dan menambahkan tugas pada hari tertentu.
- Menulis catatan teks biasa, umum atau terhubung dengan proyek.
- Mengarsipkan proyek untuk mengeluarkan tugasnya dari pekerjaan aktif. Tugas
  arsip dapat dibaca dan dapat diedit setelah proyek dibuka kembali.
- Menghapus data dengan konfirmasi. Penghapusan proyek menyertakan tugas dan
  catatan terkait. Tombol Pulihkan tersedia sampai perubahan data berikutnya
  atau tab ditutup.
- Mengunduh backup JSON, meninjau backup sebelum impor, dan memulai ruang kosong
  melalui konfirmasi tersendiri.

Pemakaian pertama menampilkan **3 proyek, 12 tugas, dan 2 catatan contoh**.
Label dan isi menyatakan bahwa data tersebut contoh. Ruang yang sengaja
dikosongkan tetap kosong saat dibuka kembali.

## Stack dan pemisahan kode

Vue 3 Composition API, TypeScript, Vue Router, Pinia, dan Vite. Versi dependency
dipatok melalui `package.json` serta `package-lock.json`.

Komponen `.vue` hanya berisi template dan logika TypeScript. Seluruh warna,
layout, ukuran, responsivitas, dan state visual berada dalam `src/styles/`.
`index.html` memuat CSS melalui `<link>` dan entry TypeScript melalui
`<script src>`. Build Vite menghasilkan aset CSS dan JavaScript terpisah.

Tidak ada blok style pada SFC, binding style, CSS-in-JS, atau manipulasi style
melalui JavaScript. Class dan atribut data menyampaikan state ke CSS. Ikon
memakai sprite SVG lokal; font memakai font sistem tanpa permintaan CDN.

```text
src/
  app/             shell, navigasi, router
  components/      dialog, ikon, judul, state kosong
  composables/     tanggal bersama, URL filter, unduh file
  domain/          tipe, validasi, aturan data, selector, backup
  features/
    projects/      kartu dan editor proyek
    tasks/         baris, kartu, dan editor tugas
    notes/         editor catatan
    workspace/     store, adapter storage, pengelola dialog
  styles/          token, dasar, layout, dan CSS per fitur
  views/           halaman rute
  assets/          sprite ikon orisinal
tests/
  domain.test.ts
  storage.test.ts
  e2e/
scripts/
  check-presentation.mjs
docs/
  DESIGN.md
  ARCHITECTURE.md
  VERIFICATION.md
```

## Data dan batas aplikasi

Aplikasi tidak memiliki backend, autentikasi, atau sinkronisasi akun. Data
berada di `localStorage` pada origin browser saat ini. Mengganti protokol,
domain, port, profil browser, atau perangkat menghasilkan ruang penyimpanan yang
berbeda. Backup JSON memindahkan data antar ruang tersebut.

Backup mencakup seluruh proyek, tugas, catatan, dan pengaturan. File berformat
teks biasa. Isi yang diimpor divalidasi sebelum ditampilkan untuk persetujuan
penggantian data; impor mengganti seluruh ruang, bukan menggabungkan data. Versi
format saat ini adalah 1.

Maksimal 200 proyek, 10.000 tugas, dan 2.000 catatan, dengan ukuran data
ternormalisasi maksimal 2 MB. File impor maksimal 5 MB. Kuota browser dapat
lebih kecil; bila penulisan gagal, perubahan tetap berada di memori tab dan
banner menyediakan percobaan simpan serta akses backup. Jangan menutup tab
sebelum menyimpan atau mengunduh perubahan yang masih berada di memori.

Data lokal rusak tidak otomatis ditimpa. Pengaturan menyediakan unduhan salinan
mentah. Perubahan tab lain memunculkan konflik dan harus dimuat sebelum menulis
kembali. Pemeriksaan ini membantu penggunaan beberapa tab, tetapi bukan sistem
kolaborasi waktu nyata dengan transaksi lintas tab.

Tenggat memakai tanggal kalender perangkat, tanpa konversi UTC. Nilai yang
didukung antara 1900 dan 2199. Draft form disimpan saat menekan tombol simpan;
Batal, Escape, atau menutup tab membuang draft yang belum disimpan.

## Pemeriksaan

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

`check` menjalankan TypeScript, unit test domain dan penyimpanan, pemeriksaan
pemisahan CSS, serta Prettier. E2E membangun versi produksi lalu mengujinya
melalui Playwright. Browser Chromium hanya diperlukan untuk E2E.

```sh
npm run format
npm run format:check
```

Format menggunakan indentasi dua spasi, target 80 kolom, dan atribut per baris.
Nilai URL serta literal tertentu dapat melampaui target. Hasil build,
dependency, laporan browser, dan data pengguna tidak disertakan dalam Git.

[Brief desain](docs/DESIGN.md), [arsitektur](docs/ARCHITECTURE.md), dan
[cakupan verifikasi](docs/VERIFICATION.md).

## Lisensi dan referensi

Kode aplikasi serta ikon dibuat untuk proyek ini dan memakai [MIT](LICENSE).
Dependency mempertahankan lisensi masing-masing di paket instalasinya.

- [Vue: panduan TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [Pinia: setup store](https://pinia.vuejs.org/core-concepts/)
- [Vue Router: history modes](https://router.vuejs.org/guide/essentials/history-mode.html)
- [Vite: panduan build](https://vite.dev/guide/build.html)
- [Playwright: pengujian](https://playwright.dev/docs/intro)
