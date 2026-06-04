# Personal Memory Kecil-Kecilan

## Tujuan

Membuat bot terasa lebih personal dengan cara mengingat detail ringan tentang user, tanpa mengubah bot menjadi sistem memory kompleks.

Contoh yang diingat:

- nama panggilan user
- topik favorit
- gaya panggilan yang disukai
- inside joke ringan
- preferensi sederhana seperti suka film horor, coding, anime, atau sepak bola

## Nilai Fitur

Fitur ini cocok untuk bot fun karena:

- percakapan terasa lebih natural
- user merasa bot "kenal" mereka
- persona bot jadi lebih hidup
- jawaban bisa lebih nyambung antar sesi

## Contoh Use Case

- User bilang: "panggil aku Bima aja ya"
- User bilang: "gue suka bahas anime dan game"
- Bot menyimpan detail itu
- Di chat berikutnya bot bisa bilang: "siap Bima, mau bahas anime lagi atau topik lain?"

## Scope V1

Yang disarankan untuk versi awal:

- simpan maksimal 3 sampai 5 memory ringan per kontak
- hanya simpan memory dari pesan yang benar-benar eksplisit
- memory dipakai sebagai context tambahan saat generate reply
- sediakan command reset memory per user

## Non-Goal V1

- tidak perlu memory semantik yang kompleks
- tidak perlu vector database
- tidak perlu summary percakapan otomatis yang panjang
- tidak perlu inferensi agresif dari semua chat

## Sumber Data

Memory bisa diambil dari:

- pesan inbound user
- hasil ekstraksi fakta ringan setelah user mengirim pesan
- command eksplisit seperti `/ingat aku suka film horor`

## Arsitektur yang Cocok

Komponen yang relevan di repo:

- `apps/server/src/ai/conversation-memory.ts`
- `apps/server/src/ai/prompt-builder.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/bot/bot-manager.ts`
- layer database di `apps/server/src/db`

Pendekatan yang cocok:

1. Tambah storage memory jangka lebih panjang per `contact_id`
2. Ambil memory ringkas sebelum build prompt
3. Sisipkan memory ke context prompt
4. Setelah bot membaca pesan user, jalankan ekstraksi memory ringan

## Desain Data yang Disarankan

Tabel baru yang memungkinkan:

- `contact_memories`

Field yang disarankan:

- `id`
- `contact_id`
- `memory_key`
- `memory_value`
- `confidence`
- `source_message_id`
- `created_at`
- `updated_at`

Contoh isi:

- `preferred_name` -> `Bima`
- `favorite_topics` -> `anime, game`

## Flow Runtime yang Disarankan

```text
Pesan user masuk
  -> sanitizeInput()
  -> shouldBotRespond()
  -> ambil personal memory dari database
  -> build prompt dengan memory tambahan
  -> generate reply
  -> ekstrak kandidat personal memory dari pesan user
  -> simpan/update memory jika valid
```

## Heuristik V1

Agar aman dan sederhana, memory hanya disimpan jika ada pola jelas seperti:

- "namaku ..."
- "panggil aku ..."
- "aku suka ..."
- "favoritku ..."
- "jangan panggil aku ..."

Hal yang sebaiknya dihindari:

- menyimpan informasi sensitif
- menebak preferensi tanpa dasar yang jelas
- menyimpan memory dari prompt injection atau pesan bercanda yang ambigu

## Perubahan Kode yang Mungkin Dibutuhkan

- tambah repository/service untuk `contact_memories`
- update `prompt-builder.ts` agar menyisipkan memory personal
- tambah extractor sederhana, misalnya `personal-memory.ts`
- tambah intent/command seperti `/lupain aku` atau `/resetmemory`
- update test untuk ekstraksi, prompt, dan reset

## Risiko

- bot bisa terdengar creepy jika mengingat terlalu banyak
- memory salah simpan bisa bikin persona terasa aneh
- perlu batasan agar tidak menyimpan data sensitif

## Saran Implementasi

Urutan implementasi yang aman:

1. buat tabel `contact_memories`
2. simpan hanya `preferred_name` dan `favorite_topics`
3. tampilkan memory itu di prompt
4. tambah command reset memory
5. baru perluas ke preferensi lain jika hasilnya bagus
