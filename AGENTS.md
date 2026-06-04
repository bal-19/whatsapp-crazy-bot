# AGENTS.md

## Panduan Agent, Prompting, dan Integrasi Gemini

Dokumen ini menjelaskan perilaku agent yang benar-benar dipakai di repo saat ini, bukan desain lama. Fokusnya adalah bagaimana pesan WhatsApp diproses, kapan bot membalas, bagaimana prompt dibentuk, dan bagaimana memory, queue, serta fallback bekerja.

## 1. Peran Agent di Sistem

Alur runtime saat ini:

```text
WhatsApp Message
  -> Baileys socket
  -> BotManager.handleMessage()
  -> resolveConversationScope()
  -> sanitizeInput()
  -> shouldBotRespond() + detectIntent()
  -> generateBotReply()
  -> Gemini queue
  -> processGeminiOutput()
  -> sendMessage() ke WhatsApp
  -> simpan outbound message ke database
```

Komponen kunci:

- [apps/server/src/bot/bot-manager.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/bot/bot-manager.ts:1)
- [apps/server/src/bot/conversation-scope.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/bot/conversation-scope.ts:1)
- [apps/server/src/ai/ai-service.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/ai-service.ts:1)
- [apps/server/src/ai/prompt-builder.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/prompt-builder.ts:1)
- [apps/server/src/ai/conversation-memory.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/conversation-memory.ts:1)

## 2. Konfigurasi Model Saat Ini

Client Gemini sekarang dibangun dari [apps/server/src/ai/gemini-client.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/gemini-client.ts:1).

Konfigurasi aktif:

- Model: `env.GEMINI_MODEL`
- Default `.env.example`: `gemini-1.5-flash-latest`
- `temperature`: `0.7`
- `topP`: `0.9`
- `topK`: `40`
- `maxOutputTokens`: `512`
- `responseMimeType`: `text/plain`
- `safetySettings`: array kosong

Catatan penting:

- Dokumen lama menyebut threshold safety Gemini di-code; implementasi sekarang tidak memasang safety settings eksplisit.
- Jika `GEMINI_API_KEY` tidak ada, pemanggilan Gemini akan gagal.

## 3. Arsitektur Prompt Saat Ini

Prompt builder aktif ada di [apps/server/src/ai/prompt-builder.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/prompt-builder.ts:1).

Prompt dibentuk dari tiga bagian:

1. Core rules hardcoded
2. Persona dari `bot_settings.system_prompt`
3. Context dinamis

Isi penting implementasi sekarang:

- Bot diperkenalkan sebagai `bot_name`
- Gaya dasar helpful
- Untuk `tone_style=helpful`, guide tambahan yang dipakai justru bernuansa romantis, manja, dan penuh perhatian
- Waktu dibentuk dalam locale `id-ID` dengan timezone `Asia/Jakarta`
- Nama kontak ditambahkan bila tersedia

Tone guide yang tersedia:

- `pedas`
- `wholesome`
- `absurd`
- `helpful`
- `custom`

## 4. Default Persona dan Config

Default config in-memory di [apps/server/src/db/database.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/db/database.ts:1):

- `bot_name`: `Ikmal`
- `is_active`: `true`
- `ignore_groups`: `false`
- `tone_style`: `helpful`
- `system_prompt`: persona helpful Gen Z

Migration awal `bot_settings` memakai default berbeda:

- `ignore_groups`: `true`
- `tone_style`: `pedas`

Jadi source of truth perilaku final adalah record `bot_settings` di database, bukan default yang tertulis di dokumen lama.

## 5. Rules Perilaku Agent

### 5.1 Kapan bot merespons

Bot tidak otomatis membalas semua pesan. Implementasi di [apps/server/src/ai/intent-detector.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/intent-detector.ts:1) dan [apps/server/src/bot/bot-manager.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/bot/bot-manager.ts:1) menunjukkan:

- Bot merespons jika nama bot lengkap disebut
- Bot merespons jika salah satu kata dari nama bot disebut dan panjang katanya > 2
- Bot merespons command seperti `/reset`
- Bot merespons frasa seperti `mulai dari awal`

Jika pesan tidak mention bot, pesan diabaikan dan dicatat sebagai log `message_ignored_no_mention`.

### 5.2 Filter pesan

Bot mengabaikan:

- pesan dari akun sendiri
- newsletter JID `@newsletter`
- pesan tanpa teks/caption
- grup jika `ignore_groups=true`
- semua pesan jika `is_active=false`

### 5.3 Intent khusus

Intent yang benar-benar ada:

- `reset`
- `handoff`
- `normal`

Tidak ada `off_hours` aktif di implementasi sekarang.

Trigger:

- `/reset` atau `mulai dari awal` -> clear memory + clear conversation di database untuk conversation scope aktif
- `bicara dengan manusia`, `hubungi admin`, `minta tolong orang` -> kirim template handoff

## 5.4 Conversation Scope

Conversation identity sekarang dipisahkan dari tujuan pengiriman WhatsApp.

Aturan:

- chat personal memakai `remoteJid` sebagai `contact_id`
- chat grup memakai format `groupJid::participantJid` sebagai `contact_id`
- jika `participantJid` tidak tersedia pada pesan grup, fallback ke `groupJid` dan log `conversation_scope_group_fallback`
- balasan WhatsApp tetap dikirim ke `deliveryJid`, yaitu JID personal atau JID grup asli

