# Balasan Multimodal

## Tujuan

Membuat bot tidak hanya membalas dengan teks, tetapi juga bisa mengirim media seperti gambar beserta caption agar interaksi lebih seru dan ekspresif.

## Nilai Fitur

Fitur ini penting untuk bot fun karena:

- balasan terasa lebih hidup
- cocok untuk meme, poster lucu, reaction image, dan hasil generatif
- membuka jalan ke fitur image generation di masa depan

## Kondisi Repo Saat Ini

Saat ini outbound reply selalu:

- `sendMessage(jid, { text: body })`

Jadi arsitektur sekarang belum punya abstraction untuk tipe balasan lain seperti:

- text
- image
- image + caption
- audio
- sticker

## Scope V1

Versi awal yang paling realistis:

- dukung `text`
- dukung `image + caption`
- dukung `image` dari URL atau buffer

Status implementasi saat ini:

- reply type `text` dan `image` sudah tersedia
- `sendAndLog()` sudah menerima reply type
- image reply dari URL atau buffer sudah bisa dibentuk di layer runtime
- metadata media outbound sudah tersimpan di `raw_payload`
- fitur user-facing yang memicu image reply otomatis masih menyusul di batch berikutnya

Ini sudah cukup untuk:

- kirim meme
- kirim reaction image
- kirim gambar hasil AI eksternal
- kirim poster/quote card

## Aturan Kompatibilitas

Agar tidak bentrok dengan fitur lain:

- reply type harus menjadi abstraction tunggal untuk text dan media
- `contact_id` tidak boleh dipakai sebagai target kirim; gunakan `deliveryJid` dari conversation scope
- semua reply multimodal harus bisa dicatat di audit log dengan format seragam
- image analysis harus mengembalikan reply melalui abstraction ini, bukan jalur kirim terpisah
- fallback error text tetap harus memakai jalur reply type yang sama

## Desain Response yang Disarankan

Alih-alih `generateBotReply()` hanya return string, lebih fleksibel jika return object seperti:

```ts
type BotReply =
  | { type: "text"; text: string }
  | {
      type: "image";
      imageUrl?: string;
      imageBuffer?: Buffer;
      caption?: string;
      mimeType?: string;
      auditMeta?: Record<string, unknown>;
    };
```

Dengan begitu `BotManager.sendAndLog()` bisa memutuskan payload WhatsApp yang tepat.

## Arsitektur yang Cocok

Komponen yang terdampak:

- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/output-processor.ts`
- penyimpanan message outbound di database

Kemungkinan perlu file baru:

- `apps/server/src/ai/reply-types.ts`
- `apps/server/src/services/mediaService.ts`

## Flow Runtime yang Disarankan

```text
Pesan user masuk
  -> resolve conversation scope
  -> generateBotReply()
  -> hasil reply bertipe text atau image
  -> BotManager memilih format sendMessage() berdasarkan reply type
  -> kirim ke deliveryJid
  -> kirim ke WhatsApp
  -> simpan metadata outbound message ke database
  -> catat metadata reply ke audit log
```

## Contoh Use Case

- user minta "kirim meme kucing lucu"
- bot balas dengan gambar + caption
- user minta "bikinin poster absurd"
- bot generate atau ambil gambar lalu kirim
- user kirim gambar, bot analisis, lalu balas dengan teks plus reaction image

## Data dan Logging

Jika ingin rapi, outbound message sebaiknya bisa menyimpan metadata tambahan:

- `message_type`
- `media_url`
- `mime_type`
- `caption`
- `delivery_jid`
- `group_jid`
- `participant_jid`

Kalau schema sekarang belum mendukung, versi awal bisa tetap menyimpan caption/body dulu sambil menambah metadata belakangan.

## Risiko

- file media menambah kompleksitas storage
- perlu validasi URL dan ukuran file
- retry lebih rumit dibanding text-only
- observability perlu membedakan text error vs media error

## Saran Implementasi

Urutan implementasi yang disarankan:

1. refactor `sendAndLog()` agar mendukung union reply type
2. sambungkan ke conversation scope supaya `deliveryJid` terpisah dari `contactId`
3. pertahankan jalur text lama agar backward compatible
4. tambah jalur kirim image dari URL atau buffer
5. tambah logging metadata outbound
6. catat `reply_type` dan metadata media ke audit log
7. baru hubungkan dengan image analysis atau image generation

## Dependensi Fitur

Balasan multimodal adalah fondasi untuk dua fitur lain:

- group member scoped conversations
- audit log
- analisis gambar/meme
- generate gambar AI

Karena itu, jika implementasi dimulai, fitur ini layak dijadikan base layer lebih dulu walaupun user-facing feature yang terlihat pertama bisa saja image analysis.
