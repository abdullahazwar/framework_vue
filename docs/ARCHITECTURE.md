# Arsitektur

## Batas tanggung jawab

`app/` memasang Pinia serta router, menyusun shell, dan menangani event storage
browser. Rute dimuat terpisah melalui lazy import. Hash router memungkinkan
hosting statis pada subfolder.

`views/` menyusun halaman dari komponen fitur. Komponen editor menampung draft
terpisah dari data tersimpan. Dialog dikelola oleh overlay store, sehingga hanya
satu editor atau konfirmasi penghapusan yang aktif.

`domain/` berisi fungsi murni yang menerima workspace dan mengembalikan data
baru. Lapisan ini tidak bergantung pada Vue, DOM, atau storage. Selector
digunakan bersama untuk ringkasan, daftar, agenda, dan progres proyek.

`features/workspace/store.ts` mengoordinasikan validasi, perubahan domain,
persistensi, dan snapshot pemulihan penghapusan. Semua penyimpanan harus melalui
store. Adapter `repository.ts` menyediakan antarmuka kecil agar storage dapat
diganti atau diuji tanpa browser.

`styles/` memiliki token semantik, dasar elemen, shell, komponen bersama, dan
file fitur. CSS dimuat dari link pada HTML. Nilai status atau nama tema pada
TypeScript hanya data; seluruh pemetaan visual berada dalam CSS.

## Alur perubahan data

1. Editor membuat salinan field untuk draft lokal.
2. Submit mengirim input dan versi entity awal ke store.
3. Fungsi domain memeriksa relasi proyek, arsip, batas isi, dan versi entity.
4. Validator memeriksa workspace hasil sebelum penulisan.
5. Adapter membandingkan raw storage dengan nilai yang terakhir dibaca.
6. Bila tidak konflik, data ditulis, state store diganti, dan UI diperbarui.
   Bila kuota tidak tersedia, UI beralih ke mode memori dengan banner.

Penulisan yang terblokir oleh data rusak atau konflik tidak mengganti state
store. Draft editor tetap ada ketika penyimpanan ditolak. Perubahan dari tab
lain tidak secara otomatis mengganti data yang sedang ditinjau pengguna.

Perbandingan raw storage bukan transaksi atomik antartab. Untuk kolaborasi
bersamaan diperlukan repository backend dengan versi server atau database yang
mendukung transaksi.

## Model

- Project: kategori, penanda, tenggat opsional, status arsip, label contoh.
- Task: relasi proyek wajib, status, prioritas, tenggat dan waktu selesai.
- Note: relasi proyek opsional dan teks biasa yang mempertahankan whitespace.
- Workspace: schemaVersion, revision, savedAt, koleksi, dan preferensi.

Status selesai memiliki `completedAt`; membuka tugas kembali mengosongkannya.
Mengedit tugas yang sudah selesai mempertahankan waktu selesai awal. Arsip
mengeluarkan tugas dari metrik aktif tanpa menghapus data. Penghapusan proyek
menghapus tugas dan catatan terkait, sementara catatan umum tetap tersedia.

## Backup versi 1

Envelope JSON memiliki `application: "ruang-kerja"`, `version: 1`, `exportedAt`,
dan `data` berisi workspace lengkap. Parser menerima unknown lalu membentuk
objek secara eksplisit. Field tambahan dibuang. Identitas duplikat, relasi
putus, tanggal tidak valid, nilai enum asing, serta ukuran berlebih ditolak.

Format mendatang harus menambahkan migrasi eksplisit dan pengujian sebelum
menerima versi baru. Jangan menaikkan versi tanpa dukungan migrasi. Jangan
memulihkan contoh atau mengosongkan storage secara otomatis ketika parser gagal
membaca data lama.

## Menambah fitur

Tambahkan aturan data di domain terlebih dahulu, lalu aksi store, komponen
fitur, halaman bila diperlukan, dan CSS pada file fitur. Tambahkan pengujian
yang mencakup aturan atau alur pengguna baru. Hindari membagi komponen kecil
yang hanya memindahkan markup tanpa batas tanggung jawab yang jelas.

Pengujian domain tidak memerlukan browser. Pengujian store memakai storage port
memori. E2E memakai build produksi dan browser. Seluruh perintah pemeriksaan
dijalankan dari root repository ini.
