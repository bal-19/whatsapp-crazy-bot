# New Features

Dokumen di folder ini berisi breakdown fitur baru yang cocok untuk arah bot WhatsApp AI yang fun, serbaguna, dan tetap selaras dengan arsitektur repo saat ini.

## Prinsip Kompatibilitas

Semua fitur baru di folder ini harus mengikuti fondasi yang sama agar tidak saling merusak:

- conversation scope menjadi sumber identitas utama untuk history, memory, audit, dan reply routing
- `contact_id` dipakai sebagai identity internal conversation scope, bukan selalu tujuan pengiriman WhatsApp
- tujuan kirim pesan harus dipisahkan dari identity penyimpanan conversation
- fitur multimodal tidak boleh bypass audit log
- fitur memory personal tidak boleh mengambil history lintas scope tanpa aturan yang jelas
- fitur image analysis harus mengikuti reply type abstraction yang sama dengan multimodal replies
- audit log harus mencatat metadata yang cukup untuk menjelaskan interaksi antar fitur

## Fondasi Bersama

Urutan fondasi yang disarankan agar implementasi aman:

1. `01-group-member-scoped-conversations.md`
2. `03-multimodal-replies.md`
3. `04-audit-log.md`
4. `02-personal-memory.md`
5. `05-image-meme-analysis.md`

Alasan urutan ini:

- group scoped conversations memastikan history dan memory tidak tercampur
- multimodal replies menyediakan abstraction payload balasan
- audit log membantu observability saat fitur lain mulai bercabang
- personal memory aman dibangun setelah scope identity jelas
- image analysis paling aman masuk setelah multimodal dan audit sudah siap

## Aturan Update

Setiap ada fitur baru yang dibahas atau direncanakan:

- buat dokumen `.md` baru di folder ini
- tambahkan fitur tersebut ke daftar di README ini
- beri status implementasi dengan salah satu nilai berikut:
  - `belum diimplementasi`
  - `sudah diimplementasi`

Jika status berubah, update README ini agar tetap menjadi sumber ringkas progres fitur.

## Status Fitur

Daftar fitur:

- `01-group-member-scoped-conversations.md`: conversation grup dipisah per member dalam grup
  Status: `belum diimplementasi`
- `02-personal-memory.md`: memory personal kecil-kecilan agar bot terasa lebih hidup
  Status: `belum diimplementasi`
- `03-multimodal-replies.md`: balasan multimodal berupa teks + gambar/media
  Status: `belum diimplementasi`
- `04-audit-log.md`: audit log untuk melacak alur keputusan, prompt, dan hasil balasan bot
  Status: `belum diimplementasi`
- `05-image-meme-analysis.md`: analisis gambar, meme, dan screenshot dari user
  Status: `belum diimplementasi`

Catatan:

- Fokus dokumen ini adalah fitur yang realistis untuk fondasi kode saat ini
- Semua breakdown mengacu ke alur runtime di `AGENTS.md`
- Jika implementasi dimulai, update juga `AGENTS.md` dan `README.md` pada root agar dokumentasi tetap sinkron
