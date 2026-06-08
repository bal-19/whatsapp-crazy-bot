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
  -> parse inbound image (jika ada)
  -> generateBotReply()
  -> Gemini queue
  -> processGeminiOutput()
  -> resolve BotReply payload
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
- Model analisis media: `env.GEMINI_MODEL`
- Model generate/edit gambar statis: `gemini-2.5-flash-preview-image`
- Default `.env.example`: `gemini-1.5-flash-latest`
- `temperature`: `0.7`
- `topP`: `0.9`
- `topK`: `40`
- `maxOutputTokens`: `512` untuk text model, `2048` untuk image model
- `responseMimeType`: `text/plain`
- `safetySettings`: di-set eksplisit ke `BLOCK_NONE` untuk kategori yang didukung SDK

Catatan penting:

- Jika `GEMINI_API_KEY` tidak ada, pemanggilan Gemini akan gagal.
- Untuk analisis media, jalur multimodal memakai `env.GEMINI_MODEL` melalui `generateContent()` dengan image `inlineData`.
- Model statis `gemini-2.5-flash-preview-image` hanya dipakai untuk generate atau edit gambar.
- Jalur multimodal membaca response part `text` dan `inlineData`; jika Gemini mengembalikan `inlineData`, runtime mengirimnya sebagai `BotReply` image ke WhatsApp.

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
- pesan dari contact dengan `is_blocked=true`
- grup jika `ignore_groups=true`
- semua pesan jika `is_active=false`

Contact yang diblokir dicek berdasarkan JID WhatsApp asli. Untuk pesan grup, status blocked member berlaku di semua grup dan pesan diabaikan sebelum disimpan atau diteruskan ke Gemini. Event dicatat sebagai `message_ignored_blocked_contact`.

Catatan media:

- image tanpa caption belum diproses di V1 karena pesan tanpa teks/caption masih difilter sebelum parser media
- image dengan caption tetap mengikuti rules mention yang sama seperti text message
- media yang dibungkus ephemeral/view-once dinormalisasi lewat Baileys sebelum text/caption dan image dibaca

### 5.3 Intent khusus

Intent yang benar-benar ada:

- `reset`
- `handoff`
- `normal`

Tidak ada `off_hours` aktif di implementasi sekarang.

Trigger:

- `/list`, `/help`, atau `/commands` -> kirim daftar command yang tersedia
- `/reset` atau `mulai dari awal` -> clear memory + clear conversation di database untuk conversation scope aktif
- `/resetmemory`, `/lupainaku`, atau `lupain aku` -> clear personal memory untuk conversation scope aktif
- `bicara dengan manusia`, `hubungi admin`, `minta tolong orang` -> kirim template handoff

## 5.4 Conversation Scope

Conversation identity sekarang dipisahkan dari tujuan pengiriman WhatsApp.
Nama grup disimpan terpisah sebagai metadata berdasarkan `groupJid`.

Aturan:

- chat personal memakai `remoteJid` sebagai `contact_id`
- chat grup memakai format `groupJid::participantJid` sebagai `contact_id`
- jika `participantJid` tidak tersedia pada pesan grup, fallback ke `groupJid` dan log `conversation_scope_group_fallback`
- balasan WhatsApp tetap dikirim ke `deliveryJid`, yaitu JID personal atau JID grup asli
- nama member disimpan di `contacts.display_name` untuk scoped `contact_id`
- nama grup disimpan di table `whatsapp_groups` dengan key `group_jid`
- saat pesan grup masuk, `group_jid` otomatis di-track dengan `display_name=null` bila belum ada
- tracking otomatis tidak menimpa `display_name` grup yang sudah diisi manual
- metadata grup bisa disimpan manual dari dashboard lewat halaman `/groups` dan API `/api/v1/groups`

Dampak:

- history message tetap tersimpan per scoped member
- memory percakapan AI di grup digabung per `groupJid`, jadi semua member dalam grup berbagi konteks chat yang sama
- `/reset` di grup membersihkan memory percakapan grup tersebut, bukan hanya member pemicu
- outbound message tetap disimpan ke `contact_id` scoped
- dashboard conversation bisa menampilkan beberapa conversation untuk satu grup karena tiap member punya scope sendiri
- dashboard menampilkan scoped group sebagai `Member <nama member> di grup <nama grup>` bila metadata tersedia, lalu fallback ke nomor/JID bila belum tersedia

## 6. Memory Percakapan

Memory aktif di [apps/server/src/ai/conversation-memory.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/conversation-memory.ts:1).

Perilaku:

