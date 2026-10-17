# Verifikasi

Pemeriksaan pada 17 Oktober 2026 menggunakan Node.js 24.19.0, npm 11.9.0,
Playwright 1.64.1, dan Chromium 133.0.6943.0. Pengujian menggunakan build
produksi Vite, bukan komponen yang di-mock.

## Pemeriksaan sumber dan data

- TypeScript strict: lulus tanpa error.
- 17 unit test domain, adapter storage, dan Pinia store: lulus.
- Pemeriksaan 35 file sumber: CSS terpisah dan SFC valid.
- Prettier: lulus dengan target 80 kolom dan atribut per baris.
- Build produksi: lulus. CSS dan JavaScript menghasilkan aset terpisah.
- npm audit: 0 advisory yang dilaporkan pada dependency terpasang ketika
  diperiksa. Hasil ini mengikuti basis data audit pada tanggal pemeriksaan.

Unit test memeriksa kalender lokal dan tahun kabisat, perhitungan metrik,
perubahan immutable, versi entity yang sudah berubah, waktu penyelesaian tugas,
relasi proyek aktif, filter gabungan, arsip, cascade penghapusan, pemulihan
snapshot, serta whitespace catatan. Backup menguji roundtrip, identitas
duplikat, relasi putus, versi asing, dan batas ukuran.

Storage diuji dalam keadaan kosong, valid, rusak, tidak tersedia, kuota gagal,
konflik antartab, serta percobaan simpan ulang. Data yang tidak dapat dibaca
tidak otomatis diganti dengan contoh.

## 12 pengujian browser

Semua lulus:

1. Buat dan edit proyek, buat tugas, ubah status papan, reload, arsip, hapus
   cascade, lalu pulihkan.
2. Gabungan filter tugas pada URL, reload filter, selesaikan tugas, dan buka
   kembali tugas.
3. Pilih pekan agenda dan tambahkan tugas dengan tenggat hari yang dipilih.
4. Buat, edit, hapus, pulihkan catatan. Isi HTML ditampilkan sebagai teks.
5. Unduh backup JSON, batalkan reset, kosongkan ruang, reload ruang kosong, lalu
   impor dengan pratinjau sebelum penggantian.
6. Tolak JSON rusak dan versi schema asing tanpa mengubah data lama.
7. Dialog Escape, fokus kembali ke pemicu, dan menu navigasi HP lewat keyboard.
8. Pertahankan raw storage yang rusak, sediakan akses unduh mentah, dan tolak
   penulisan sebelum pemulihan eksplisit.
9. Dua tab nyata: perubahan di tab lain, penolakan simpan, draft tetap ada,
   kemudian muat perubahan secara eksplisit.
10. Simulasi kuota browser gagal, banner mode memori, dan tombol Coba simpan
    setelah storage tersedia kembali.
11. Ruang kosong, panduan membuat proyek sebelum tugas, serta halaman proyek
    yang tidak ditemukan.
12. Delapan rute pada lebar 320, 360, 768, dan 1440 piksel. Tidak ada overflow
    horizontal, satu h1 per rute, tombol terlihat memiliki teks atau label,
    tidak ada deklarasi style inline, tema gelap tersimpan, dan tidak ada
    response gagal atau error JavaScript yang diamati dalam alur ini.

Rute dalam matriks: beranda, daftar proyek, papan proyek, tugas, agenda,
catatan, pengaturan, dan halaman tidak ditemukan.

## Tinjauan visual

Screenshot ditinjau pada beranda dan papan desktop, daftar tugas HP 360 piksel,
dialog tugas HP 320 piksel, dan catatan dengan tema gelap. Sprite SVG produksi
menghasilkan ikon yang terlihat. Lebar konten dan dialog diperiksa. Dialog
panjang dapat digulir untuk mencapai aksi simpan pada layar pendek.

## Batas cakupan

Pengujian otomatis browser menggunakan Chromium. Firefox, Safari, perangkat
fisik, screen reader, dan seluruh kombinasi ekstensi browser belum diuji.
Pemeriksaan ini tidak menyatakan sertifikasi aksesibilitas penuh.

Persistensi bergantung pada browser dan origin. Aplikasi tidak menyediakan
backend, akun, enkripsi backup, atau kolaborasi waktu nyata. Pengujian tidak
mencakup layanan yang tidak tersedia tersebut.

## Menjalankan ulang

```sh
npm ci
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Untuk browser Chromium lokal khusus, Playwright menerima environment variable
`PLAYWRIGHT_EXECUTABLE_PATH`. Argumen tambahan opsional dapat diberikan sebagai
array JSON melalui `PLAYWRIGHT_CHROMIUM_ARGS`. Instalasi biasa cukup memakai
Chromium dari perintah Playwright di atas.
