# Brief Ruang Kerja

## Pengguna dan tujuan

Untuk pelajar, pekerja mandiri, dan pengguna yang ingin memecah beberapa proyek
pribadi menjadi tindakan yang jelas. Alur utama: buka beranda, pilih proyek,
tambahkan tugas, lalu tandai kemajuannya. Agenda membantu meninjau tenggat.
Catatan menyimpan konteks tanpa mengubahnya menjadi tugas.

Produk berupa aplikasi pribadi dengan data pada perangkat. Tidak menampilkan
anggota tim, aktivitas sinkronisasi, notifikasi server, atau angka bisnis yang
tidak memiliki sumber data.

## Arah visual

Ruang kerja tenang dengan latar putih kehijauan, hijau hutan, dan garis tipis.
Navigasi berada di kiri pada desktop. Judul besar, angka ringkas, dan daftar
tugas memberikan hierarki. Beranda menampilkan pekerjaan yang membutuhkan
perhatian sebelum catatan terbaru. Halaman tugas mengutamakan kepadatan yang
mudah dibaca; papan proyek menyusun pekerjaan berdasarkan tiga status.

Tema proyek memiliki empat penanda yang dipetakan sepenuhnya di CSS. Status dan
prioritas selalu memiliki teks, sehingga makna tidak hanya melalui warna. Tema
gelap memakai token semantik yang sama. Tidak ada dependency dekorasi, foto
eksternal, gradien berlebihan, atau font yang harus diunduh.

## Responsif dan akses

Pada layar kecil, navigasi berubah menjadi empat tautan bawah dan menu tambahan
untuk seluruh rute. Papan menjadi satu kolom, filter ditumpuk, dan catatan
menjadi daftar di atas pembaca. Tidak mengandalkan drag-and-drop: perubahan
status menggunakan select native yang dapat dipakai dengan keyboard.

Setiap rute mempunyai satu h1, main landmark, dan navigasi berlabel. Tautan
lewati konten mengarahkan fokus tanpa mengubah hash router. Dialog native
menahan fokus, mendukung Escape, serta mengembalikan fokus ke pemicu yang masih
tersedia. Form menggunakan label, batas karakter, validasi native, dan pesan
kesalahan. Tidak ada animasi yang wajib untuk memahami alur.

## State dan integritas

Halaman membedakan data kosong dengan pencarian tanpa hasil. Proyek yang tidak
ditemukan dan rute asing memiliki arah kembali. Dialog hapus menjelaskan data
terkait dan pemulihan. Impor menampilkan ringkasan sebelum mengganti ruang.
Kesalahan storage ditampilkan sebagai banner dan tidak menampilkan keberhasilan
sinkronisasi yang tidak tersedia.

Data contoh dijelaskan pada kartu proyek serta isi tugas dan catatan. Setiap
angka ringkasan, progres, dan jumlah hasil dihitung dari store aktif yang sama.
