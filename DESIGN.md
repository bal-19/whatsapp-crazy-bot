# DESIGN.md
## UI/UX & Frontend Design Specification

**Proyek:** WhatsApp AI Bot — Dashboard
**Versi:** 1.0.0
**Tech:** React 18 + TypeScript + Tailwind CSS v3 + Vite
**Target:** Desktop-first, responsif hingga tablet

---

## Daftar Isi

1. [Design Principles](#1-design-principles)
2. [Design System](#2-design-system)
3. [Layout & Navigation Structure](#3-layout--navigation-structure)
4. [Halaman & Komponen](#4-halaman--komponen)
5. [Component Library](#5-component-library)
6. [State Management](#6-state-management)
7. [Real-time Updates](#7-real-time-updates)
8. [Struktur Project Frontend](#8-struktur-project-frontend)
9. [API Integration Layer](#9-api-integration-layer)
10. [Accessibility](#10-accessibility)
11. [Performance Guidelines](#11-performance-guidelines)
12. [Naming Conventions](#12-naming-conventions)

---

## 1. Design Principles

### Prinsip Utama

| Prinsip | Deskripsi | Contoh Implementasi |
|---------|-----------|---------------------|
| **Clarity First** | Data paling penting harus terlihat tanpa scroll | Status bot (Online/Offline) di header |
| **Calm Dashboard** | Tidak banyak animasi atau warna yang distraktif | Palet netral, highlight hanya untuk status kritis |
| **Actionable Data** | Setiap data yang ditampilkan harus punya aksi terkait | Pesan error → tombol "Restart Bot" di samping |
| **Progressive Disclosure** | Tampilkan info dasar dulu, detail di klik | List percakapan → klik untuk buka detail |
| **Consistent Feedback** | Setiap aksi user mendapat respons visual | Loading spinner, toast sukses/error |

---

## 2. Design System

### 2.1 Color Palette

```css
/* Tailwind CSS Custom Config — tailwind.config.ts */

/* Primary — WhatsApp Green (familiar, on-brand) */
--color-primary-50:  #f0fdf4;
--color-primary-100: #dcfce7;
--color-primary-500: #22c55e;  /* Main green */
--color-primary-600: #16a34a;  /* Hover */
--color-primary-700: #15803d;  /* Active */

/* Neutral — Slate (clean, readable) */
--color-neutral-50:  #f8fafc;  /* Background */
--color-neutral-100: #f1f5f9;  /* Card background */
--color-neutral-200: #e2e8f0;  /* Border */
--color-neutral-400: #94a3b8;  /* Placeholder text */
--color-neutral-600: #475569;  /* Secondary text */
--color-neutral-800: #1e293b;  /* Primary text */
--color-neutral-900: #0f172a;  /* Sidebar background */

/* Status Colors */
--color-success:  #22c55e;   /* Bot online, success */
--color-warning:  #f59e0b;   /* Queue penuh, warning */
--color-error:    #ef4444;   /* Bot offline, error */
--color-info:     #3b82f6;   /* Info, AI processing */
```

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

### 2.2 Typography

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Page Title | Inter | 24px / 1.5rem | 700 | Judul halaman |
| Section Title | Inter | 18px / 1.125rem | 600 | Judul section/card |
| Body | Inter | 14px / 0.875rem | 400 | Konten umum |
| Body Small | Inter | 12px / 0.75rem | 400 | Metadata, timestamp |
| Label | Inter | 12px / 0.75rem | 500 | Form label |
| Code/Number | JetBrains Mono | 13px / 0.8125rem | 400 | Nomor WA, log |
| Badge | Inter | 11px / 0.6875rem | 600 | Status badge |

### 2.3 Spacing (Tailwind Standard)

```
4px   = p-1   → Padding dalam badge, chip
8px   = p-2   → Padding elemen kecil (icon button)
12px  = p-3   → Padding default list item
16px  = p-4   → Padding default card/input
20px  = p-5   → Padding section dalam card
24px  = p-6   → Padding card besar
32px  = p-8   → Padding halaman/section utama
```

### 2.4 Border Radius

```
rounded-sm  → 4px   → Input, badge kecil
rounded     → 6px   → Button, dropdown
rounded-lg  → 8px   → Card
rounded-xl  → 12px  → Modal, drawer
rounded-full → 999px → Avatar, status dot
```

### 2.5 Shadows

```css
/* Card biasa */
.shadow-card { box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06); }

/* Card dengan hover/focus */
.shadow-card-hover { box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06); }

/* Modal/Overlay */
.shadow-modal { box-shadow: 0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.04); }
```

---

## 3. Layout & Navigation Structure

### App Shell (Layout Utama)

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR (64px)                                              │
│  [Logo] [Status Bot: ● Online]      [Settings] [Profile]   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  SIDEBAR     │  MAIN CONTENT                               │
│  (240px)     │                                              │
│              │  ┌──────────────────────────────────────┐   │
│  ○ Dashboard │  │  Page Content                        │   │
│  ○ Percakapan│  │                                      │   │
│  ○ Konfigurasi  │                                      │   │
│  ○ Analytics │  │                                      │   │
│  ○ Log System│  │                                      │   │
│              │  └──────────────────────────────────────┘   │
│  ─────────── │                                              │
│  ○ Panduan   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Navigasi Items

| Route | Icon | Label | Badge |
|-------|------|-------|-------|
| `/` | `LayoutDashboard` | Dashboard | — |
| `/conversations` | `MessageSquare` | Percakapan | Jumlah active |
| `/config` | `Settings2` | Konfigurasi | — |
| `/analytics` | `BarChart3` | Analytics | — |
| `/logs` | `Terminal` | Log Sistem | Error count |

---

## 4. Halaman & Komponen

### 4.1 Halaman Dashboard (`/`)

**Tujuan:** Snapshot cepat kondisi bot entertainment hari ini — mana yang trending funny.

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                  │
├───────────────┬───────────────┬───────────────┬────────────┤
│  Status Bot   │  Pesan Hari   │  Interactions │ Engagement │
│  ● ONLINE     │  Ini          │  Hari Ini     │ Score      │
│               │  142 pesan    │  38 replies   │  4.2 / 5   │
├───────────────┴───────────────┴───────────────┴────────────┤
│                                                             │
│  Percakapan Terbaru (Funniest First)   [Lihat Semua →]    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 😂 Budi Santoso  · 2 menit lalu                    │  │
│  │    "LOL bot gila banget 😂" [5 likes]               │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 🟡 Siti Rahayu   · 15 menit lalu                   │  │
│  │    "Itu roasting atau helpful?" [2 likes]           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Engagement Trend 7 Hari (Message Volume + Reactions)     │
│  [Chart Area — Show spike when bot sends funny replies]    │
└─────────────────────────────────────────────────────────────┘
```

**Komponen yang Dibutuhkan:**
- `<StatCard />` — 4 kartu metrik: Status, Pesan/Hari, Interactions, Engagement Score
- `<BotStatusBadge />` — Indikator status realtime (● Online)
- `<ConversationPreviewList />` — Daftar top 5 percakapan (sorted by engagement/funniness)
- `<EngagementChart />` — Recharts AreaChart 7 hari dengan spike indicators
- `<FunninessMeter />` — Optional: visual indicator of bot's "hit rate" hari ini

---

### 4.2 Halaman Percakapan (`/conversations`)

**Tujuan:** Review percakapan — mana yang paling entertaining, mana yang flop.

```
┌─────────────────────────────────────────────────────────────┐
│  Percakapan          [🔍 Cari nama]  [Sort: Latest ▾]      │
├────────────────────────┬────────────────────────────────────┤
│  LIST (1/3 lebar)      │  DETAIL (2/3 lebar)               │
│                        │                                    │
│  [Filter: Semua ▾]     │  Budi Santoso                     │
│  [Sort: Engagement ▾]  │  Engagement: 4.5/5 ⭐⭐⭐⭐      │
│                        │  ─────────────────────────────    │
│  ┌──────────────────┐  │                                    │
│  │ 😂 Budi Santoso  │  │  [Bubble: User] 10:28             │
│  │ 2 mnt lalu · +5  │  │  Pagi semua! Apa kabar?           │
│  ├──────────────────┤  │                                    │
│  │ 🟡 Siti Rahayu   │  │  [Bubble: Bot] 10:28 [😂 5]      │
│  │ 15 mnt lalu · +2 │  │  Pagi apaan? Jam 10 pagi!         │
│  ├──────────────────┤  │  Welcome ke klub orang tidur      │
│  │ 😐 Ahmad Fauzi   │  │  pagi. Membership: gratis!        │
│  │ 1 jam lalu · -1  │  │                                    │
│  └──────────────────┘  │  [Bubble: User] 10:30             │
│                        │  Hahaha!                           │
│                        │                                    │
│                        │  [Bubble: Bot] 10:30 [😂 1]      │
│                        │  Itu tawa asli atau pura2? 😏    │
└────────────────────────┴────────────────────────────────────┘
```

**Komponen yang Dibutuhkan:**
- `<ConversationList />` — List dengan search, filter by engagement level
- `<ConversationListItem />` — Item dengan engagement score (⭐⭐⭐), engagement delta (+5/-1)
- `<ChatWindow />` — Panel detail percakapan
- `<ChatBubble />` — Bubble dengan optional reaction counter (😂 5)
- `<ContactHeader />` — Header dengan nama, engagement score, avg response time

---

### 4.3 Halaman Konfigurasi (`/config`)

**Tujuan:** Admin dapat customize personality bot dan humor style tanpa coding.

```
┌─────────────────────────────────────────────────────────────┐
│  Konfigurasi Bot                                            │
├──────────────────────────────┬──────────────────────────────┤
│  PENGATURAN UMUM             │  PREVIEW RESPONS             │
│                              │                              │
│  Nama Bot                    │  ┌──────────────────────┐   │
│  [Bot Gila             ]     │  │ User: "pagi"         │   │
│                              │  │                       │   │
│  Status Bot                  │  │ Bot:                 │   │
│  [● Aktif    ○ Nonaktif]     │  │ "Pagi apaan? Jam     │   │
│                              │  │ 10 pagi? Lol.        │   │
│  Tone Style [Pedas ▾]        │  │ Selamat bergabung    │   │
│  ○ Pedas                     │  │ di klub orang tidur   │   │
│  ○ Wholesome                 │  │ pagi 😂"             │   │
│  ○ Absurd                    │  │                       │   │
│  ○ Custom                    │  │ [Test with diff input]   │
│                              │  └──────────────────────┘   │
├──────────────────────────────│                              │
│  SYSTEM PROMPT               │  [Refresh Preview]          │
│  (Or pick preset below)      │                              │
│                              │                              │
│  ┌──────────────────────┐    │                              │
│  │ Kamu adalah bot      │    │                              │
│  │ menghibur di grup.   │    │                              │
│  │ Personality:         │    │                              │
│  │ satir, smart-ass,    │    │                              │
│  │ [textarea 10 baris]  │    │                              │
│  └──────────────────────┘    │                              │
│  234 / 2000 karakter         │                              │
│                              │                              │
│  [Reset Default]  [Simpan ✓] │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Komponen yang Dibutuhkan:**
- `<ConfigForm />` — Form dengan validasi Zod
- `<SystemPromptEditor />` — Textarea dengan character counter
- `<ToneStyleSelector />` — Dropdown/Radio untuk preset tones
- `<ResponsePreview />` — Live preview respons dengan prompt aktif
- `<PromptTester />` — Input test → lihat preview instant
- `<ToggleSwitch />` — Toggle untuk settings boolean

---

### 4.4 Halaman Analytics (`/analytics`)

```
┌─────────────────────────────────────────────────────────────┐
│  Analytics                          [Filter: 7 Hari ▾]     │
├────────────────┬────────────────┬───────────────────────────┤
│  Total Interaksi│  Avg Engagement│  Error Rate              │
│  890 pesan      │  3.8 / 5 ⭐⭐⭐│  1.2%                   │
├────────────────┴────────────────┴───────────────────────────┤
│  Message Volume + Engagement Trend (7 Hari)                 │
│  [Combo Chart — Show peaks when bot hits]                  │
├──────────────────────────┬──────────────────────────────────┤
│  Peak Hours              │  Best Bot Moments This Week      │
│  [Heatmap Chart]         │  1. "LOL bot gila" — 12 reactions│
│                          │  2. "Bro itu roasting" — 8 likes │
│                          │  3. "Haha gw ketawa" — 5 likes   │
└──────────────────────────┴──────────────────────────────────┘
```

---

### 4.5 Halaman Log Sistem (`/logs`)

```
┌─────────────────────────────────────────────────────────────┐
│  Log Sistem      [Filter: All ▾]  [🔍 Cari]  [Auto-refresh: ●]│
├─────────────────────────────────────────────────────────────┤
│  [ERROR] 10:35:22 · gemini_error · Rate limit exceeded     │
│  [INFO]  10:35:20 · message_received · 6281234xxx           │
│  [WARN]  10:34:55 · queue_size_high · size=25              │
│  [INFO]  10:34:50 · bot_connected · WhatsApp online        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Component Library

### Komponen Atomik (Reusable)

```typescript
// src/components/ui/

// Badge status koneksi
interface StatusBadgeProps {
  status: 'connected' | 'disconnected' | 'connecting';
}
// Render: green dot + "Online" | red dot + "Offline" | yellow pulse + "Menghubungkan..."

// Stat card di dashboard
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  color?: 'default' | 'green' | 'red' | 'yellow';
}

// Toast notification
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // default 3000ms
}

// Konfirmasi dialog
interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

// Chat bubble
interface ChatBubbleProps {
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}
```

### Komponen Komposit

```typescript
// src/components/features/

// Panel sidebar item dengan tooltip
<SidebarItem href="/conversations" icon={MessageSquare} label="Percakapan" badge={5} />

// Header koneksi realtime
<BotStatusHeader status="connected" uptime="2j 15m" messageCount={142} />

// List item percakapan
<ConversationItem 
  contact={{ name: "Budi", phone: "6281234xxx" }}
  lastMessage="Terima kasih"
  lastMessageAt={new Date()}
  unreadCount={2}
  onClick={() => navigate(`/conversations/6281234xxx`)}
/>
```

---

## 6. State Management

### Struktur Store (Zustand)

```typescript
// src/stores/

// --- Bot Store ---
interface BotStore {
  status: 'connected' | 'disconnected' | 'connecting';
  uptimeSeconds: number;
  totalMessagesToday: number;
  setStatus: (status: BotStore['status']) => void;
  // Actions
  restartBot: () => Promise<void>;
}

// --- Config Store ---
interface ConfigStore {
  config: BotConfig | null;
  isDirty: boolean;
  isSaving: boolean;
  // Actions
  loadConfig: () => Promise<void>;
  updateField: (key: keyof BotConfig, value: any) => void;
  saveConfig: () => Promise<void>;
  resetToDefaults: () => void;
}

// --- Conversation Store ---
interface ConversationStore {
  conversations: ConversationSummary[];
  activeContactId: string | null;
  messages: Record<string, Message[]>;   // contactId → messages
  isLoadingList: boolean;
  isLoadingMessages: boolean;
  // Actions
  loadConversations: (page?: number) => Promise<void>;
  selectContact: (contactId: string) => void;
  loadMessages: (contactId: string) => Promise<void>;
}

// --- UI Store ---
interface UIStore {
  sidebarOpen: boolean;
  toasts: Toast[];
  toggleSidebar: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

### Penggunaan Store

```typescript
// Contoh di komponen
const { status, restartBot } = useBotStore();
const { conversations, selectContact } = useConversationStore();

// Hindari subscribe ke seluruh store — selalu destructure field spesifik
// ❌ const store = useBotStore()
// ✅ const { status } = useBotStore()
```

---

## 7. Real-time Updates

### Socket.io Events

```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 5,
});

// Server → Client Events
socket.on('bot:status_changed', (data: { status: BotStatus }) => {
  useBotStore.getState().setStatus(data.status);
});

socket.on('message:new', (data: { contactId: string; message: Message }) => {
  // Tambah pesan baru ke store tanpa reload
  useConversationStore.getState().appendMessage(data.contactId, data.message);
  // Update preview di list
  useConversationStore.getState().updateConversationPreview(data.contactId, data.message);
});

socket.on('analytics:update', (data: DashboardStats) => {
  useBotStore.getState().updateStats(data);
});
```

### Reconnect Strategy

```typescript
socket.on('connect_error', () => {
  useUIStore.getState().addToast({
    type: 'warning',
    message: 'Koneksi dashboard terputus, mencoba reconnect...'
  });
});

socket.on('connect', () => {
  useUIStore.getState().addToast({
    type: 'success',
    message: 'Terhubung kembali ke server'
  });
});
```

---

## 8. Struktur Project Frontend

```
apps/dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/                    # Atomic components
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ToggleSwitch.tsx
│   │   ├── features/              # Feature-specific components
│   │   │   ├── bot/
│   │   │   │   └── BotStatusHeader.tsx
│   │   │   ├── conversations/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   └── ConversationListItem.tsx
│   │   │   ├── config/
│   │   │   │   ├── ConfigForm.tsx
│   │   │   │   └── PromptTester.tsx
│   │   │   └── analytics/
│   │   │       ├── MessageVolumeChart.tsx
│   │   │       └── ResponseTimeChart.tsx
│   │   └── layout/
│   │       ├── AppShell.tsx       # Root layout dengan sidebar + topbar
│   │       ├── Sidebar.tsx
│   │       ├── SidebarItem.tsx
│   │       └── Topbar.tsx
│   ├── pages/                     # Route-level components
│   │   ├── DashboardPage.tsx
│   │   ├── ConversationsPage.tsx
│   │   ├── ConfigPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── LogsPage.tsx
│   ├── stores/                    # Zustand stores
│   │   ├── botStore.ts
│   │   ├── configStore.ts
│   │   ├── conversationStore.ts
│   │   └── uiStore.ts
│   ├── lib/
│   │   ├── api.ts                 # Axios instance + interceptors
│   │   ├── socket.ts              # Socket.io client
│   │   └── utils.ts               # Helper: formatDate, truncate, dll
│   ├── types/
│   │   ├── bot.ts
│   │   ├── conversation.ts
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useBotStatus.ts        # Hook untuk polling/socket status
│   │   └── useDebounce.ts
│   ├── App.tsx                    # Router setup
│   ├── main.tsx
│   └── index.css                  # Tailwind imports + custom CSS vars
├── index.html
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 9. API Integration Layer

### Axios Instance

```typescript
// src/lib/api.ts
import axios from 'axios';
import { useUIStore } from '../stores/uiStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — tambah auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle error global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Terjadi kesalahan';
    
    if (error.response?.status === 401) {
      // Redirect ke login
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    useUIStore.getState().addToast({ type: 'error', message });
    return Promise.reject(error);
  }
);
```

### API Service Layer

```typescript
// src/lib/services/conversationService.ts
export const conversationService = {
  getAll: (page = 1) =>
    api.get<ConversationsResponse>('/conversations', { params: { page } }),
  
  getById: (contactId: string) =>
    api.get<ConversationDetail>(`/conversations/${contactId}`),
  
  clearHistory: (contactId: string) =>
    api.delete(`/conversations/${contactId}/history`),
};

// src/lib/services/configService.ts
export const configService = {
  get: () => api.get<BotConfig>('/config'),
  update: (data: Partial<BotConfig>) => api.put('/config', data),
};

// src/lib/services/botService.ts
export const botService = {
  getStatus: () => api.get<BotStatus>('/status'),
  restart: () => api.post('/bot/restart'),
};
```

---

## 10. Accessibility

| Aspek | Requirement | Implementasi |
|-------|-------------|--------------|
| **Keyboard Nav** | Semua interaksi dapat dicapai dengan keyboard | `tabIndex`, `onKeyDown` pada custom elements |
| **Focus Ring** | Visible focus indicator | Tailwind `focus:ring-2 focus:ring-brand-500` |
| **ARIA Labels** | Icon buttons harus punya label | `aria-label="Tutup"` pada tombol X |
| **Color Contrast** | Minimal AA (4.5:1 untuk teks) | Netral-800 di atas Netral-50 = ✅ |
| **Loading States** | Spinner + `aria-busy` | `<div role="status" aria-busy={isLoading}>` |
| **Error Messages** | Error dikaitkan ke input | `aria-describedby="field-error"` |

---

## 11. Performance Guidelines

### Code Splitting
```typescript
// Semua halaman di-lazy load
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const ConversationsPage = lazy(() => import('./pages/ConversationsPage'));
const ConfigPage       = lazy(() => import('./pages/ConfigPage'));
```

### Virtualization (untuk daftar percakapan panjang)
```typescript
// Gunakan @tanstack/react-virtual jika list > 100 item
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Memoization
```typescript
// Gunakan memo untuk komponen yang sering dirender
export const ConversationListItem = memo(({ contact, lastMessage, onClick }: Props) => {
  // ...
});

// Gunakan useMemo untuk kalkulasi mahal
const sortedConversations = useMemo(
  () => conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()),
  [conversations]
);
```

### Debounce pada Search
```typescript
const debouncedSearch = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) loadConversations({ search: debouncedSearch });
}, [debouncedSearch]);
```

---

## 12. Naming Conventions

### File & Folder

| Jenis | Konvensi | Contoh |
|-------|----------|--------|
| React Component | PascalCase | `ChatBubble.tsx` |
| Hook | camelCase dengan prefix `use` | `useBotStatus.ts` |
| Store | camelCase + suffix `Store` | `botStore.ts` |
| Service | camelCase + suffix `Service` | `conversationService.ts` |
| Type/Interface | PascalCase | `BotConfig`, `ConversationDetail` |
| Constants | UPPER_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| CSS class custom | kebab-case | `.chat-bubble-inbound` |
| Event handler | camelCase dengan prefix `handle` | `handleSendMessage` |

### Component Props

```typescript
// Interface name = ComponentName + Props
interface ChatBubbleProps { ... }
interface StatCardProps { ... }

// Gunakan 'on' prefix untuk event callback props
interface ConversationListItemProps {
  onClick: () => void;     // ✅
  onLongPress: () => void; // ✅
  click: () => void;       // ❌
}
```

### Commit Message (Conventional Commits)
```
feat(conversations): tambah fitur search percakapan
fix(config): perbaiki validasi system prompt kosong
refactor(ai): ekstrak rate limiter ke module terpisah
docs(readme): update instruksi instalasi
chore(deps): update @google/generative-ai ke v0.21
test(ai): tambah unit test untuk output processor
```

---

*Dokumen ini harus diupdate setiap kali ada perubahan pada design system atau struktur komponen.*