- Sliding window 10 turn atau 20 message
- TTL session 1 jam
- In-memory `Map`
- Saat perlu, history dihydrate dari database lewat `appDb.getRecentHistory()`
- Cleanup expired session tiap 30 menit

Source of truth percakapan tetap database Supabase, sementara memory dipakai untuk performa dan konteks cepat.

Catatan struktur data yang aktif sekarang:

- `contacts` menyimpan identitas WhatsApp yang unik per nomor/JID asli
- `conversation_scopes` menyimpan scope percakapan runtime seperti `groupJid::participantJid`
- `messages` dan `contact_memories` terhubung ke `conversation_scopes`, bukan langsung ke `contacts`
- untuk chat personal, `scope_key` sama dengan JID user; untuk grup per-member, `scope_key` berbeda per grup

Catatan grup:

- key memory untuk DM memakai `contact_id`
- key memory untuk grup memakai `groupJid`
- saat history dihydrate untuk AI pada grup, source diambil gabungan dari semua scoped member dalam grup yang sama

## 6.1 Personal Memory

Selain conversation memory jangka pendek, bot sekarang punya personal memory ringan untuk fakta eksplisit per user/scope.

Komponen:

- [apps/server/src/ai/personal-memory.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/personal-memory.ts:1)
- [apps/server/src/services/personalMemoryService.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/services/personalMemoryService.ts:1)

Perilaku saat ini:

- memory mengikuti `contact_id` hasil conversation scope
- memory hanya disimpan dari pola eksplisit
- key yang aktif saat ini:
  - `preferred_name`
  - `favorite_topics`
- memory disisipkan ke prompt sebagai context tambahan
- personal memory bisa dihapus dengan command reset memory

## 7. Input Sanitization

Sanitizer aktif di [apps/server/src/ai/input-sanitizer.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/input-sanitizer.ts:1).

Aturan:

- trim whitespace
- reject empty message
- truncate input di atas 2000 karakter
- deteksi sederhana pola prompt injection untuk logging
- tidak menolak injection pattern secara otomatis; tetap diteruskan ke model dengan guardrails prompt

Untuk image analysis V1:

- caption tetap melewati sanitizer yang sama
- binary image tidak ikut masuk ke sanitizer

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

Untuk reply text, hasil `processGeminiOutput()` sekarang dibungkus sebagai `BotReply` bertipe `text` sebelum diteruskan ke jalur pengiriman.

## 8.1 Reply Type dan Outbound Media

Outbound reply sekarang tidak lagi diasumsikan selalu string plain text.

Fondasi aktif:

- `apps/server/src/ai/reply-types.ts`
- `apps/server/src/services/mediaService.ts`

Jenis reply yang sudah didukung di layer runtime:

- `text`
- `image`
- `document`

Aturan runtime:

- text reply tetap dikirim sebagai `{ text: ... }`
- image reply bisa dikirim dari `imageUrl` atau `imageBuffer`
- preview outbound yang disimpan di database tetap memakai text utama atau caption
- outbound reply menyimpan `reply_to_message_id` dari WhatsApp message id inbound yang dibalas
- dashboard conversation memakai `reply_to_message_id` sebagai acuan quoted preview, bukan waktu atau urutan pesan
- metadata media outbound disimpan ke `raw_payload`

## 8.3 Generate Dokumen V1

Bot dapat membuat tepat satu file per prompt dan langsung mengirimnya ke WhatsApp tanpa menyimpan file ke storage publik.

Format aktif:

- PDF dirender langsung di Node.js memakai `pdfkit` tanpa browser
- DOCX memakai package `docx`
- XLSX memakai package `exceljs`

Perilaku:

- Gemini menyusun rancangan JSON terstruktur, lalu server memvalidasi dan merender binary file
- permintaan lebih dari satu format dalam satu prompt ditolak dengan arahan memilih satu format
- jika format tidak disebut, runtime memakai heuristik: data/tabular ke XLSX, naratif ke DOCX, dan visual/siap cetak ke PDF
- dashboard test prompt hanya menampilkan preview text dan tidak menyediakan download dokumen
- metadata dokumen outbound disimpan ke `raw_payload`
- capability dokumen dapat dinyalakan/dimatikan dari config dashboard
- format yang diizinkan dapat dibatasi melalui `allowed_document_formats`

Dashboard menampilkan:

- badge dan metadata file dokumen pada conversation
- filter pesan dokumen berdasarkan PDF, DOCX, atau XLSX
- filter event dan kegagalan dokumen pada logs
- analytics jumlah, format, latency, dan kegagalan dokumen

