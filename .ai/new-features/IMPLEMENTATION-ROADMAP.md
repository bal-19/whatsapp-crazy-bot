# Implementation Roadmap

Roadmap ini disusun berdasarkan runtime aktual di `AGENTS.md`.

Alur yang harus dijaga:

```text
WhatsApp Message
  -> Baileys socket
  -> BotManager.handleMessage()
  -> sanitizeInput()
  -> shouldBotRespond() + detectIntent()
  -> generateBotReply()
  -> Gemini queue
  -> processGeminiOutput()
  -> sendMessage() ke WhatsApp
  -> simpan outbound message ke database
```

## Keputusan Utama

Fitur yang paling aman dikerjakan bersama pertama kali adalah:

- `01-group-member-scoped-conversations.md`
- `04-audit-log.md`

Alasannya:

- conversation scope menyentuh identity dasar untuk history, memory, reset, dan outbound logging
- audit log bisa langsung mencatat perubahan identity itu sejak awal
- keduanya tidak membutuhkan perubahan model Gemini atau media pipeline
- risiko behavior regression lebih mudah dilacak kalau audit sudah ikut masuk dari batch pertama

## Batch 1: Conversation Scope + Audit Log Minimum

Status: `sudah diimplementasi sebagian`

Fitur:

- `01-group-member-scoped-conversations.md`
- bagian minimum dari `04-audit-log.md`

Target hasil:

- chat personal tetap memakai JID personal sebagai `contact_id`
- chat grup memakai `groupJid::participantJid` sebagai `contact_id`
- balasan tetap dikirim ke `deliveryJid`
- `/reset` di grup hanya membersihkan scope member yang memicu reset
- audit log mencatat `contactId`, `deliveryJid`, `groupJid`, `participantJid`, dan intent dasar

Implementasi saat ini:

- `resolveConversationScope()` sudah tersedia di `apps/server/src/bot/conversation-scope.ts`
- `BotManager` sudah memakai `contactId` scoped untuk inbound, outbound, history, memory, AI generation, dan reset
- `BotManager` tetap memakai `deliveryJid` untuk presence update dan `sendMessage()`
- audit minimum sudah dicatat lewat `audit_message_received`, `audit_intent_detected`, dan `audit_reply_sent`
- fallback participant grup dicatat lewat `conversation_scope_group_fallback`

Komponen utama:

- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/ai/conversation-memory.ts`
- `apps/server/src/services/logService.ts`
- `apps/server/src/db/database.ts`

Urutan kerja:

1. Tambah helper `resolveConversationScope()`
2. Pakai `contactId` scoped untuk insert inbound message, memory, history, AI generation, reset, dan outbound log
3. Pakai `deliveryJid` untuk `sendMessage()` dan presence update
4. Tambah audit metadata lewat `logService` atau service ringan
5. Tambah test untuk personal chat, group member A, group member B, dan reset scoped

Catatan kompatibilitas:

- jangan mulai personal memory sebelum scope ini stabil
- jangan mulai multimodal sebelum `deliveryJid` dan `contactId` sudah jelas

## Batch 2: Multimodal Reply Base + Audit Extension

Status: `sudah diimplementasi sebagian`

Fitur:

- `03-multimodal-replies.md`
- perluasan `04-audit-log.md`

Target hasil:

- `generateBotReply()` atau layer setelahnya bisa mengembalikan reply type
- text reply lama tetap berjalan
- image reply dari URL atau buffer punya jalur `sendAndLog()` sendiri
- audit log mencatat `reply_type`, `mime_type`, dan ringkasan media

Implementasi saat ini:

- `BotReply` sudah tersedia di `apps/server/src/ai/reply-types.ts`
- `generateBotReply()` sekarang mengembalikan `BotReply` dan text reply lama tetap berjalan
- `BotManager.sendAndLog()` sudah mendukung text dan image reply
- `mediaService` sudah menangani payload WhatsApp, preview storage, dan audit summary
- metadata media outbound sudah disimpan ke `raw_payload`
- audit reply sudah memuat `replyType`, `mimeType`, `mediaSource`, dan `hasCaption`

Komponen utama:

- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/output-processor.ts`
- `apps/server/src/services/mediaService.ts`

Urutan kerja:

1. Tambah type `BotReply`
2. Ubah jalur text agar tetap compatible
3. Refactor `sendAndLog()` menerima reply type
4. Tambah dukungan image reply
5. Tambah audit metadata untuk reply type

Catatan kompatibilitas:

- semua reply harus tetap dikirim ke `deliveryJid`
- outbound log tetap disimpan ke `contactId` scoped

## Batch 3: Personal Memory Ringan

Status: `belum diimplementasi`

Fitur:

- `02-personal-memory.md`
- perluasan `04-audit-log.md`

Target hasil:

- bot bisa menyimpan memory eksplisit seperti nama panggilan dan topik favorit
- memory mengikuti `contactId` scoped
- memory dipakai dalam prompt builder sebagai context tambahan
- user bisa reset memory personal
- audit log mencatat memory summary yang dipakai

Komponen utama:

- `apps/server/src/ai/prompt-builder.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/ai/conversation-memory.ts`
- `apps/server/src/db/database.ts`
- migration database baru

Urutan kerja:

1. Tambah tabel atau adapter `contact_memories`
2. Tambah service personal memory
3. Tambah extractor rule-based untuk memory eksplisit
4. Sisipkan memory ke prompt
5. Tambah command reset memory
6. Tambah audit metadata memory

Catatan kompatibilitas:

- memory V1 mengikuti scope, bukan user global
- jangan menyimpan data sensitif atau inferensi agresif

## Batch 4: Image and Meme Analysis

Status: `belum diimplementasi`

Fitur:

- `05-image-meme-analysis.md`
- perluasan `03-multimodal-replies.md`
- perluasan `04-audit-log.md`

Target hasil:

- bot bisa menerima `imageMessage`
- bot bisa mengirim gambar + caption user ke model multimodal
- hasil analisis dikirim sebagai reply type standar
- audit log mencatat metadata media dan mode analisis

Komponen utama:

- `apps/server/src/bot/bot-manager.ts`
- `apps/server/src/ai/gemini-client.ts`
- `apps/server/src/ai/ai-service.ts`
- `apps/server/src/ai/media-parser.ts`
- `apps/server/src/ai/multimodal-service.ts`

Urutan kerja:

1. Tambah deteksi image message setelah scope siap
2. Tambah download/decode media dari Baileys
3. Tambah client multimodal untuk model yang mendukung image input
4. Proses output dengan output processor
5. Kirim hasil lewat reply type standar
6. Catat audit metadata media

Catatan kompatibilitas:

- image analysis tetap memakai `contactId` scoped
- fallback error tetap memakai reply type text standar

## Ringkasan Prioritas

Prioritas implementasi yang disarankan:

1. `Batch 1`: group member scoped conversations + audit log minimum
2. `Batch 2`: multimodal reply base + audit extension
3. `Batch 3`: personal memory ringan
4. `Batch 4`: image and meme analysis

Batch pertama adalah pilihan paling stabil karena memperbaiki fondasi identity tanpa langsung menyentuh Gemini multimodal, media download, atau schema memory yang lebih sensitif.
