# WhatsApp AI Bot

Monorepo untuk bot WhatsApp berbasis Google Gemini dengan dashboard admin realtime. Project ini menggabungkan bot engine Node.js, dashboard React, shared types, dan persistence di Supabase.

![Preview WhatsApp AI Bot](./Whatsapp%20Mockup.png)

## Apa Yang Ada di Project Ini

- Bot WhatsApp berbasis `@whiskeysockets/baileys`
- Balasan AI via Google Gemini dengan memory percakapan dan personal memory ringan
- Dashboard admin untuk monitoring bot, percakapan, konfigurasi, analytics, logs, groups, roles, dan users
- Realtime updates via Socket.IO
- Penyimpanan data di Supabase untuk contact, conversation scope, messages, bot settings, auth state, roles, users, dan logs
- Dukungan analisis gambar dasar untuk pesan image dengan caption

## Ringkasan Perilaku Bot

- Bot tidak membalas semua pesan. Secara default bot merespons jika nama bot disebut atau ada command seperti `/reset`.
- Untuk chat personal, memory percakapan berjalan per contact.
- Untuk chat grup, history tetap tersimpan per member scope, tetapi memory AI dibagi per grup.
- Bot mendukung command reset percakapan, reset personal memory, daftar command, dan handoff ke manusia.
- Output balasan dibersihkan dulu sebelum dikirim ke WhatsApp.

Detail perilaku runtime yang lebih lengkap ada di [AGENTS.md](/Volumes/Iqbal/websites/whatsapp-bot/AGENTS.md).

## Struktur Repo

