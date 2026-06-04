# Group Member Scoped Conversations

## Tujuan

Mengubah perilaku conversation di grup agar tidak lagi menjadi satu history bersama untuk semua anggota, tetapi dipisah per member di dalam grup.

Dengan pendekatan ini:

- member A di grup X punya history sendiri
- member B di grup X punya history sendiri
- bot tetap membalas ke grup yang sama
- memory, context, dan reset tidak tercampur antar anggota

## Masalah Saat Ini

Implementasi sekarang memakai `message.key.remoteJid` sebagai `contact_id`.

Untuk chat grup, nilai itu adalah JID grup seperti:

- `123456789@g.us`

Akibatnya:

- semua anggota grup memakai `contact_id` yang sama
- history percakapan tercampur
- personal memory akan salah konteks jika nanti ditambahkan
- `/reset` di grup menghapus satu history bersama

## Opsi yang Dipilih

Fitur ini memakai pendekatan:

- `per grup per member`

Format identity yang disarankan:

- `groupJid::participantJid`

Contoh:

- `123456789@g.us::628123456789@s.whatsapp.net`

Artinya satu user yang sama di dua grup berbeda tetap punya dua conversation scope yang berbeda.

## Nilai Fitur

Fitur ini penting karena:

- bot terasa lebih personal di grup
- context jawaban tidak bocor antar anggota
- cocok untuk fitur memory personal kecil-kecilan
- lebih aman untuk eksperimen persona, game, dan multimodal flow di grup

## Scope V1

Versi awal yang realistis:

- pisahkan `contact_id` untuk pesan grup berdasarkan `groupJid::participantJid`
- untuk chat personal, tetap gunakan JID biasa
- semua history AI, memory session, dan reset memakai scoped key baru
- pengiriman balasan tetap ke JID grup asli

## Peran Sebagai Fondasi

Fitur ini adalah fondasi identity untuk fitur lain.

Aturan kompatibilitas:

- personal memory harus mengikuti `contactId` scoped ini pada V1
- audit log harus mencatat `contactId`, `deliveryJid`, `groupJid`, dan `participantJid`
- multimodal replies harus tetap mengirim ke `deliveryJid`, bukan `contactId`
- image analysis di grup harus memakai history berdasarkan `contactId` scoped

## Non-Goal V1

- belum perlu migrasi kompleks untuk data lama
- belum perlu UX dashboard yang menampilkan thread per grup secara sempurna
- belum perlu merge history antar grup untuk user yang sama

## Arsitektur yang Terdampak

Komponen utama yang perlu diubah:

- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/ai/conversation-memory.ts`
- `apps/server/src/db/database.ts`
- endpoint atau dashboard yang membaca conversation list

Kemungkinan file baru:

- `apps/server/src/bot/conversation-scope.ts`

## Desain Identity yang Disarankan

Tambahkan helper untuk menghasilkan scope conversation:

```ts
type ConversationScope = {
  contactId: string;
  deliveryJid: string;
  groupJid?: string;
  participantJid?: string;
  isGroup: boolean;
};
```

Aturan:

- jika chat personal:
  - `contactId = remoteJid`
  - `deliveryJid = remoteJid`
- jika chat grup:
  - `contactId = remoteJid + "::" + participantJid`
  - `deliveryJid = remoteJid`

## Flow Runtime yang Disarankan

```text
Pesan masuk
  -> baca remoteJid
  -> cek apakah grup
  -> jika grup, baca participantJid
  -> bentuk conversation scope
  -> simpan inbound message ke contact_id scoped
  -> load memory/history berdasarkan contact_id scoped
  -> generate reply
  -> kirim balasan ke deliveryJid grup
  -> simpan outbound message dengan contact_id scoped
```

## Perubahan Perilaku yang Diharapkan

Sesudah fitur ini:

- mention bot oleh anggota A tidak membawa history anggota B
- `/reset` oleh anggota A hanya reset scope anggota A di grup itu
- future personal memory akan lebih akurat
- analisis gambar dan multimodal reply di grup bisa lebih terkontrol per user

## Dampak ke Database

Versi awal paling sederhana:

- tetap gunakan field `contact_id` yang ada
- isi dengan scoped identifier untuk chat grup

Namun agar lebih rapi, metadata tambahan sebaiknya juga mulai dipertimbangkan:

- `group_jid`
- `participant_jid`
- `conversation_scope_type`

Kalau schema belum mau diubah sekarang, V1 masih bisa jalan hanya dengan scoped `contact_id`.

## Kontrak Data yang Disarankan

Agar fitur lain tidak salah asumsi, bedakan field berikut secara eksplisit:

- `contact_id`: identity internal conversation scope
- `delivery_jid`: tujuan kirim pesan WhatsApp
- `group_jid`: JID grup asal jika pesan dari grup
- `participant_jid`: JID member pengirim jika pesan dari grup

Walau `delivery_jid`, `group_jid`, dan `participant_jid` belum wajib jadi kolom database di V1, ketiganya sebaiknya sudah ada di object runtime dan metadata log.

## Dampak ke Dashboard

Karena list conversation saat ini kemungkinan membaca berdasarkan `contact_id`, efeknya:

- satu grup bisa tampak sebagai beberapa conversation berbeda
- nama contact bisa perlu format yang lebih informatif

Contoh label tampilan yang mungkin:

- `Budi @ Grup Tongkrongan`
- `Sari @ Grup Meme`

Kalau belum ingin menyentuh dashboard banyak, V1 bisa fokus dulu ke behavior backend.

## Risiko

- data lama grup tidak langsung cocok dengan format baru
- list conversation bisa terlihat lebih ramai
- jika participant JID tidak tersedia di kasus tertentu, perlu fallback aman

## Fallback yang Disarankan

Jika pesan grup tidak punya `participantJid` yang valid:

- fallback ke `remoteJid` grup lama
- log event khusus agar kasus ini bisa dipantau

## Kebutuhan Testing

Test yang sebaiknya ditambahkan:

- pesan personal tetap memakai JID biasa
- pesan grup dari dua member berbeda menghasilkan dua `contact_id` berbeda
- `/reset` di grup hanya membersihkan scope member yang memicu reset
- memory history group member A tidak muncul saat member B mengirim pesan
- outbound reply tetap terkirim ke JID grup, bukan ke participant JID

## Saran Implementasi

Urutan implementasi yang aman:

1. buat helper `resolveConversationScope()`
2. pakai helper itu di `bot-manager.ts`
3. arahkan semua operasi history dan memory ke `contactId` scoped
4. pertahankan pengiriman pesan ke `deliveryJid`
5. tambahkan logging metadata `groupJid` dan `participantJid`
6. tambahkan test untuk group isolation

## Hubungan dengan Fitur Lain

Fitur ini sangat mendukung:

- personal memory kecil-kecilan
- audit log
- analisis gambar/meme di grup
- balasan multimodal yang mempertahankan context per member

Jika roadmap fun bot ini ingin serius dipakai di grup, fitur ini termasuk fondasi yang sangat layak dikerjakan lebih awal.
