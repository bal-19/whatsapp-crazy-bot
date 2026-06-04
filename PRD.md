# Product Requirements Document
## WhatsApp AI Bot

**Version:** 1.0.0
**Last Updated:** 2026-06-04
**Status:** Aligned to current implementation

## 1. Executive Summary

WhatsApp AI Bot adalah aplikasi untuk menjalankan bot AI di WhatsApp dengan dashboard admin berbasis web. Implementasi saat ini sudah mencakup bot engine, login admin, konfigurasi persona, monitoring realtime, penyimpanan data di Supabase, dan pengelolaan kontak serta percakapan.

Produk ini sudah lebih dekat ke admin tool operasional daripada sekadar eksperimen prompt. Fokus utamanya sekarang adalah:

- menghubungkan akun WhatsApp via QR
- menerima dan memproses pesan
- membalas dengan Gemini berdasarkan config aktif
- menyimpan history dan log ke database
- memberi visibilitas operasional dari dashboard

## 2. Problem Statement

Masalah yang diselesaikan oleh implementasi saat ini:

- Sulit mengelola bot WhatsApp jika status koneksi, QR auth, dan error tidak terlihat
- Perubahan persona bot tanpa dashboard akan merepotkan admin non-teknis
- Percakapan dan history sulit ditinjau jika tidak disimpan secara terstruktur
- Admin butuh cara sederhana untuk mengecek performa bot, logs, dan queue AI

## 3. Product Goals

Goal yang sudah tercermin di repo:

1. Admin dapat menjalankan bot WhatsApp dan menghubungkannya lewat QR.
2. Bot dapat membalas pesan yang relevan menggunakan Gemini dengan konteks percakapan singkat.
3. Admin dapat mengubah nama bot, system prompt, tone, dan flag operasional dari dashboard.
4. Admin dapat memantau status bot, percakapan, contacts, analytics, dan logs tanpa menyentuh database langsung.

## 4. Personas

### Persona 1: Admin Operasional

Ciri:

- Menjalankan bot untuk grup atau kontak WhatsApp
- Perlu lihat status koneksi, QR, error, dan volume pesan
- Ingin mengganti persona bot tanpa deploy ulang

Kebutuhan:

- dashboard stabil
- login admin
- reset auth WhatsApp
- restart bot
- edit config
- review percakapan

### Persona 2: End User WhatsApp

Ciri:

- Berinteraksi dengan bot lewat chat
- Tidak melihat dashboard
- Mengharapkan bot membalas sesuai persona yang diatur admin

Kebutuhan:

- balasan relevan
- gaya bahasa konsisten
- respons tidak terlalu lama

## 5. Scope Implementasi Saat Ini

### In Scope

- Koneksi WhatsApp via Baileys
- QR login dan reset auth
- Auto reconnect
- Penyimpanan state auth WhatsApp di database
- Login admin dengan JWT
- Verifikasi admin via tabel `admin_users`
- CRUD contacts
- List conversations dan detail messages
- Clear history conversation per contact
- Read/update bot settings
- Prompt tester dari dashboard
- Summary analytics
- Logs viewer
- Realtime status/message updates
- Memory percakapan 10 turn
- Mention-based trigger untuk membatasi kapan bot menjawab
- Rate limiting dan queue Gemini

### Out of Scope Saat Ini

- Multi-bot management
- Multi-tenant dashboard
- File/media understanding penuh
- Human handoff workflow yang benar-benar membuat ticket
- Moderation policies yang kompleks
- Scheduling/off-hours automation
- Role-based access control lebih dari satu jenis admin
- Export data dari dashboard

## 6. Functional Requirements

### FR-01 Authentication

- `POST /auth/login` menerima username dan password
- Server memverifikasi user terhadap tabel `admin_users`
- Password diverifikasi dengan bcrypt
- Login valid mengembalikan JWT
- Semua route selain login wajib auth

### FR-02 WhatsApp Bot Lifecycle

- Bot start otomatis saat server menyala
- Jika belum login, QR code tersedia dari endpoint status dan socket event
- Bot bisa direstart dari dashboard
- Bot auth bisa direset dari dashboard
- Bot auto reconnect ketika koneksi terputus, kecuali logout

### FR-03 Message Intake

- Pesan inbound teks dan caption dapat diproses
- Pesan dari akun sendiri diabaikan
- Newsletter diabaikan
- Bot hanya merespons jika aktif dan sesuai aturan mention/command

### FR-04 Intent Handling

- `/reset` atau frasa reset harus menghapus memory session
- `/reset` juga harus menghapus history conversation di database
- Frasa handoff harus menghasilkan balasan template

### FR-05 AI Reply Generation

- Reply dibangun dari system prompt + memory + pesan user
- Bot config aktif digunakan sebagai source of truth untuk persona
- History percakapan maksimal 10 turn dipakai sebagai context
- Output Gemini harus dibersihkan sebelum dikirim ke WhatsApp

### FR-06 Conversation and Contact Management

- Semua pesan inbound dan outbound harus tercatat
- Contact harus otomatis di-upsert dari message masuk
- Admin dapat membuat, mengubah, dan menghapus contact manual
- Admin dapat membuka detail percakapan per contact