```text
apps/
  dashboard/   Dashboard admin React + Vite
  server/      API, bot runtime, Gemini integration, Socket.IO
packages/
  shared/      Shared types untuk server dan dashboard
supabase/
  migrations/  Skema dan evolusi database
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

## Cara Kerja Singkat

1. Server menjalankan bot manager, API Express, dan Socket.IO.
2. Baileys membuka sesi WhatsApp dan menghasilkan QR jika auth belum ada.
3. Pesan masuk divalidasi, dicek apakah bot perlu merespons, lalu disimpan ke database.
4. Server membangun prompt dari config aktif, history, dan memory yang relevan.
5. Request ke Gemini masuk lewat queue rate-limited.
6. Output AI dibersihkan, dikirim ke WhatsApp, lalu dicatat sebagai outbound message.
7. Dashboard mengambil data via REST API dan menerima update realtime via socket.

## Fitur Dashboard

- `/login`
  Login berbasis user database dan permission.
- `/`
  Status bot, uptime, queue Gemini, pesan hari ini, analytics ringkas, dan QR WhatsApp.
- `/conversations`
  Daftar percakapan dan tampilan chat detail.
- `/contacts`
  CRUD contact.
- `/groups`
  Simpan dan rapikan metadata nama grup WhatsApp.
- `/config`
  Ubah `bot_name`, `system_prompt`, `tone_style`, `is_active`, `ignore_groups`, plus test prompt.
- `/analytics`
  Ringkasan metrik harian.
- `/logs`
  Monitoring log sistem.
- `/users`
  Kelola user dashboard.
- `/roles`
  Kelola role dan permission.

## API Yang Tersedia

Base path: `/api/v1`

Public:

- `POST /auth/login`

Protected:

- `GET /auth/me`
- `GET /status`
- `GET /contacts`
- `GET /contacts/:contactId`
- `POST /contacts`
- `PUT /contacts/:contactId`
- `DELETE /contacts/:contactId`
- `GET /groups`
- `POST /groups`
- `DELETE /groups/:groupJid`
- `GET /conversations`
- `GET /conversations/:contactId`
- `DELETE /conversations/:contactId/history`
- `GET /config`
- `PUT /config`
- `POST /test-prompt`
- `GET /analytics/summary`
- `GET /logs`
- `POST /maintenance/purge-operational-data`
- `POST /bot/restart`
- `POST /bot/reset-auth`
- `GET /roles`
- `POST /roles`
- `PUT /roles/:roleId`
- `DELETE /roles/:roleId`
- `GET /users`
- `POST /users`
- `PUT /users/:userId`
- `DELETE /users/:userId`

## Environment Variables

Contoh lengkap ada di [.env.example](/Volumes/Iqbal/websites/whatsapp-bot/.env.example:1).

Minimal yang perlu diisi untuk server non-test:

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

- `DASHBOARD_USERNAME` dan `DASHBOARD_PASSWORD` masih ada di `.env.example`, tetapi auth dashboard aktif sekarang memakai tabel `users`.
- Jika `GEMINI_API_KEY` kosong, request ke Gemini akan gagal.
- Jika `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY` kosong, server non-test akan gagal start.

## Setup Lokal

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan environment

```bash
cp .env.example .env
```

Lalu isi value yang dibutuhkan.

### 3. Jalankan seluruh migration Supabase

Urutan migration saat ini:

- [202606030001_initial_schema.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606030001_initial_schema.sql)
- [202606030002_create_admin_users_table.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606030002_create_admin_users_table.sql)
- [202606040001_add_whatsapp_auth_state.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606040001_add_whatsapp_auth_state.sql)
- [202606040002_add_contact_memories.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606040002_add_contact_memories.sql)
- [202606040003_create_whatsapp_groups.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606040003_create_whatsapp_groups.sql)
- [202606050001_split_contacts_and_conversation_scopes.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606050001_split_contacts_and_conversation_scopes.sql)
- [202606050002_create_roles_and_users.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606050002_create_roles_and_users.sql)
- [202606050003_seed_admin_full_access.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606050003_seed_admin_full_access.sql)
- [202606050004_add_message_timestamp.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606050004_add_message_timestamp.sql)
- [202606080001_add_message_reply_reference.sql](/Volumes/Iqbal/websites/whatsapp-bot/supabase/migrations/202606080001_add_message_reply_reference.sql)

### 4. Jalankan aplikasi

Server:

```bash
npm run dev:server
```

Dashboard:

```bash
npm run dev:dashboard
```

Atau dari root:

```bash
npm run dev
```

## Scripts Penting

```bash
npm run dev
npm run dev:server
npm run dev:dashboard
npm run build
npm run build:server
npm run build:dashboard
npm run build:shared
npm run test
npm run lint
```

## Database Singkat

Tabel yang paling penting:

- `contacts`
- `conversation_scopes`
- `messages`
- `contact_memories`
- `bot_settings`
- `whatsapp_groups`
- `users`
- `roles`
- `system_logs`
- `whatsapp_auth_state`

View:

- `conversation_summaries`

Catatan:

- `messages` sekarang menyimpan `message_timestamp` dan `reply_to_message_id`.
- `reply_to_message_id` dipakai dashboard untuk menampilkan quoted reply dengan acuan yang eksplisit, bukan menebak dari waktu.

## Testing

Test server yang tersedia saat ini mencakup:

- prompt builder
- input sanitizer
- output processor
- intent detector
- database
- conversation scope
- personal memory
- multimodal service
- media service
- API
- WhatsApp auth state

Jalankan:

```bash
npm run test
```

## Seed Login Awal

Jika seluruh migration terbaru dijalankan, user awal yang disediakan adalah:

- username: `admin`
- password: `Admin@123`

Password ini sebaiknya langsung diganti setelah setup awal.

## Hal Yang Perlu Diperhatikan

- Default persona bot saat ini adalah `Ikmal` dengan tone `helpful`, tetapi prompt helper yang aktif juga menyuntikkan nuansa romantis/manja.
- `ignore_groups` default di migration awal berbeda dengan default in-memory config; perilaku final mengikuti data di database.
- Safety settings Gemini saat ini tidak diisi eksplisit di client.
- Image tanpa caption belum diproses di alur analisis V1.
- Folder `dist`, `dev-dist`, dan artefak lokal lain mungkin sudah ada di workspace; fokus pengembangan tetap sebaiknya ke file sumber di `src/`.