## 8.2 Analisis Gambar V1

Bot sekarang punya jalur multimodal untuk `imageMessage` yang memiliki caption atau instruksi teks.

Komponen:

- [apps/server/src/ai/media-parser.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/media-parser.ts:1)
- [apps/server/src/ai/multimodal-service.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/multimodal-service.ts:1)

Perilaku V1:

- bot mendownload image dari WhatsApp bila pesan berupa `imageMessage`
- caption user dipakai sebagai instruksi analisis, edit, atau generate image
- mode analisis dasar yang ada: `describe`, `caption`, `roast`, `meme_explain`
- request analisis gambar memakai model `env.GEMINI_MODEL` dan tetap dikirim sebagai reply text
- request generate/edit gambar seperti `buatkan gambar ...`, `generate image ...`, atau `ubah foto ini ...` masuk ke jalur image generation
- bila Gemini mengembalikan image part, bot mengirim image buffer ke WhatsApp dengan caption pendek bila tersedia
- image yang terlalu besar akan memakai fallback error media

## 9. Rate Limiting dan Queue

Implementasi ada di [apps/server/src/ai/rate-limiter.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/ai/rate-limiter.ts:1).
Rate limiting HTTP API ada di [apps/server/src/api/rate-limiters.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/api/rate-limiters.ts:1).

Aturan runtime:

- `interval`: 60 detik
- `intervalCap`: 12 request
- `concurrency`: 1
- `timeout`: 30 detik

Tambahan:

- queue dianggap overload jika size > 50
- jika overload, user langsung menerima `ERROR_MESSAGES.queue_full`
- ada counter request harian untuk observability

Aturan HTTP API:

- global API limiter default `100` request per `60` detik
- login limiter default `5` percobaan gagal per `15` menit per kombinasi IP dan username
- endpoint `/api/v1/test-prompt` default `10` request per `60` detik per IP
- respons limit memakai HTTP `429` dengan JSON `message` dan `retry_after_seconds`
- event limit dicatat ke log sebagai `api_rate_limit_exceeded`, `auth_rate_limit_exceeded`, atau `test_prompt_rate_limit_exceeded`
- nilai dapat dikonfigurasi lewat env `API_RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`, dan `TEST_PROMPT_RATE_LIMIT_*`

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
- `audit_memory_updated`
- `audit_memory_cleared`
- `audit_multimodal_requested`
- `audit_reply_sent`
- `image_analysis_media_error`
- `group_jid_track_failed`
- `gemini_error`

Metadata `audit_reply_sent` sekarang juga dapat memuat:

- `replyToMessageId`
- `replyType`
- `mimeType`
- `mediaSource`
- `hasCaption`

## 12. Dashboard Authentication dan Authorization

Auth dashboard sekarang menggunakan database, bukan env credentials saja. Selain login, sistem juga punya role dan permission untuk membatasi halaman serta fitur dashboard.

Komponen:

- [apps/server/src/auth/jwt.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/auth/jwt.ts:1)
- [apps/server/src/auth/permissions.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/auth/permissions.ts:1)
- [apps/server/src/services/accessControlService.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/server/src/services/accessControlService.ts:1)
- [supabase/migrations/202606030002_create_admin_users_table.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606030002_create_admin_users_table.sql:1)
- [supabase/migrations/202606050002_create_roles_and_users.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606050002_create_roles_and_users.sql:1)

Flow:

1. `POST /api/v1/auth/login`
2. query `users` by username
3. cek `is_active`
4. verify bcrypt hash
5. ambil relasi `roles.permissions`
6. sign JWT 12 jam dengan metadata user + permission
7. update `last_login_at`

Permission runtime yang aktif sekarang:

- `dashboard.view`
- `conversations.view`
- `contacts.manage`
- `groups.manage`
- `config.manage`
- `analytics.view`
- `logs.view`
- `users.manage`
- `roles.manage`
- `bot.manage`
- `maintenance.manage`

Catatan:

- halaman dashboard dibatasi di frontend dan backend
- endpoint sensitif memakai middleware `requirePermission(...)`
- sidebar hanya menampilkan menu yang sesuai permission user login
- role atau permission yang diubah di database paling aman dianggap aktif penuh setelah user login ulang

Default seed dari migration:

- username: `admin`
- password: `Admin@123`
- role: `Admin`

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
- `conversation-scope.ts`
- `database.ts` default config
- dokumen ini

Dengan begitu, dokumentasi tetap sinkron dengan perilaku bot yang benar-benar berjalan di project ini.
