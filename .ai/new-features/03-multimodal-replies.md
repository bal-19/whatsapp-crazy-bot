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

Ini sudah cukup untuk:

- kirim meme
- kirim reaction image
- kirim gambar hasil AI eksternal
- kirim poster/quote card

## Desain Response yang Disarankan

Alih-alih `generateBotReply()` hanya return string, lebih fleksibel jika return object seperti:

```ts
type BotReply =
  | { type: "text"; text: string }
  | { type: "image"; imageUrl?: string; imageBuffer?: Buffer; caption?: string };
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
  -> generateBotReply()
  -> hasil reply bertipe text atau image
  -> BotManager memilih format sendMessage()
  -> kirim ke WhatsApp
  -> simpan metadata outbound message ke database
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

Kalau schema sekarang belum mendukung, versi awal bisa tetap menyimpan caption/body dulu sambil menambah metadata belakangan.

## Risiko

- file media menambah kompleksitas storage
- perlu validasi URL dan ukuran file
- retry lebih rumit dibanding text-only
- observability perlu membedakan text error vs media error

## Saran Implementasi

Urutan implementasi yang disarankan:

1. refactor `sendAndLog()` agar mendukung union reply type
2. pertahankan jalur text lama agar backward compatible
3. tambah jalur kirim image dari URL atau buffer
4. tambah logging metadata outbound
5. baru hubungkan dengan image analysis atau image generation

## Dependensi Fitur

Balasan multimodal adalah fondasi untuk dua fitur lain:

- analisis gambar/meme
- generate gambar AI

Karena itu, jika implementasi dimulai, fitur ini layak dijadikan base layer lebih dulu walaupun user-facing feature yang terlihat pertama bisa saja image analysis.