### FR-07 Dashboard Monitoring

- Dashboard menampilkan status koneksi bot
- Dashboard menampilkan uptime
- Dashboard menampilkan total pesan hari ini
- Dashboard menampilkan queue size
- Dashboard menampilkan avg response time
- Dashboard menampilkan analytics summary
- Dashboard menampilkan log sistem

### FR-08 Config Management

- Admin dapat mengubah `bot_name`
- Admin dapat mengubah `system_prompt`
- Admin dapat mengubah `tone_style`
- Admin dapat toggle `is_active`
- Admin dapat toggle `ignore_groups`
- Admin dapat mencoba prompt test tanpa lewat WhatsApp

## 7. Non-Functional Requirements

### Performance

- Server harus cukup ringan untuk bot tunggal
- Dashboard harus bisa load data operasional inti dalam satu sesi admin biasa
- Queue Gemini membatasi request agar tidak meledak melewati free tier target aplikasi

### Reliability

- Data penting harus berada di Supabase, bukan hanya memory
- Restart server tidak boleh menghilangkan history messages
- Session memory boleh ephemeral karena dapat dihydrate ulang dari database

### Maintainability

- Monorepo memisahkan server, dashboard, dan shared types
- Shared contract berada di `packages/shared`
- Test server tersedia untuk area AI utility, API, dan auth state

### Security

- Gemini API key hanya di backend
- Dashboard auth menggunakan JWT
- Password admin disimpan dalam bentuk hash bcrypt
- Supabase diakses backend lewat service role key

## 8. Arsitektur Sistem

```text
Dashboard (React)
  -> REST API + Socket.IO

Server (Express)
  -> Auth layer
  -> Bot manager
  -> AI service
  -> Database adapter

Bot manager
  -> Baileys
  -> WhatsApp network

AI service
  -> Gemini queue
  -> Google Gemini API

Persistence
  -> Supabase PostgreSQL
```

## 9. Data Model

Entity yang ada saat ini:

- `contacts`
  - `whatsapp_jid`
  - `display_name`
  - `is_blocked`
  - `last_seen_at`
- `messages`
  - inbound/outbound
  - body
  - ai model
  - latency
- `bot_settings`
  - bot name
  - system prompt
  - active flag
  - ignore groups
  - tone style
- `system_logs`
- `admin_users`
- `whatsapp_auth_state`

View:

- `conversation_summaries`

## 10. API Surface

Base path saat ini: `/api/v1`

Endpoints:

- `POST /auth/login`
- `GET /status`
- `GET /contacts`
- `GET /contacts/:contactId`
- `POST /contacts`
- `PUT /contacts/:contactId`
- `DELETE /contacts/:contactId`
- `GET /conversations`
- `GET /conversations/:contactId`
- `DELETE /conversations/:contactId/history`
- `GET /config`
- `PUT /config`
- `POST /test-prompt`
- `GET /analytics/summary`
- `GET /logs`
- `POST /bot/restart`
- `POST /bot/reset-auth`

## 11. Current UX Requirements

Dashboard harus menyediakan:

- protected route setelah login
- sidebar untuk navigasi tetap
- topbar dengan restart, status, logout
- halaman dashboard ringkas
- halaman percakapan dengan split list/detail
- halaman contacts untuk CRUD penuh
- halaman konfigurasi dengan prompt tester
- halaman analytics
- halaman logs dengan filter dan search

## 12. Operational Constraints

- Untuk non-test mode, `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` wajib ada
- Bot bergantung pada koneksi WhatsApp via Baileys
- Balasan AI bergantung pada `GEMINI_API_KEY`
- Free tier Gemini dibatasi melalui queue internal 12 request/menit

## 13. Known Gaps Against Older Docs

Beberapa hal yang dulu direncanakan tapi tidak merepresentasikan repo saat ini:

- persona default satir “Bot Gila” sudah tidak akurat
- off-hours flow belum ada di kode
- safety settings Gemini eksplisit belum dipasang
- analytics belum sampai level engagement score kompleks
- dashboard belum punya fitur export/report
- handoff baru berupa template reply, belum workflow admin real

## 14. Success Criteria untuk Versi Saat Ini

Versi sekarang dianggap berhasil jika:

- admin bisa login ke dashboard
- bot bisa connect ke WhatsApp lewat QR
- pesan yang mention bot mendapat balasan
- history percakapan dan logs tersimpan
- config bot bisa diubah dari dashboard
- restart dan reset auth bisa dipicu dari dashboard

## 15. Next Likely Iterations

Kalau roadmap dilanjutkan, prioritas yang masuk akal berdasarkan struktur repo saat ini:

1. Rapikan prompt/persona agar konsisten antara helpful, romantic, dan tone presets.
2. Tambahkan pengaturan blocked contacts ke runtime bot, karena data sudah ada di dashboard/database.
3. Tambahkan analytics yang lebih real daripada label engagement.
4. Tambahkan admin management dan password change flow.
5. Tambahkan policy RLS yang lebih ketat dan eksplisit untuk semua tabel.
