# Analisis Gambar dan Meme

## Tujuan

Membuat bot bisa memahami gambar yang dikirim user, lalu membalas dengan gaya fun, informatif, atau lucu sesuai persona bot.

Contoh input:

- meme
- screenshot chat
- foto produk
- foto hewan
- poster
- gambar random untuk diminta caption atau roasting

## Nilai Fitur

Fitur ini sangat cocok untuk bot fun karena:

- interaksi jadi lebih variatif
- user bisa kirim meme atau screenshot, bukan hanya teks
- persona bot bisa dipakai untuk caption, roasting, atau explain meme

## Contoh Use Case

- "lora jelasin meme ini dong"
- "lora caption-in foto ini"
- "lora menurutmu screenshot ini lucu nggak?"
- "lora roast gambar ini"

## Kondisi Repo Saat Ini

Implementasi sekarang baru membaca:

- `conversation`
- `extendedTextMessage.text`
- `imageMessage.caption`
- `videoMessage.caption`

Artinya:

- caption gambar sudah bisa terbaca
- file media actual belum dianalisis model
- pipeline AI masih `text-only`

## Scope V1

Versi awal yang realistis:

- bot mendeteksi jika ada `imageMessage`
- bot mengirim gambar + prompt user ke model multimodal
- bot membalas dengan teks hasil analisis

Status implementasi saat ini:

- `imageMessage` ber-caption sudah bisa masuk ke jalur multimodal
- image didownload dari WhatsApp lalu diproses dengan Gemini `inlineData`
- model gambar dikunci statis ke `gemini-3.1-flash-image`
- output akhir masih berupa text reply
- mode dasar `describe`, `caption`, `roast`, dan `meme_explain` sudah tersedia
- image tanpa caption belum diproses di V1

Mode jawaban bisa dibuat:

- `describe`: jelaskan isi gambar
- `caption`: buat caption lucu
- `roast`: roasting gambar secara ringan
- `meme-explain`: jelaskan kenapa meme lucu

## Aturan Kompatibilitas

Agar tidak merusak fondasi fitur lain:

- image analysis harus memakai conversation scope yang sama dengan text chat
- image analysis tidak boleh membuat jalur history terpisah sendiri
- hasil akhirnya harus dikembalikan lewat reply type abstraction milik multimodal replies
- metadata gambar yang dipakai harus dicatat ringkas di audit log
- jika fitur personal memory aktif, memory yang dipakai tetap mengikuti `contactId` scoped

## Non-Goal V1

- belum perlu edit gambar
- belum perlu OCR kompleks
- belum perlu deteksi objek presisi tinggi
- belum perlu analisis video penuh

## Arsitektur yang Cocok

Komponen yang terdampak:

- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/ai/gemini-client.ts`
- `apps/server/src/ai/prompt-builder.ts`
- `apps/server/src/ai/output-processor.ts`

Kemungkinan perlu file baru:

- `apps/server/src/ai/media-parser.ts`
- `apps/server/src/ai/multimodal-service.ts`

## Flow Runtime yang Disarankan

```text
User kirim gambar + caption
  -> handleMessage()
  -> resolve conversation scope
  -> deteksi imageMessage
  -> download/decode media dari WhatsApp
  -> ubah ke format yang diterima model
  -> ambil history dan personal memory berdasarkan contactId scoped
  -> gabungkan caption user + instruksi persona
  -> kirim ke model multimodal
  -> proses output teks
  -> bentuk reply type
  -> kirim balasan ke deliveryJid WhatsApp
  -> catat media summary ke audit log
```

## Kebutuhan Teknis

Hal yang dibutuhkan agar fitur ini jalan:

- akses buffer gambar dari Baileys
- helper untuk konversi media ke inline data atau part model
- model/provider yang mendukung input image
- fallback jika media gagal diproses
- integrasi dengan reply type abstraction
- integrasi dengan audit log

## Trigger UX yang Disarankan

Beberapa pola trigger yang cocok:

- jika ada gambar + mention bot, langsung analisis
- jika ada caption seperti "jelasin", "caption-in", "roast", "meme ini kenapa lucu", pilih mode analisis sesuai intent
- jika ada gambar tanpa instruksi jelas, default ke deskripsi singkat

## Risiko

- ukuran media bisa besar
- latency lebih tinggi dari chat teks
- output bisa ngaco jika meme sangat kontekstual
- perlu jaga agar roasting tetap aman dan tidak toxic berlebihan

## Error Handling

Tambahan fallback yang mungkin dibutuhkan:

- gagal baca file gambar
- format media tidak didukung
- model multimodal timeout
- ukuran file terlalu besar

## Saran Implementasi

Urutan paling aman:

1. implementasikan conversation scope lebih dulu
2. implementasikan reply type abstraction untuk multimodal replies
3. tambahkan audit log minimum untuk media flow
4. dukung gambar masuk dengan caption
5. tambah jalur khusus untuk image analysis
6. hasil tetap berupa teks
7. baru setelah stabil, tambahkan mode caption/roast/meme explain
