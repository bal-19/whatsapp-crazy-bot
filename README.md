# WhatsApp AI Bot

Monorepo untuk bot WhatsApp berbasis Gemini dengan dashboard admin realtime. Project ini terdiri dari bot engine Node.js, dashboard React, package shared types, dan persistence di Supabase.

## Ringkasan

Fitur yang sudah ada di repo saat ini:

- Bot WhatsApp berbasis `@whiskeysockets/baileys`
- Balasan AI menggunakan Google Gemini dengan memory percakapan per kontak
- Trigger balasan berbasis mention nama bot atau command seperti `/reset`
- Dashboard admin dengan login JWT
- Monitoring status bot, uptime, queue Gemini, dan QR login WhatsApp
- Halaman percakapan, contacts, konfigurasi bot, analytics, dan log sistem
- Penyimpanan data ke Supabase: contacts, messages, bot settings, logs, admin users, dan WhatsApp auth state
- Realtime updates via Socket.IO

## Arsitektur Repo

```text
apps/
  dashboard/   React + Vite + Tailwind + Zustand
  server/      Express + Baileys + Gemini + Socket.IO
packages/
  shared/      Shared types untuk server dan dashboard
supabase/
  migrations/  Skema database
```

## Tech Stack

- Backend: Node.js, TypeScript, Express
- Frontend: React 18, Vite, Tailwind CSS, Zustand
- AI: `@google/generative-ai`
- WhatsApp: `@whiskeysockets/baileys`
- Database: Supabase PostgreSQL
- Auth: JWT + bcryptjs
- Realtime: Socket.IO
- Logging: Pino

## Flow Singkat

1. Server start lalu menginisialisasi bot manager dan Socket.IO.
2. Baileys membuka sesi WhatsApp, menampilkan QR jika auth belum ada.
3. Pesan masuk divalidasi, dicek apakah bot perlu merespons, lalu disimpan ke database.
4. `generateBotReply()` membangun system prompt dari config aktif, memuat history kontak, lalu memanggil Gemini lewat queue rate-limited.
5. Balasan dibersihkan untuk format WhatsApp, dikirim ke user, lalu disimpan sebagai outbound message.
6. Dashboard mengambil data via REST API dan menerima update status/message via socket.

## Fitur Backend

- Login admin lewat `admin_users` di database
- CRUD contacts
- List dan detail conversations
- Clear history percakapan per contact
- Read/update bot config
- Prompt tester dari dashboard
- Analytics summary
- System logs
- Restart bot
- Reset auth WhatsApp dan generate QR baru

## Fitur Dashboard

- `/login`
- `/`
  Menampilkan status bot, pesan hari ini, queue Gemini, avg response time, chart volume pesan, preview percakapan terbaru, dan kartu QR WhatsApp
- `/conversations`
  Menampilkan daftar percakapan dan detail chat window
- `/contacts`
  CRUD manual untuk tabel contacts
- `/config`
  Edit `bot_name`, `system_prompt`, `tone_style`, `is_active`, `ignore_groups`, plus prompt tester
- `/analytics`
  Ringkasan metrik harian
- `/logs`
  Filter log berdasarkan level dan pencarian teks

## Persona Bot Saat Ini

Implementasi saat ini tidak lagi memakai default "Bot Gila" satir seperti dokumen lama. Default config di kode menggunakan:

- `bot_name`: `Ikmal`
- `tone_style`: `helpful`
- persona dasar: asisten helpful dengan gaya Gen Z

Selain itu, `buildSystemPrompt()` saat ini juga menyuntikkan instruksi gaya bicara romantis/manja. Jadi kalau ingin perilaku lain, ubah dari dashboard atau ubah implementasi prompt builder di server.

## Environment Variables

Contoh ada di [.env.example](/Volumes/Iqbal/websites/whatsapp-bot/.env.example:1).

Yang wajib untuk menjalankan server non-test:

```env
NODE_ENV=development
PORT=3001
DASHBOARD_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash-latest

JWT_SECRET=change_me_to_a_long_random_secret

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_SCHEMA=public

WA_AUTH_DIR=./whatsapp-auth
WA_QR_TIMEOUT_MS=120000
```

Catatan:

- `DASHBOARD_USERNAME` dan `DASHBOARD_PASSWORD` masih ada di `.env.example`, tapi auth dashboard yang aktif sekarang memakai tabel `admin_users`.
- Jika `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` kosong, server non-test akan gagal start.

## Setup

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan environment

```bash
cp .env.example .env
```

Lalu isi semua value yang dibutuhkan.

### 3. Jalankan migrasi Supabase

Urutan migrasi yang ada:

- [supabase/migrations/202606030001_initial_schema.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606030001_initial_schema.sql:1)
- [supabase/migrations/202606030002_create_admin_users_table.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606030002_create_admin_users_table.sql:1)
- [supabase/migrations/202606040001_add_whatsapp_auth_state.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606040001_add_whatsapp_auth_state.sql:1)

### 4. Jalankan server dan dashboard

Server:

```bash
npm run dev:server
```

Dashboard:

```bash
npm run dev:dashboard
```

Atau jalankan server dari root:

```bash
npm run dev
```

## Scripts

Root:

```bash
npm run dev
npm run dev:server
npm run dev:dashboard
npm run build
npm run build:server
npm run build:dashboard
npm run test
npm run lint
```

## API Ringkas

Base path: `/api/v1`

Public:

- `POST /auth/login`

Protected:

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

## Database

Tabel utama:

- `contacts`
- `messages`
- `bot_settings`
- `system_logs`
- `admin_users`
- `whatsapp_auth_state`

View:

- `conversation_summaries`

## Testing

Test server yang ada saat ini mencakup:

- prompt builder
- input sanitizer
- output processor
- intent detector
- API
- WhatsApp auth state

Jalankan:

```bash
npm run test
```

## Hal Yang Perlu Diperhatikan

- Bot hanya merespons jika nama bot disebut, atau ada command khusus seperti `/reset`.
- `ignore_groups` default database migration awal adalah `true`, tetapi default in-memory config di kode adalah `false`; perilaku final mengikuti data yang tersimpan.
- Safety settings Gemini saat ini kosong di implementasi client, jadi pembatasan konten lebih banyak bergantung pada prompt dan error handling aplikasi.
- Auth dashboard default dibuat lewat migrasi: username `admin`, password `admin123`. Ganti segera setelah setup awal.