Dampak:

- history dan memory session di grup dipisah per member
- `/reset` di grup hanya membersihkan scope member yang memicu reset
- outbound message tetap disimpan ke `contact_id` scoped
- dashboard conversation bisa menampilkan beberapa conversation untuk satu grup karena tiap member punya scope sendiri

## 6. Memory Percakapan

Memory aktif di [apps/server/src/ai/conversation-memory.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/conversation-memory.ts:1).

Perilaku:

- Sliding window 10 turn atau 20 message
- TTL session 1 jam
- In-memory `Map`
- Saat perlu, history dihydrate dari database lewat `appDb.getRecentHistory()`
- Cleanup expired session tiap 30 menit

Source of truth percakapan tetap database Supabase, sementara memory dipakai untuk performa dan konteks cepat.

Catatan grup:

- key memory memakai conversation scope
- pesan dari member berbeda dalam grup yang sama tidak berbagi memory session

## 7. Input Sanitization

Sanitizer aktif di [apps/server/src/ai/input-sanitizer.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/input-sanitizer.ts:1).

Aturan:

- trim whitespace
- reject empty message
- truncate input di atas 2000 karakter
- deteksi sederhana pola prompt injection untuk logging
- tidak menolak injection pattern secara otomatis; tetap diteruskan ke model dengan guardrails prompt

## 8. Output Processing

Processor aktif di [apps/server/src/ai/output-processor.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/output-processor.ts:1).

Pipeline:

1. fallback jika output kosong
2. strip markdown dan HTML sederhana
3. normalize newline
4. truncate ke 800 karakter
5. trim final

Detail sanitasi:

- hapus `**bold**`, `*italic*`, `_italic_`, inline code, heading markdown
- hapus tag HTML
- batasi maksimal 2 newline berurutan

## 9. Rate Limiting dan Queue

Implementasi ada di [apps/server/src/ai/rate-limiter.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/rate-limiter.ts:1).

Aturan runtime:

- `interval`: 60 detik
- `intervalCap`: 12 request
- `concurrency`: 1
- `timeout`: 30 detik

Tambahan:

- queue dianggap overload jika size > 50
- jika overload, user langsung menerima `ERROR_MESSAGES.queue_full`
- ada counter request harian untuk observability

## 10. Error Recovery

Balasan fallback ada di [apps/server/src/ai/error-messages.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/error-messages.ts:1).

Kategori yang dipakai:

- `timeout`
- `rate_limit`
- `safety`
- `server_error`
- `generic`
- `queue_full`
- `reset`
- `handoff`

Catatan penting:

- Copy fallback saat ini bernuansa romantis/flirty, bukan satir seperti versi dokumen lama.
- Klasifikasi error dilakukan via pencocokan string pada pesan error Gemini.

## 11. Monitoring dan Logging

Observability berjalan lewat:

- `system_logs` di database
- Pino logger
- endpoint REST logs
- update realtime Socket.IO untuk status bot, message baru, dan analytics

Event penting yang muncul di kode:

- `bot_starting`
- `bot_connected`
- `bot_disconnected`
- `bot_restart_requested`
- `bot_reset_auth_requested`
- `message_received`
- `message_ignored_no_mention`
- `conversation_scope_group_fallback`
- `audit_message_received`
- `audit_intent_detected`
- `audit_reply_sent`
- `gemini_error`

## 12. Admin Authentication

Auth dashboard sekarang menggunakan database, bukan env credentials.

Komponen:

- [apps/server/src/auth/jwt.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/auth/jwt.ts:1)
- [apps/server/src/services/adminUserService.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/services/adminUserService.ts:1)
- [supabase/migrations/202606030002_create_admin_users_table.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606030002_create_admin_users_table.sql:1)

Flow:

1. `POST /api/v1/auth/login`
2. query `admin_users` by username
3. cek `is_active`
4. verify bcrypt hash
5. sign JWT 12 jam
6. update `last_login_at`

Default seed dari migration:

- username: `admin`
- password: `admin123`

## 13. Testing yang Sudah Ada

Test server yang tersedia saat ini:

- [apps/server/src/tests/prompt-builder.test.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/tests/prompt-builder.test.ts:1)
- [apps/server/src/tests/input-sanitizer.test.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/tests/input-sanitizer.test.ts:1)
- [apps/server/src/tests/output-processor.test.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/tests/output-processor.test.ts:1)
- [apps/server/src/tests/intent-detector.test.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/tests/intent-detector.test.ts:1)
- [apps/server/src/tests/api.test.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/tests/api.test.ts:1)
- [apps/server/src/tests/whatsapp-auth-state.test.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/tests/whatsapp-auth-state.test.ts:1)

## 14. Catatan Konsistensi

Jika ada perubahan perilaku agent ke depan, update minimal bagian berikut secara bersamaan:

- `prompt-builder.ts`
- `error-messages.ts`
- `intent-detector.ts`
- `database.ts` default config
- dokumen ini

Dengan begitu, dokumentasi tetap sinkron dengan perilaku bot yang benar-benar berjalan di project ini.
