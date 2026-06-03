# WhatsApp AI Bot 🤖

An entertainment-focused AI chatbot for WhatsApp groups powered by Google Gemini, featuring an admin dashboard for real-time monitoring and configuration.

**Status:** ✅ Development Ready | 📊 Full Analytics | 🔧 Customizable Personas

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Prerequisites](#-prerequisites)
5. [Installation](#-installation)
6. [Environment Setup](#-environment-setup)
7. [Database Setup (Supabase)](#-database-setup-supabase)
8. [Running the Project](#-running-the-project)
9. [Project Structure](#-project-structure)
10. [API Documentation](#-api-documentation)
11. [Deployment](#-deployment)
12. [Troubleshooting](#-troubleshooting)
13. [Contributing](#-contributing)

---

## 🎯 Overview

**WhatsApp AI Bot** is a full-stack application that brings AI-powered entertainment to WhatsApp groups. The bot automatically responds to group messages with a satirical, witty personality ("Bot Gila" style), while an admin dashboard provides real-time monitoring, analytics, and customization.

### Key Capabilities:

- **AI-Powered Responses:** Google Gemini 1.5 Flash with multi-turn conversation memory
- **Customizable Personas:** Switch between tone styles (spicy, wholesome, absurd, helpful, custom)
- **Admin Dashboard:** Monitor conversations, view analytics, edit bot configuration
- **Real-time Updates:** WebSocket integration for live status and message feeds
- **Rate Limiting:** Optimized for Gemini Free Tier (12 requests/minute, 1500/day)
- **Conversation Memory:** Maintains context from last 10 conversation turns
- **Full Analytics:** Track message volume, response times, top contacts

---

## ✨ Features

### Backend Features

- ✅ WhatsApp integration via Baileys (unofficial client)
- ✅ Multi-turn AI conversations with memory management
- ✅ Intent detection (reset, handoff, off-hours)
- ✅ Input sanitization and prompt injection prevention
- ✅ Output formatting optimized for WhatsApp
- ✅ Rate limiting and quota management
- ✅ Structured logging with Pino
- ✅ REST API with JWT authentication
- ✅ Real-time WebSocket updates

### Frontend Features

- ✅ Admin login dashboard
- ✅ Bot configuration editor
- ✅ Live conversation browser
- ✅ Message analytics and charts
- ✅ System logs viewer
- ✅ Real-time bot status indicator
- ✅ Responsive Tailwind CSS design

### Security Features

- ✅ **Database-backed admin authentication** — Passwords stored with bcrypt hashing (not in `.env`)
- ✅ **JWT token-based API authentication** — 12-hour token expiry
- ✅ **Row Level Security (RLS)** — Supabase database row-level access control
- ✅ **Service role-based backend access** — Dashboard cannot directly access sensitive tables
- ✅ **Input sanitization** — Prompt injection prevention and XSS protection
- ✅ **Rate limiting** — Protects against API abuse and token quota overflow

---

## 🛠️ Tech Stack

| Layer             | Technology                                  |
| ----------------- | ------------------------------------------- |
| **Backend**       | Node.js + TypeScript + Express.js           |
| **Frontend**      | React 18 + TypeScript + Vite + Tailwind CSS |
| **AI Engine**     | Google Gemini 1.5 Flash API                 |
| **WhatsApp**      | @whiskeysockets/baileys (unofficial)        |
| **Database**      | Supabase (PostgreSQL)                       |
| **Real-time**     | Socket.IO v4                                |
| **Auth**          | JWT + bcryptjs                              |
| **State**         | Zustand (React)                             |
| **Logging**       | Pino                                        |
| **UI Components** | Radix UI + Lucide Icons                     |
| **Charts**        | Recharts                                    |

---

## 📦 Prerequisites

Before installation, ensure you have:

- **Node.js** ≥ 18.0.0 ([download](https://nodejs.org/))
- **npm** ≥ 9.0.0 (comes with Node.js)
- **Git** ([download](https://git-scm.com/))
- **Supabase Account** ([create free](https://supabase.com))
- **Google Gemini API Key** ([get free key](https://aistudio.google.com/app/apikey))

### Verify Installation:

```bash
node --version     # Should be ≥ v18.0.0
npm --version      # Should be ≥ 9.0.0
git --version      # Should display version
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/bal-19/whatsapp-crazy-bot.git
cd whatsapp-crazy-bot
```

### Step 2: Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Dependencies are auto-installed for apps/ and packages/ workspaces
```

### Step 3: Verify Installation

```bash
# Check TypeScript compilation
npm run lint

# Should show no errors and complete successfully
```

---

## ⚙️ Environment Setup

### Step 1: Create `.env` File

Create a `.env` file in the project root:

```bash
cp .env.example .env    # If example exists, or create manually
```

### Step 2: Configure Environment Variables

Edit `.env` with your credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
DASHBOARD_ORIGIN=http://localhost:5173

# ========================================
# AI & API Keys (Required)
# ========================================

# Google Gemini API
# Get free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.1-flash-lite

# ========================================
# Authentication (JWT Secret)
# ========================================

# JWT Secret: Change to long random string in production!
# Use: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-CHANGEME

# ========================================
# Supabase (Database)
# ========================================

# Get these from: https://app.supabase.com → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
SUPABASE_DB_SCHEMA=public

# ========================================
# WhatsApp Configuration
# ========================================

# Directory to store WhatsApp session credentials
WA_AUTH_DIR=./whatsapp-auth
```

### Step 3: Validate Environment

```bash
npm run lint

# Should show no config errors
```

#### ⚠️ Important: Admin Authentication is Database-Backed

Dashboard login credentials are now stored in the `admin_users` table (not in `.env`).

- **Default username:** `admin`
- **Default password:** `admin123`
- **Password is hashed with bcrypt** for security

> ⚠️ **Security Warning:** After first login, you MUST change the default password via the dashboard or by updating it in the database!

---

## 📊 Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in project details:
    - **Name:** `whatsapp-bot` (or your preference)
    - **Database Password:** Use strong password
    - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get API Credentials

1. Once project is created, go to **Settings → API**
2. Copy these values to your `.env`:
    - **Project URL** → `SUPABASE_URL`
    - **Service Role Secret** → `SUPABASE_SERVICE_ROLE_KEY`
3. Save `.env` file

```bash
# Example credentials (replace with yours)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Apply Database Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally (if not already installed)
npm install -g @supabase/cli

# Link your local project to Supabase
supabase link --project-ref your-project-id

# Push migrations to your database
supabase db push

# Verify tables were created
supabase db tables list
```

#### Option B: Using Supabase SQL Editor (No CLI)

1. Go to **Supabase Dashboard → SQL Editor**
2. Click **"New Query"**
3. **First**, run the initial schema migration:
    - Open [supabase/migrations/202606030001_initial_schema.sql](supabase/migrations/202606030001_initial_schema.sql)
    - Copy the entire SQL content
    - Paste into SQL Editor
    - Click **"Run"**
4. **Then**, run the admin users migration:
    - Open [supabase/migrations/202606030002_create_admin_users_table.sql](supabase/migrations/202606030002_create_admin_users_table.sql)
    - Copy the entire SQL content
    - Paste into SQL Editor
    - Click **"Run"**
5. Tables created: ✅ `contacts`, `messages`, `bot_settings`, `system_logs`, **`admin_users`**

### Step 4: Verify Database Setup

```bash
# Start the server (it will validate the database connection)
npm run dev:server

# You should see in logs:
# ✓ Supabase connected
# ✓ Tables verified: contacts, messages, bot_settings, system_logs, admin_users
```

### Step 5: Set Up Admin User

The default admin user is automatically created by the migration script:

- **Username:** `admin`
- **Password:** `admin123` (bcrypt hashed)

#### Change Admin Password (Recommended)

You have two options:

**Option A: Via Database (Supabase Console)**

1. Go to **Supabase Dashboard → SQL Editor**
2. Run this SQL to update the password:

```sql
-- Generate new bcrypt hash for password "your-new-password"
-- Use online tool: https://bcrypt-generator.com/
-- Or run: npm run hash-password "your-password"

UPDATE admin_users
SET password_hash = '$2a$10$YOUR_BCRYPT_HASH_HERE'
WHERE username = 'admin';
```

**Option B: Create a Utility Script**

Create `apps/server/hash-password.js`:

```javascript
#!/usr/bin/env node
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
    console.log('Usage: node hash-password.js "your-password"');
    process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
    console.log("Bcrypt hash:", hash);
    console.log("\nUpdate admin user with:");
    console.log(
        `UPDATE admin_users SET password_hash = '${hash}' WHERE username = 'admin';`,
    );
});
```

Run it:

```bash
node apps/server/hash-password.js "your-secure-password"
```

#### Create Additional Admin Users

Use the admin service to create new users:

```bash
# Option 1: Via API (after login)
curl -X POST http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin2",
    "password": "secure-password",
    "email": "admin2@example.com"
  }'

# Option 2: Direct database insert
# Use the hash-password script above to generate bcrypt hash first
INSERT INTO admin_users (username, password_hash, email)
VALUES ('admin2', '$2a$10$HASH_HERE', 'admin2@example.com');
```

---

## 🏃 Running the Project

### Option 1: Development Mode (Recommended)

Run both server and dashboard simultaneously:

```bash
# Terminal 1: Start backend server (http://localhost:3001)
npm run dev:server

# Terminal 2: Start frontend dashboard (http://localhost:5173)
npm run dev:dashboard
```

Expected output:

```
Server:
✓ Express listening on http://localhost:3001
✓ Supabase connected
✓ WhatsApp bot ready (scan QR code below)
┌─────────────────────────────────────┐
│   Scan this QR with WhatsApp app    │
└─────────────────────────────────────┘
[QR Code will appear in terminal]

Dashboard:
✓ Vite dev server running at http://localhost:5173
✓ Ready in 245ms
```

### Option 2: Scan WhatsApp QR Code

When the server starts for the first time:

1. A QR code will appear in the terminal
2. Open WhatsApp on your phone
3. Go to **Settings → Linked Devices → Link a Device**
4. Scan the QR code with your phone camera
5. Wait for "Connected" confirmation in terminal
6. Bot is now active!

### Option 3: Access the Dashboard

1. Open browser: **http://localhost:5173**
2. Login with default credentials:
    - **Username:** `admin`
    - **Password:** `admin123`
3. ⚠️ **After first login, change this password immediately!** (See [Database Setup - Change Admin Password](#change-admin-password-recommended) section)
4. You should see:
    - Bot status (Connected/Disconnected)
    - Recent messages
    - Analytics charts
    - Configuration editor

---

## 📁 Project Structure

```
whatsapp-bot/
├── apps/
│   ├── server/                      # Backend Bot Engine
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── ai/                 # AI Service Layer
│   │   │   │   ├── ai-service.ts
│   │   │   │   ├── gemini-client.ts
│   │   │   │   ├── conversation-memory.ts
│   │   │   │   ├── input-sanitizer.ts
│   │   │   │   ├── intent-detector.ts
│   │   │   │   ├── output-processor.ts
│   │   │   │   ├── prompt-builder.ts
│   │   │   │   ├── rate-limiter.ts
│   │   │   │   └── error-messages.ts
│   │   │   ├── api/                # REST API
│   │   │   │   ├── app.ts
│   │   │   │   └── routes.ts
│   │   │   ├── auth/               # JWT Authentication
│   │   │   ├── bot/                # WhatsApp Bot Logic
│   │   │   ├── config/             # Environment Config
│   │   │   ├── db/                 # Database Layer
│   │   │   ├── logging/            # Structured Logging
│   │   │   ├── realtime/           # WebSocket (Socket.IO)
│   │   │   └── types/              # TypeScript Types
│   │   ├── whatsapp-auth/          # WhatsApp Session (auto-generated)
│   │   └── package.json
│   │
│   └── dashboard/                  # Frontend Dashboard (React)
│       ├── src/
│       │   ├── components/
│       │   │   ├── features/       # Page-specific components
│       │   │   ├── layout/         # Layout components
│       │   │   └── ui/             # Radix UI wrappers
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── ConfigPage.tsx
│       │   │   ├── ConversationsPage.tsx
│       │   │   ├── AnalyticsPage.tsx
│       │   │   └── LogsPage.tsx
│       │   ├── stores/             # Zustand state management
│       │   ├── lib/                # Utilities and services
│       │   ├── types/              # TypeScript types
│       │   └── main.tsx
│       └── package.json
│
├── packages/
│   └── shared/                     # Shared Types & Utils
│       └── src/index.ts
│
├── supabase/
│   └── migrations/
│       └── 202606030001_initial_schema.sql
│
├── .env                            # Environment variables (create this)
├── package.json                    # Root workspace config
├── tsconfig.base.json
├── AGENTS.md                       # AI Behavior Guide
├── PRD.md                          # Product Requirements
├── DESIGN.md                       # UI/UX Specification
└── README.md                       # This file
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:3001/api/v1
```

### Authentication

All routes except `/auth/login` and `/health` require:

```
Authorization: Bearer <jwt_token>
```

### Public Routes

#### Health Check

```http
GET /health
```

**Response:** `200 OK`

```json
{ "status": "ok" }
```

### Auth Routes

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:** `200 OK`

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 43200
}
```

### Protected Routes

#### Get Bot Status

```http
GET /api/v1/status
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
    "status": "connected",
    "uptime": 3600000,
    "messagestoday": 42,
    "queuesize": 0,
    "lastmessageat": "2024-06-03T10:30:00Z"
}
```

#### List Conversations

```http
GET /api/v1/conversations?page=1&limit=20
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
[
    {
        "contactid": "6281234567890@s.whatsapp.net",
        "displayname": "John Doe",
        "lastmessage": "Halo bot!",
        "messagecount": 15,
        "lastmessageat": "2024-06-03T10:30:00Z"
    }
]
```

#### Get Conversation Details

```http
GET /api/v1/conversations/:contactId
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
    "contact": {
        "id": "uuid",
        "whatsappjid": "6281234567890@s.whatsapp.net",
        "displayname": "John Doe"
    },
    "messages": [
        {
            "id": "uuid",
            "direction": "inbound",
            "body": "Halo bot!",
            "createdat": "2024-06-03T10:30:00Z"
        }
    ]
}
```

#### Get Bot Configuration

```http
GET /api/v1/config
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
    "botname": "Bot Gila",
    "systemprompt": "Kamu adalah bot yang satir...",
    "isactive": true,
    "ignoregroups": false,
    "tonestyle": "pedas"
}
```

#### Update Bot Configuration

```http
PUT /api/v1/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "botname": "Bot Gila Baru",
  "systemprompt": "Updated prompt...",
  "tonestyle": "wholesome"
}
```

**Response:** `200 OK`

```json
{
  "message": "Configuration updated successfully",
  "config": { ... }
}
```

#### Test Prompt (Dry Run)

```http
POST /api/v1/test-prompt
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Halo bot, apa kabar?",
  "config": {
    "botname": "Bot Gila",
    "tonestyle": "pedas"
  }
}
```

**Response:** `200 OK`

```json
{
    "input": "Halo bot, apa kabar?",
    "response": "Baik aja, lu gimana?",
    "latencyms": 1850,
    "tokensused": 124
}
```

#### Get Analytics Summary

```http
GET /api/v1/analytics/summary
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
    "totalcontacts": 45,
    "totalmessages": 1243,
    "messagesperhour": 52,
    "avgresponsetimems": 1850,
    "toptopics": ["greeting", "joke", "random"]
}
```

#### View System Logs

```http
GET /api/v1/logs?level=error&limit=50
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
[
    {
        "id": 1,
        "level": "error",
        "event": "gemini_error",
        "message": "Rate limit exceeded",
        "meta": { "code": 429 },
        "createdat": "2024-06-03T10:30:00Z"
    }
]
```

#### Clear Conversation History

```http
DELETE /api/v1/conversations/:contactId/history
Authorization: Bearer <token>
```

**Response:** `204 No Content`

#### Restart WhatsApp Connection

```http
POST /api/v1/bot/restart
Authorization: Bearer <token>
```

**Response:** `202 Accepted`

```json
{
    "message": "Bot restart initiated. Please scan QR code in terminal."
}
```

### Admin User Management Routes

#### List All Admin Users

```http
GET /api/v1/admin/users
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
[
    {
        "id": "uuid",
        "username": "admin",
        "email": "admin@example.com",
        "is_active": true,
        "last_login_at": "2024-06-03T10:30:00Z",
        "created_at": "2024-06-03T09:00:00Z",
        "updated_at": "2024-06-03T10:30:00Z"
    }
]
```

#### Create New Admin User

```http
POST /api/v1/admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "admin2",
  "password": "secure-password",
  "email": "admin2@example.com"
}
```

**Response:** `201 Created`

```json
{
    "id": "uuid",
    "username": "admin2",
    "email": "admin2@example.com",
    "is_active": true,
    "created_at": "2024-06-03T10:30:00Z"
}
```

#### Update Admin User Password

```http
PUT /api/v1/admin/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "new-secure-password",
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`

```json
{
    "id": "uuid",
    "username": "admin",
    "email": "newemail@example.com",
    "is_active": true,
    "updated_at": "2024-06-03T10:35:00Z"
}
```

#### Disable/Enable Admin User

```http
PUT /api/v1/admin/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_active": false
}
```

**Response:** `200 OK`

```json
{
    "id": "uuid",
    "username": "admin2",
    "is_active": false,
    "updated_at": "2024-06-03T10:40:00Z"
}
```

#### Delete Admin User

```http
DELETE /api/v1/admin/users/:userId
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## 🌐 Deployment

### Option 1: Heroku Deployment

#### Prerequisites

- Heroku CLI ([download](https://devcenter.heroku.com/articles/heroku-cli))
- Heroku account ([create free](https://www.heroku.com/))

#### Steps

1. **Create Procfile:**

    ```bash
    echo "web: npm run start:server" > Procfile
    ```

2. **Add build script to root `package.json`:**

    ```json
    {
        "scripts": {
            "build": "npm run build:server",
            "start:server": "node apps/server/dist/index.js"
        }
    }
    ```

3. **Deploy:**

    ```bash
    heroku create whatsapp-bot
    heroku config:set NODE_ENV=production
    heroku config:set GEMINI_API_KEY=your_key
    heroku config:set SUPABASE_URL=your_url
    heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
    heroku config:set JWT_SECRET=your_long_random_secret

    git push heroku main
    ```

### Option 2: Docker Deployment

#### Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY apps/server/dist ./apps/server/dist
COPY packages/shared/dist ./packages/shared/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
```

#### Build & Run:

```bash
docker build -t whatsapp-bot .
docker run -e NODE_ENV=production \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e GEMINI_API_KEY=... \
  -p 3001:3001 \
  whatsapp-bot
```

### Option 3: VPS/Self-Hosted (Ubuntu/DigitalOcean)

#### 1. SSH into Server

```bash
ssh root@your_server_ip
```

#### 2. Install Dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git pm2
```

#### 3. Clone & Setup

```bash
git clone https://github.com/yourusername/whatsapp-bot.git
cd whatsapp-bot
npm install
npm run build
```

#### 4. Configure Environment

```bash
cp .env.production .env
# Edit .env with production credentials
nano .env
```

#### 5. Start with PM2

```bash
pm2 start apps/server/dist/index.js --name "whatsapp-bot"
pm2 startup
pm2 save

# Monitor
pm2 logs whatsapp-bot
```

#### 6. Setup Nginx Reverse Proxy

```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:

```nginx
upstream whatsapp_bot {
  server localhost:3001;
}

server {
  server_name your_domain.com;

  location / {
    proxy_pass http://whatsapp_bot;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

---

## 🔧 Troubleshooting

### "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"

**Problem:** Server won't start without Supabase credentials

**Solution:**

```bash
# Check .env file exists
ls -la .env

# Verify credentials are set
grep SUPABASE .env

# If empty, add your Supabase project credentials:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### "Cannot connect to WhatsApp"

**Problem:** QR code not appearing or connection fails

**Solution:**

```bash
# 1. Clear WhatsApp session
rm -rf ./whatsapp-auth

# 2. Restart server
npm run dev:server

# 3. New QR code should appear, scan it

# 4. If still failing, check:
# - WhatsApp account is not blocked
# - Using official WhatsApp app (not WhatsApp Web)
# - Phone has active internet connection
```

### "Rate limit exceeded (429)"

**Problem:** Getting 429 errors from Gemini API

**Solution:**

```bash
# This is expected on free tier (12 requests/minute)
# The server queues requests automatically

# To check queue:
# Look for "QUEUE" logs in server output

# To reduce rate:
# 1. Disable bot for idle hours
# 2. Use ConfigPage to set is_active=false
# 3. Re-enable when needed
```

### "Dashboard can't connect to server"

**Problem:** CORS errors or connection refused

**Solution:**

```bash
# 1. Check both are running
npm run dev:server  # Terminal 1
npm run dev:dashboard  # Terminal 2

# 2. Verify DASHBOARD_ORIGIN in .env
DASHBOARD_ORIGIN=http://localhost:5173

# 3. Check ports:
lsof -i :3001     # Server port
lsof -i :5173     # Dashboard port

# 4. If port conflict, change PORT in .env
PORT=3002
```

### "Cannot read property 'token' of undefined"

**Problem:** JWT authentication failing

**Solution:**

```bash
# 1. Check JWT_SECRET is set
grep JWT_SECRET .env

# 2. Clear browser localStorage
# Open DevTools (F12) → Application → Clear All

# 3. Try login again with credentials:
# Username: admin
# Password: admin123 (default from database)

# 4. If password was changed, verify in Supabase:
# Go to Dashboard → SQL Editor and run:
# SELECT username, is_active FROM admin_users;
```

### "Supabase connection timeout"

**Problem:** Database queries timing out

**Solution:**

```bash
# 1. Check Supabase project status
# Go to Supabase Dashboard → Project → Status

# 2. Verify network:
ping supabase.co

# 3. Check credentials:
curl -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  "${SUPABASE_URL}/rest/v1/"

# 4. If still failing, migrate to new project:
# Create new project, run migrations, update .env
```

---

## 🤝 Contributing

### Development Workflow

1. **Create feature branch:**

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Make changes:**

    ```bash
    npm run dev         # Both server and dashboard
    npm run test        # Run tests
    npm run lint        # Type check
    ```

3. **Commit changes:**

    ```bash
    git add .
    git commit -m "feat: add new feature"
    ```

4. **Push and create PR:**
    ```bash
    git push origin feature/your-feature-name
    ```

### Code Guidelines

- **TypeScript:** Strict mode enabled, no `any` types
- **Testing:** Unit tests for AI components and API routes
- **Logging:** Use Pino for structured logs
- **API Responses:** Consistent JSON format with proper status codes
- **Database:** Use Supabase SDKs, avoid raw SQL

### Project Documentation

- **AGENTS.md** - AI behavior, prompt engineering, and authentication security guide
- **PRD.md** - Product requirements document
- **DESIGN.md** - UI/UX specifications
- **README.md** - This file

#### Security Documentation

For detailed information on:

- Database-backed password authentication with bcrypt
- JWT token generation and validation
- Admin user management best practices
- Password hashing utilities and examples

See **[AGENTS.md → Section 4 & 5](AGENTS.md#4-conversation-memory-strategy)** for comprehensive security implementation details.

---

## 📝 License

MIT License - See LICENSE file for details

---

## 📞 Support & Contact

For issues, questions, or suggestions:

1. **GitHub Issues:** [Create an issue](https://github.com/yourusername/whatsapp-bot/issues)
2. **Email:** support@example.com
3. **Documentation:** See AGENTS.md, PRD.md, DESIGN.md

---

## 🙏 Acknowledgments

- **Baileys** - WhatsApp API client
- **Google Gemini** - AI model
- **Supabase** - Database platform
- **React** - UI framework
- **Tailwind CSS** - Styling

---

**Last Updated:** June 3, 2026

**Current Version:** 1.0.0 (Development)

**Maintainer:** [Your Name/Organization]
