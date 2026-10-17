# Ruang Kerja Vue

Repository ini berisi aplikasi Ruang Kerja berbasis Vue. Gunakan bahasa
Indonesia untuk teks antarmuka dan dokumentasi pengguna.

- Pertahankan struktur fitur, domain murni, adapter penyimpanan, dan komponen.
- SFC Vue menyimpan template serta logika TypeScript. Seluruh desain berada pada
  file CSS di src/styles. Jangan menambah blok style, atribut style, binding
  :style, CSS-in-JS, atau manipulasi .style.
- CSS dimuat melalui link pada index.html. Ikon memakai sprite SVG lokal.
- Jangan memakai v-html untuk isi catatan atau impor data.
- Semua perubahan data harus melalui store dan fungsi domain. Validasi impor
  sebelum mengganti data. Jangan menimpa data lokal yang gagal dibaca.
- Proyek pribadi ini tidak memiliki backend atau sinkronisasi akun. Jangan
  menampilkan keberhasilan login, pengiriman, atau sinkronisasi yang tidak ada.
- Jalankan npm run check dan npm run build dari folder aplikasi. Jalankan npm
  run test:e2e ketika mengubah alur pengguna. Tinjau HP dan desktop.
- Dokumentasikan batas penyimpanan lokal serta perubahan skema cadangan.
- Jangan commit data pengguna, hasil build, dependensi, atau kredensial.
