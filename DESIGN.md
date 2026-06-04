# DESIGN.md

## UI/UX dan Frontend Design Specification

Dokumen ini mendeskripsikan design dashboard yang benar-benar ada di repo saat ini. Fokusnya adalah struktur halaman, component behavior, state flow, dan visual system yang dipakai oleh `apps/dashboard`.

## 1. Gambaran Umum

Dashboard adalah aplikasi admin desktop-first untuk mengelola dan memantau bot WhatsApp. Implementasi frontend berada di:

- [apps/dashboard/src/App.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/App.tsx:1)
- [apps/dashboard/src/components/layout/AppShell.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/components/layout/AppShell.tsx:1)

Route yang tersedia:

- `/login`
- `/`
- `/conversations`
- `/contacts`
- `/config`
- `/analytics`
- `/logs`

## 2. Design Principles

Prinsip yang tercermin dari UI saat ini:

- Clarity first: status bot dan metrik inti langsung terlihat di dashboard
- Utility over decoration: layout sederhana, fokus ke data operasional
- Desktop-first admin workflow: sidebar tetap, topbar tetap, content area scrollable
- Realtime awareness: status bot, QR auth, pesan, dan analytics diperbarui berkala atau via socket
- Low-friction CRUD: halaman contacts dan config dibuat langsung-edit tanpa wizard

## 3. Visual System

Sumber style utama:

- [apps/dashboard/src/index.css](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/index.css:1)
- [apps/dashboard/tailwind.config.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/tailwind.config.ts:1)

### 3.1 Warna

Dashboard memakai palet terang dengan aksen hijau:

- Background utama: slate sangat terang
- Foreground utama: slate gelap
- Primary: hijau WhatsApp-ish
- Sidebar: slate sangat gelap
- State colors:
  - sukses/hidup: hijau
  - warning: amber
  - error: merah

CSS variables penting:

- `--background`
- `--foreground`
- `--primary`
- `--muted`
- `--border`
- `--ring`

### 3.2 Typography

Font yang dipakai sekarang:

- Sans: `Inter, system-ui, sans-serif`
- Mono: `JetBrains Mono, ui-monospace, monospace`

Penggunaan:

- Judul halaman: `text-2xl font-bold`
- Deskripsi halaman: `text-sm text-muted-foreground`
- Metadata/log/timestamp: `text-xs`

### 3.3 Radius dan Surface

- Card radius berbasis `--radius` default `0.5rem`
- Hampir semua panel utama menggunakan `Card`
- Border tipis dengan shadow ringan
- Gaya visual cenderung clean admin dashboard, bukan marketing page

## 4. Layout

Layout utama dibentuk oleh `AppShell`:

```text
Topbar (64px)
  - Brand
  - Uptime
  - Status badge
  - Restart button
  - Shortcut config
  - Logout

Main area
  - Sidebar kiri
  - Content pane kanan, scrollable
```

Referensi:

- [apps/dashboard/src/components/layout/Topbar.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/components/layout/Topbar.tsx:1)
- [apps/dashboard/src/components/layout/Sidebar.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/components/layout/Sidebar.tsx:1)

### 4.1 Sidebar

Item navigasi aktif:

- Dashboard
- Percakapan
- Contacts
- Konfigurasi
- Analytics
- Log Sistem

Perilaku:

- mode compact di layar kecil
- label teks hanya terlihat pada breakpoint besar
- active item memakai background slate lebih terang

### 4.2 Topbar

Topbar menampilkan:

- logo `WA`
- label aplikasi `WhatsApp AI Bot`
- uptime bot
- `StatusBadge`
- tombol restart bot
- tombol ke halaman konfigurasi
- tombol logout

## 5. Halaman dan Perilaku

## 5.1 Login

Halaman login dipakai untuk autentikasi admin berbasis JWT. Setelah token tersimpan di `localStorage`, user dapat mengakses layout terproteksi.

Gate proteksi ada di [apps/dashboard/src/App.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/App.tsx:1).

## 5.2 Dashboard

Referensi: [apps/dashboard/src/pages/DashboardPage.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/pages/DashboardPage.tsx:1)

Isi utama:

- empat stat card:
  - status bot
  - pesan hari ini
  - queue Gemini
  - avg response
- chart `Engagement Trend 7 Hari`
- preview 5 percakapan terbaru
- `WhatsAppQrCard` untuk QR login/reset auth

Catatan:

- chart saat ini memakai `MessageVolumeChart`
- label “Engagement” lebih ke naming UI; data yang tersedia tetap sederhana

## 5.3 Percakapan

Referensi: [apps/dashboard/src/pages/ConversationsPage.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/pages/ConversationsPage.tsx:1)

Struktur:

- kiri: `ConversationList`
- kanan: `ChatWindow`

