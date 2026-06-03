# Product Requirements Document (PRD)
## WhatsApp AI Bot — Powered by Gemini AI

**Version:** 1.0.0
**Last Updated:** 2026-06-03
**Status:** Draft
**Author:** —
**Stakeholders:** Product, Engineering, QA

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Scope](#4-scope)
5. [User Personas](#5-user-personas)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture Overview](#8-system-architecture-overview)
9. [Tech Stack](#9-tech-stack)
10. [Data Model](#10-data-model)
11. [API Contracts](#11-api-contracts)
12. [Rate Limiting & Quotas](#12-rate-limiting--quotas)
13. [Error Handling Strategy](#13-error-handling-strategy)
14. [Security Requirements](#14-security-requirements)
15. [Milestones & Timeline](#15-milestones--timeline)
16. [Out of Scope](#16-out-of-scope)
17. [Open Questions](#17-open-questions)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

**WhatsApp AI Bot** adalah aplikasi yang memungkinkan bisnis dan individu untuk mengoperasikan asisten percakapan berbasis AI di platform WhatsApp. Bot ini menggunakan **Google Gemini API (Free Tier)** sebagai engine kecerdasan buatan dan dikelola melalui **dashboard web berbasis React (TSX)**.

Sistem dibangun di atas tiga lapisan utama:
- **Bot Engine** — Node.js + TypeScript, menggunakan Baileys untuk koneksi WhatsApp
- **AI Layer** — Google Gemini 1.5 Flash (Free Tier) untuk pemrosesan bahasa alami
- **Dashboard** — React TSX untuk monitoring, konfigurasi, dan analitik

---

## 2. Problem Statement

### Masalah yang Diselesaikan

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Grup WhatsApp sepi / kurang entertainment | Engagement turun, chat jadi boring |
| 2 | Butuh bot yang "real person" bukan customer service stiff | Bot generic terlalu formal |
| 3 | Tidak ada moderator AI untuk balance humor & respect | Chat bisa terlalu toxic atau silent |
| 4 | Solusi bot yang exist semuanya CS-focused, bukan fun-focused | Mau bot yang roasting, bukan helpful |

### Why Now
Gemini 1.5 Flash Free Tier sekarang accessible, jadi kita bisa bikin entertainment bot dengan personality tanpa biaya maintenance tinggi — perfect untuk grup kecil-menengah yang pengen spice up chat mereka.

---

## 3. Goals & Success Metrics

### Primary Goals
1. Bot dapat merespons pesan WhatsApp secara otomatis dengan personality yang satir & mengejek
2. Admin dapat mengkonfigurasi tone/persona bot tanpa coding (dari wholesome hingga pedas)
3. Sistem dapat berjalan stabil 24/7 di server production untuk entertain grup

### Success Metrics (KPIs)

| Metrik | Target | Cara Ukur |
|--------|--------|-----------|
| Response Time | < 5 detik per pesan | Timestamp log |
| Uptime Bot | ≥ 99% dalam 30 hari | Health check monitor |
| Entertainment Score | ≥ 3.5/5 (survey group) | Admin survey mingguan |
| Gemini API Error Rate | < 2% dari total request | Error log dashboard |
| Pesan Tertangani/Hari | ≥ 200 pesan | Dashboard analytics |

---

## 4. Scope

### In Scope (MVP — v1.0)
- [x] Koneksi WhatsApp via Baileys (scan QR)
- [x] Integrasi Gemini 1.5 Flash API dengan personality AI
- [x] Percakapan multi-turn (memory per sesi)
- [x] System prompt yang dapat dikonfigurasi via dashboard + Tone Selector (pedas/wholesome/absurd)
- [x] Dashboard web: monitor percakapan aktif + latest messages
- [x] Dashboard web: edit system prompt & personality style
- [x] Dashboard web: Test Prompt feature (preview bot response)
- [x] Dashboard web: statistik dasar (total pesan, pesan/hari, engagement metrics)
- [x] Auto-reconnect saat koneksi WA terputus
- [x] Logging semua percakapan ke Supabase PostgreSQL dengan skema terstruktur
- [x] Rate limiting untuk menghindari abuse Gemini Free Tier
- [x] Entertainment-focused error messages & reply templates

### In Scope (v1.1 — Post-MVP)
- [ ] Fitur "Roast Generator" — admin bisa trigger roast ke member specific
- [ ] Persona presets (Bot Gila, Bot Bijak, Bot Absurd, dll)
- [ ] Whitelist/blacklist topik atau trigger words
- [ ] Export funny moments (CSV) — collection of best bot replies
- [ ] Integration dengan media sharing (gif, sticker suggestions)

### Out of Scope
Lihat [Bagian 16](#16-out-of-scope).

---

## 5. User Personas

### Persona 1 — Grup Admin (Primary User)
> **"Gw pengen bot yang bisa kasih commentary lucu ke chat, bukan ngejawab pertanyaan customer boring."**

- **Siapa:** Admin grup WhatsApp, content creator, atau organizer event
- **Keahlian teknis:** Rendah–Menengah
- **Kebutuhan:**
  - Dashboard simple untuk setup bot personality/tone
  - Lihat real-time apa yang bot reply (tanpa need coding)
  - Customize joke style (pedas, wholesome, absurd, dll)
  - Monitor bot health (online/offline, error tracking)

### Persona 2 — Grup Members (End Users)
> **"Omg ada bot yang entertaining di grup! Bisa dijakin ribut dulu baru diem."**

- **Siapa:** Anggota grup yang expect entertainment, not CS
- **Ekspektasi:** 
  - Bot yang witty, bisa main banter
  - Replies yang smart-ass tapi tidak mean
  - Konsisten dengan personality yang dikasih
- **Tidak perlu tahu:** Backend gimana, cuma "bot funny/gak funny"

---

## 6. Functional Requirements

### FR-01: Koneksi WhatsApp

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01.1 | Sistem menampilkan QR code untuk login WhatsApp | Must Have |
| FR-01.2 | Sesi tersimpan agar tidak perlu scan ulang setelah restart | Must Have |
| FR-01.3 | Auto-reconnect dengan exponential backoff saat koneksi putus | Must Have |
| FR-01.4 | Status koneksi (Connected/Disconnected/Connecting) tampil di dashboard | Must Have |

### FR-02: Pemrosesan Pesan

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-02.1 | Bot menerima dan merespons pesan teks masuk | Must Have |
| FR-02.2 | Bot mengabaikan pesan yang dikirim dari akun sendiri (key.fromMe) | Must Have |
| FR-02.3 | Bot menampilkan "mengetik..." (composing) sebelum mengirim respons | Should Have |
| FR-02.4 | Pesan grup diabaikan secara default (bisa dikonfigurasi) | Must Have |
| FR-02.5 | Pesan gambar/media diterima; bot merespons dengan teks acknowledgment | Nice to Have |

### FR-03: Integrasi Gemini AI

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-03.1 | Setiap pesan dikirim ke Gemini API dengan konteks percakapan | Must Have |
| FR-03.2 | Konteks percakapan disimpan per nomor WA (max 20 pesan terakhir) | Must Have |
| FR-03.3 | System prompt global dapat diubah dari dashboard | Must Have |
| FR-03.4 | Jika Gemini error, bot mengirim pesan fallback ke user | Must Have |
| FR-03.5 | Gemini response diparse dan dibersihkan sebelum dikirim ke WA | Should Have |

### FR-04: Manajemen Percakapan

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-04.1 | Semua pesan masuk dan keluar dicatat ke database | Must Have |
| FR-04.2 | Percakapan dapat dilihat di dashboard (sorted by latest) | Must Have |
| FR-04.3 | History percakapan per kontak dapat dibuka detail | Should Have |
| FR-04.4 | Admin dapat menghapus history percakapan tertentu | Nice to Have |

### FR-05: Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05.1 | Dashboard menampilkan status koneksi bot secara realtime | Must Have |
| FR-05.2 | Dashboard menampilkan daftar percakapan aktif (who's talking, latest message) | Must Have |
| FR-05.3 | Form untuk mengedit System Prompt + Personality Style (dropdown: pedas/wholesome/absurd) | Must Have |
| FR-05.4 | Statistik: total pesan hari ini, avg response time, funniest interactions | Should Have |
| FR-05.5 | Tombol Test Prompt (input pertanyaan → lihat preview respons bot) | Should Have |
| FR-05.6 | Log aktivitas sistem (error, info, warning) — dapat disort by severity | Should Have |

### FR-06: Rate Limiting

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06.1 | Maksimum 12 request/menit ke Gemini API (buffer dari limit 15 RPM) | Must Have |
| FR-06.2 | Pesan yang masuk saat rate limit dicapai dimasukkan ke queue | Must Have |
| FR-06.3 | Queue diproses otomatis saat rate limit kembali normal | Must Have |

---

## 7. Non-Functional Requirements

### NFR-01: Performance
- Waktu respons bot ke pengguna: **< 5 detik** untuk 95% pesan
- Dashboard load time: **< 2 detik** pada koneksi broadband
- Concurrent conversations: mendukung hingga **50 percakapan aktif** simultan

### NFR-02: Reliability
- Uptime sistem: **≥ 99%** (downtime maksimal 7.2 jam/bulan)
- Auto-recovery dari crash: restart otomatis dalam **< 60 detik**
- Data percakapan tidak hilang saat server restart

### NFR-03: Scalability
- Arsitektur mendukung penambahan multiple bot instances di masa depan
- Persistence layer menggunakan Supabase PostgreSQL agar mendukung concurrent access, backup, dan growth tanpa single-file bottleneck

### NFR-04: Maintainability
- Code coverage minimal **60%** untuk unit test
- Semua fungsi kritis memiliki JSDoc/TSDoc
- Conventional commits untuk semua perubahan kode

### NFR-05: Security
- API key Gemini tidak pernah di-expose ke frontend
- Semua komunikasi backend menggunakan HTTPS
- Dashboard dilindungi dengan autentikasi sederhana (Basic Auth atau JWT)

---

## 8. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  WhatsApp User ──→  WhatsApp App  ──→  Baileys (WS)     │
└─────────────────────────────┬───────────────────────────┘
                               │ WebSocket
┌─────────────────────────────▼───────────────────────────┐
│                     BOT ENGINE LAYER                     │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  Message     │   │  Queue       │   │  Logger      │  │
│  │  Handler     │──▶│  Manager     │──▶│  Service     │  │
│  └──────┬──────┘   └──────┬───────┘   └──────────────┘  │
│         │                  │                              │
│  ┌──────▼──────┐   ┌──────▼───────┐                     │
│  │  Conversation│   │  Rate        │                     │
│  │  Manager     │   │  Limiter     │                     │
│  └──────┬──────┘   └──────────────┘                     │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                     AI LAYER                             │
│  ┌──────────────────────────────────────┐               │
│  │    Gemini Client Service              │               │
│  │    (google-generative-ai SDK)        │               │
│  └──────────────────────────────────────┘               │
│           │ HTTPS                                        │
│           ▼                                              │
│    Google Gemini 1.5 Flash API                          │
└─────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                      │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ Supabase Postgres    │  │  WA Auth State Storage   │ │
│  │ (messages, contacts, │  │  (filesystem/object      │ │
│  │ config, logs)        │  │   storage, encrypted)    │ │
│  └──────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                   DASHBOARD LAYER                        │
│  React + TypeScript (TSX)                               │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │ Chat     │  │ Config    │  │ Analytics          │   │
│  │ Monitor  │  │ Panel     │  │ Panel              │   │
│  └──────────┘  └───────────┘  └────────────────────┘   │
│                        │ REST API (Express)              │
└────────────────────────┴────────────────────────────────┘
```

---

## 9. Tech Stack

### Backend (Bot Engine)
| Komponen | Teknologi | Versi | Alasan |
|----------|-----------|-------|--------|
| Runtime | Node.js | ≥ 20 LTS | Long-term support, async native |
| Language | TypeScript | ^5.x | Type safety, developer experience |
| WA Library | @whiskeysockets/baileys | latest | Most maintained unofficial WA lib |
| AI SDK | @google/generative-ai | latest | Official Gemini SDK |
| HTTP Server | Express | ^4.x | Minimal, proven, luas ekosistem |
| Database | Supabase PostgreSQL | latest | Managed Postgres, scalable, backup-ready, REST/realtime capable |
| DB Client | @supabase/supabase-js | latest | Official Supabase client untuk query, auth, dan service-role workflows |
| Queue | p-queue | latest | Simple promise queue, lightweight |
| Env Config | dotenv | latest | Standard env management |
| Logging | pino | latest | Structured logging, performant |
| Process Mgr | PM2 | latest | Auto-restart, monitoring production |

### Frontend (Dashboard)
| Komponen | Teknologi | Versi | Alasan |
|----------|-----------|-------|--------|
| Framework | React | ^18 | Ekosistem luas, TSX native |
| Build Tool | Vite | ^5 | Fast HMR, modern bundler |
| Styling | Tailwind CSS | ^3 | Utility-first, cepat prototyping |
| State | Zustand | ^4 | Minimalist, tidak boilerplate |
| HTTP Client | axios | ^1.x | Familiar, interceptors mudah |
| Realtime | Socket.io-client | ^4 | Live updates dashboard |
| Charts | recharts | ^2 | React-native chart library |

---

## 10. Data Model

### Prinsip Desain Data
- Supabase menjadi source of truth untuk data aplikasi: contacts, messages, bot settings, dan system logs
- Gunakan UUID untuk primary key internal, bukan bergantung ke natural key WA saja
- Simpan `whatsapp_jid` sebagai kolom unik terpisah agar relasi tetap fleksibel
- Gunakan `timestamptz` untuk semua timestamp
- Simpan metadata semi-terstruktur di `jsonb`, bukan string JSON biasa
- Semua akses dari backend memakai service role key; frontend hanya lewat API backend atau view yang aman

### Tabel: `contacts`
```sql
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  whatsapp_jid text not null unique,
  display_name text,
  is_blocked boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_last_seen_at_idx on public.contacts (last_seen_at desc);
```

### Tabel: `messages`
```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  whatsapp_message_id text not null unique,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  status text not null default 'sent' check (status in ('queued', 'sent', 'delivered', 'read', 'failed')),
  ai_model text,
  tokens_used integer,
  latency_ms integer,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index messages_contact_id_created_at_idx
  on public.messages (contact_id, created_at desc);
create index messages_created_at_idx
  on public.messages (created_at desc);
```

### Tabel: `bot_settings`
```sql
create table public.bot_settings (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  system_prompt text not null,
  persona text not null,
  tone text not null default 'pedas' check (tone in ('pedas', 'wholesome', 'absurd')),
  is_active boolean not null default true,
  ignore_groups boolean not null default true,
  business_hours jsonb,
  updated_at timestamptz not null default now()
);
```

### Tabel: `system_logs`
```sql
create table public.system_logs (
  id bigint generated always as identity primary key,
  level text not null check (level in ('info', 'warn', 'error')),
  event text not null,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index system_logs_level_created_at_idx
  on public.system_logs (level, created_at desc);
```

### Tabel Opsional: `conversation_sessions`
Dipakai jika sesi percakapan ingin durable lintas restart atau lintas instance. Untuk MVP, history aktif tetap bisa di-cache di memory, lalu direkonstruksi dari `messages` saat cache miss.

```sql
create table public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  history jsonb not null default '[]'::jsonb,
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create unique index conversation_sessions_contact_id_idx
  on public.conversation_sessions (contact_id);
```

### Best Practices Supabase
- Aktifkan Row Level Security pada semua tabel; jika dashboard tidak mengakses Supabase langsung, tetap enable RLS dan batasi seluruh akses publik
- Backend server memakai `SUPABASE_SERVICE_ROLE_KEY`; jangan expose key ini ke browser
- Buat migration versioned untuk seluruh schema change, jangan edit schema manual di production
- Gunakan database indexes untuk query dashboard yang disort berdasarkan `created_at` dan `contact_id`
- Pisahkan data sensitif atau payload besar ke `jsonb` dan tambahkan retention policy untuk log
- Pertimbangkan Realtime Supabase hanya untuk dashboard event ringan; proses bot tetap event-driven dari backend

---

## 11. API Contracts

### Base URL: `http://localhost:3001/api/v1`

#### GET `/status`
Respons status bot saat ini.
```json
{
  "status": "connected" | "disconnected" | "connecting",
  "uptime_seconds": 3600,
  "total_messages_today": 142
}
```

#### GET `/conversations`
Daftar percakapan terbaru.
```json
{
  "data": [
    {
      "contact_id": "6281234567890@s.whatsapp.net",
      "contact_name": "Budi Santoso",
      "last_message": "Terima kasih",
      "last_message_at": "2025-06-03T10:30:00Z",
      "message_count": 12
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

#### GET `/conversations/:contactId`
Detail percakapan dengan history.
```json
{
  "contact": { "id": "...", "name": "Budi Santoso" },
  "messages": [
    {
      "id": "msg_001",
      "direction": "inbound",
      "body": "Halo, saya mau tanya...",
      "created_at": "2025-06-03T10:29:50Z"
    }
  ]
}
```

#### GET `/config`
Konfigurasi bot saat ini.
```json
{
  "system_prompt": "Kamu adalah...",
  "bot_name": "Asisten",
  "is_active": true,
  "ignore_groups": true
}
```

#### PUT `/config`
Update konfigurasi bot.
```json
// Request Body
{
  "system_prompt": "Kamu adalah...",
  "bot_name": "Asisten",
  "is_active": true
}
```

#### GET `/analytics/summary`
```json
{
  "messages_today": 142,
  "messages_this_week": 890,
  "active_contacts_today": 38,
  "avg_response_time_ms": 2300,
  "gemini_errors_today": 2
}
```

#### POST `/bot/restart`
Restart koneksi WhatsApp.

---

## 12. Rate Limiting & Quotas

### Gemini 1.5 Flash Free Tier Limits
| Limit | Nilai | Strategi |
|-------|-------|----------|
| Requests Per Minute (RPM) | 15 | Implementasi queue, max 12 RPM (buffer 20%) |
| Requests Per Day (RPD) | 1,500 | Monitor via counter harian, alert di 80% |
| Tokens Per Minute (TPM) | 1,000,000 | Batasi history ke 20 pesan, max 500 token/response |

### Implementasi Queue Strategy
```
Incoming Message → [In-Memory Queue] → Rate Limiter (12/min) → Gemini API
                         ↓
                  Jika queue > 50: reject dengan pesan "Sedang ramai, coba lagi"
```

---

## 13. Error Handling Strategy

| Skenario Error | Perilaku Sistem | Pesan ke User |
|----------------|-----------------|---------------|
| Gemini API timeout | Retry 1x setelah 2 detik | "Maaf, sedang ada gangguan. Coba lagi ya 🙏" |
| Gemini rate limit (429) | Masuk antrian, tunggu window berikutnya | "Satu saat ya, sedang sibuk 😊" |
| Gemini API error (5xx) | Log error, kirim fallback | "Maaf ada gangguan teknis, tim kami sedang memperbaiki" |
| WA koneksi terputus | Auto-reconnect dengan backoff (5s, 10s, 30s) | — (silent reconnect) |
| WA logged out | Stop bot, notifikasi di dashboard, butuh scan QR ulang | — |
| Database error / Supabase unavailable | Log, buffer sementara di memory queue, retry write dengan backoff | — |

---

## 14. Security Requirements

- **SEC-01:** API key Gemini hanya disimpan di `.env`, tidak pernah dikirim ke frontend
- **SEC-02:** Dashboard API dilindungi dengan JWT token (login dengan username/password)
- **SEC-03:** Kredensial disimpan di `.env` yang masuk ke `.gitignore`
- **SEC-04:** Input dari WhatsApp di-sanitize sebelum dikirim ke Gemini (strip HTML, batasi 2000 karakter)
- **SEC-05:** CORS dikonfigurasi hanya untuk origin dashboard yang diketahui
- **SEC-06:** Rate limiting pada endpoint API (max 100 req/min per IP)

---

## 15. Milestones & Timeline

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| **M1 — Foundation** | Project setup, Baileys connect, QR scan berjalan | Week 1 |
| **M2 — AI Integration** | Gemini terhubung, bot bisa balas pesan sederhana | Week 1-2 |
| **M3 — Core Features** | Memory, rate limiting, error handling, logging | Week 2-3 |
| **M4 — Dashboard MVP** | Dashboard basic: status, percakapan, config | Week 3-4 |
| **M5 — Polish & Deploy** | Testing, bug fix, deploy ke server/VPS | Week 4-5 |
| **M6 — Post-MVP** | Analytics, fitur tambahan v1.1 | Week 6+ |

---

## 16. Out of Scope

Hal-hal berikut **tidak termasuk** dalam v1.0:

- Customer service / business support (ini entertainment bot, bukan CS bot)
- Payment / transaction integration
- Multi-akun WhatsApp dalam satu instansi
- Moderation/ban system (sebaliknya, bot mendukung banter)
- Mobile app untuk dashboard (desktop-first)
- Fine-tuning custom LLM model
- Voice message AI responses
- Deployment otomatis (CI/CD pipeline)
- Integration dengan platform lain (Instagram, Telegram, Discord) — WhatsApp-only untuk v1.0

---

## 17. Open Questions

| # | Pertanyaan | Owner | Due |
|---|------------|-------|-----|
| 1 | Apakah bot perlu respond di group chats atau hanya 1-on-1? (Rekomendasi: yes, groups are fun) | Product | Sprint 1 |
| 2 | Berapa tone level maksimal "pedas"-nya? Apakah ada guardrail untuk prevent toxicity? | Product | Sprint 1 |
| 3 | Apakah perlu fitur "personality switching" per grup atau fixed per instance? | Product | Sprint 2 |
| 4 | Bagaimana strategi untuk prevent bot dari jadi creepy/inappropriate? | Engineering | Sprint 1 |
| 5 | Apakah perlu logging "funniest moments" untuk admin review? | Product | Sprint 2 |

---

## 18. Appendix

### Glossary
| Term | Definisi |
|------|----------|
| **Baileys** | Library Node.js unofficial untuk WhatsApp Web API |
| **Free Tier** | Paket gratis Gemini API: 15 RPM, 1.500 RPD |
| **RPM** | Requests Per Minute — jumlah panggilan API per menit |
| **System Prompt** | Instruksi awal yang mendefinisikan karakter dan perilaku bot |
| **Multi-turn** | Kemampuan bot mengingat konteks percakapan sebelumnya |
| **Rate Limiting** | Mekanisme pembatasan frekuensi request API |

### Referensi
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Gemini Free Tier Limits](https://ai.google.dev/pricing)