Perilaku:

- daftar percakapan dimuat saat halaman dibuka
- detail chat dimuat ketika contact dipilih
- title panel detail menampilkan `contact_name` atau nomor telepon yang diekstrak dari JID

## 5.4 Contacts

Referensi: [apps/dashboard/src/pages/ContactsPage.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/pages/ContactsPage.tsx:1)

Halaman ini adalah CRUD penuh untuk tabel `contacts`.

Fitur:

- list contacts tersimpan
- pilih contact untuk edit
- buat contact baru
- edit JID, display name, blocked state, last seen
- hapus contact beserta history message terkait

Layout:

- panel kiri: daftar contact
- panel kanan: form detail

## 5.5 Konfigurasi

Referensi: [apps/dashboard/src/pages/ConfigPage.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/pages/ConfigPage.tsx:1)

Isi:

- `ConfigForm`
- `PromptTester`

Field config yang diharapkan sinkron dengan backend:

- `bot_name`
- `system_prompt`
- `is_active`
- `ignore_groups`
- `tone_style`

Tone style yang ada di UI dan API:

- `pedas`
- `wholesome`
- `absurd`
- `helpful`
- `custom`

## 5.6 Analytics

Referensi: [apps/dashboard/src/pages/AnalyticsPage.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/pages/AnalyticsPage.tsx:1)

Metrik utama:

- pesan hari ini
- kontak aktif
- avg response
- Gemini errors

Komponen visual:

- stat cards
- `MessageVolumeChart`

## 5.7 Logs

Referensi: [apps/dashboard/src/pages/LogsPage.tsx](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/pages/LogsPage.tsx:1)

Fitur:

- filter by level
- text search
- daftar event log dalam card list

Visual severity:

- `error` merah
- `warn` amber
- `info` biru

## 6. Component Inventory

Komponen reusable penting:

- `StatCard`
- `StatusBadge`
- `ChatBubble`
- `WhatsAppQrCard`
- `ConversationList`
- `ChatWindow`
- `ConfigForm`
- `PromptTester`

UI primitives berbasis Radix/shadcn-style tersedia di:

- [apps/dashboard/src/components/ui/index.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/components/ui/index.ts:1)

## 7. State Management

Dashboard memakai Zustand stores:

- `botStore`
- `conversationStore`
- `configStore`
- `logStore`
- `uiStore`

Lokasi:

- [apps/dashboard/src/stores](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/stores)

Pembagian tanggung jawab:

- `botStore`: status bot, analytics, restart, reset auth
- `conversationStore`: list conversation, active contact, messages
- `configStore`: load/save draft config, prompt test
- `logStore`: load/filter logs
- `uiStore`: toast state

## 8. Realtime Behavior

Socket client ada di [apps/dashboard/src/lib/socket.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/lib/socket.ts:1).

Realtime dipakai untuk:

- update status bot
- update pesan baru
- update analytics

Selain socket, `AppShell` juga mem-poll status setiap 30 detik untuk menjaga UI tetap sinkron.

## 9. API Integration

Layer API frontend ada di:

- [apps/dashboard/src/lib/api.ts](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/lib/api.ts:1)
- [apps/dashboard/src/lib/services](/Volumes/Iqbal/websites/whatsapp-bot/apps/dashboard/src/lib/services)

Service yang tersedia:

- `authService`
- `botService`
- `configService`
- `conversationService`
- `analyticsService`
- `logService`
- `contactService`

## 10. Responsive Behavior

Implementasi saat ini responsif untuk tablet dan desktop, dengan karakteristik:

- sidebar menjadi sangat sempit di layar kecil
- konten tetap bisa discroll vertikal
- beberapa grid turun menjadi 1 kolom pada viewport kecil

Namun dashboard tetap paling nyaman dipakai di layar laptop/desktop.

## 11. Accessibility dan UX Feedback

Pattern yang sudah dipakai:

- toast feedback untuk aksi penting
- `aria-label` pada tombol icon penting
- focus ring dari utility `.focus-ring`
- loading state di beberapa halaman seperti contacts

Masih ada ruang peningkatan untuk:

- empty states yang lebih konsisten di semua halaman
- keyboard shortcuts admin
- aksesibilitas form yang lebih ketat

## 12. Batas Dokumen Ini

Dokumen ini hanya mendeskripsikan UI yang sudah ada. Hal-hal berikut tidak boleh dianggap existing jika belum diimplementasikan:

- engagement score yang kompleks
- likes/reactions di percakapan
- moderation workflow
- multi-panel analytics canggih
- persona visual selector yang kaya

Kalau fitur-fitur itu nanti dibangun, baru tambahkan ke dokumen ini setelah komponennya benar-benar hadir di repo.
