# 🌌 Aura Workspace

> **Next-Generation AI-Powered Developer Mission Control & Multi-Project Command Center**

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-emerald?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18%2B-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-v5%2B-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Socket.io](https://img.shields.io/badge/Real--Time-Socket.io-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![Google Generative AI](https://img.shields.io/badge/AI_Engine-Gemini_Core-8E75C2?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/license-ISC-purple?style=flat-square)](#license)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Why Aura Workspace? (Real-World Use Case)](#-why-aura-workspace-real-world-use-case)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Security & Multi-Tenant Isolation](#-security--multi-tenant-isolation)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Product Vision & Core Module Roadmap](#-product-vision--core-module-roadmap)

---

## 🚀 Overview

**Aura Workspace** is a centralized developer command center designed to manage all your projects, run AI-driven code analysis, inspect relational & NoSQL databases, monitor multi-project API traffic, and track API key quota limits in real-time from one unified, dark-mode web platform.

---

## 🎯 Why Aura Workspace? (Real-World Use Case)

### 😫 The Developer Friction Problem
When building and managing multiple projects (e.g. E-Commerce apps, SaaS tools, Portfolios, and Mobile Backends), developers are forced to constantly switch across **8+ separate applications and tabs**:
* 💻 **VS Code** *(Code editing)*
* 🤖 **ChatGPT / Gemini browser tabs** *(AI copilot queries)*
* 🗄️ **pgAdmin / MongoDB Compass / Supabase** *(Database data & schemas)*
* 🚀 **Postman / Hoppscotch** *(Testing API endpoints)*
* 📊 **Vercel / Render / Railway** *(Deployment monitoring)*
* ⚙️ **Docker Desktop / Terminal** *(Container & process logs)*
* 📧 **Resend / Google Cloud Consoles** *(Checking API rate limits & quota crashes)*

This constant context-switching wastes hours every week and causes major delays when debugging production issues.

### 💡 The Solution: Single Pane of Glass Mission Control
**Aura Workspace** replaces tab overload with **one single web tab**. You select your active project from a dropdown, and all tools, database connections, AI context, live traffic analytics, and rate-limit security alerts for that project instantly sync in front of you.

```text
                   ┌─────────────────────────────────────┐
                   │    AURA WORKSPACE MISSION CONTROL    │
                   │    [ Project:  ▼ E-Commerce App ]    │
                   └──────────────────┬──────────────────┘
                                      │
   ┌──────────────────┬───────────────┼───────────────┬──────────────────┐
   ▼                  ▼               ▼               ▼                  ▼
┌──────────────┐   ┌──────────────┐┌──────────────┐┌──────────────┐   ┌──────────────┐
│ 🔮 AI Vault  │   │🗄️ Data Engine││🛡️ API Sentinel││ 💻 CloudShell│   │ ⚡ API Studio │
│ Code Helper  │   │ Live Database││Traffic & Keys││ Web Terminal │   │ Postman Tool │
└──────────────┘   └──────────────┘└──────────────┘└──────────────┘   └──────────────┘
```

### ⚡ Real-World Debugging Workflow Comparison

* **❌ WITHOUT Aura Workspace:** An API crashes at 2:00 AM → Open VS Code → Open Supabase to inspect DB rows → Open Google Cloud Console to check quota limits → Open Vercel to check build logs → Open Postman to re-test the endpoint. *(30+ minutes wasted jumping across 5 apps).*
* **✅ WITH Aura Workspace:** Open Aura Workspace → Click **E-Commerce App** → See instant red alert toast: `⚠️ Gemini Key Rate Limited (Auto-switched to backup engine)` → Inspect affected database row in **Data Engine** → Ask **Aura Vault** for the code fix on the spot. *(Resolved in 2 minutes inside 1 window).*

---

## ✨ Key Features

### 🔮 1. Aura Vault *(AI Developer Assistant v1.0)*
* **Dual Engine Architecture:** Toggle between **Flash (Mini)** for ultra-fast answers and **Reasoning (Pro)** for deep code analysis, architectural refactoring, and thinking-budget execution (`gemini-3.7-flash`).
* **Automatic Failover:** Smart fallback engine that automatically switches to secondary model tiers (`gemini-3.5-flash-lite` / `gemini-3.6-flash`) if primary API quotas or rate limits (`429`, `503`, `504`) are encountered.
* **Conversational Short-Circuiting:** Zero-token chat commands (e.g., `"rename this chat to auth-refactor"`) are intercepted locally by regex, updating PostgreSQL directly without calling upstream LLM APIs or consuming tokens.
* **Deterministic 1st-Turn Auto-Titling:** Background single-turn summarization with tight token boundaries (`maxOutputTokens: 20`) generates concise 3-to-5 word chat titles strictly on turn 1.
* **Multimodal Attachments:** Upload code snippets, logs, screenshots, and raw data files alongside your prompts.
* **Signed UUID Session Security:** Chat sessions are bound to `UUID` primary keys and secured with `HMAC-SHA256` token signatures to prevent URL tampering.
* **Real-Time Telemetry Dispatch:** Instant WebSocket telemetry notifications (`alert:model_failover`, `alert:rate_limit`) broadcast upstream status shifts to all active tabs.
* **Persistent Markdown Rendering:** Syntax-highlighted code blocks, copyable snippets, and streaming response indicators.

### 🗄️ 2. PostgreSQL Relational Storage
* **Dockerized PostgreSQL:** Isolated relational database running in a containerized environment (`aura_postgres`).
* **Relational Schema:** Foreign key constraints (`UUID` references) between users and conversations with cascading deletes.
* **Connection Pooling:** High-concurrency client pooling via native `pg` pool driver with parameterized query protection.
* **Auto Migration Support:** Database initialization logic that validates and creates tables automatically on server startup.

### 🛡️ 3. User Authentication & Security
* **Google OAuth 2.0 & Custom Auth:** Dual login support via Google verification tokens or custom email/password with OTP verification via Resend.
* **HttpOnly Session Cookies:** Secure JWT session storage with `sameSite` protection and automated expiration handling.
* **Honeypot Security Interceptors:** Built-in bot protection fields to prevent automated sign-up abuse.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      Aura Workspace Command UI                          │
│                      (React 18 + Vite + Tailwind)                       │
└───────────────────────┬─────────────────────────┬───────────────────────┘
│ CORS / HttpOnly JWT     │ WebSockets (Socket.io)
▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Express 5 Backend Core                           │
│     ├── Native HTTP Server Instance (Socket.io telemetry hub)           │
│     ├── /api/users    (Auth, Google OAuth, OTP, Password Reset)         │
│     ├── /api/vault    (AI Sessions, Message Stream, HMAC Validation)    │
│     └── /api/sentinel (Real-time Telemetry & API Key Health Monitor)     │
└──────────────────┬──────────────────────────────────┬───────────────────┘
│ Parameterized Queries            │ Generative AI SDK
▼                                  ▼
┌───────────────────────────────────┐      ┌──────────────────────────────┐
│  PostgreSQL 16 (Docker Container) │      │  Google Generative AI SDK    │
│  - users (SERIAL PK / UUID)       │      │  - Mini: Gemini 3.5 Flash    │
│  - vault_chats (UUID PK)          │      │  - Pro: Gemini 3.7 Reasoning │
│  - vault_messages (SERIAL PK)     │      │  - Backup: Failover Engine   │
└───────────────────────────────────┘      └──────────────────────────────┘
```

---

## 🔒 Security & Multi-Tenant Isolation

* **AES-256-GCM Credential Encryption:** Database connection URIs and sensitive API keys are encrypted at rest using AES-256-GCM before saving to PostgreSQL.
* **HMAC-SHA256 URL Verification:** Session routes reject arbitrary chat access; all route params enforce cryptographically signed tokens (`<UUID>.<HMAC-SHA256>`).
* **Strict Ownership Checks (RBAC):** Every API endpoint verifies `req.user.id` against requested `projectId` resources before establishing sockets or reading schema data.
* **Destructive Command Guard:** Dangerous SQL execution (`DROP TABLE`, `TRUNCATE`) requires dual-confirmation modal triggers or a "Read-Only Sandbox Switch".
* **TLS 1.3 / SSL Encryption:** All external database connections enforce encrypted tunnels in transit.

---

## 🗃️ Database Schema

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT CHK_AUTH_METHOD CHECK (google_id IS NOT NULL OR password IS NOT NULL)
);

-- Vault Chats Table (UUID Session Keys)
CREATE TABLE IF NOT EXISTS vault_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Conversation',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vault Messages Table
CREATE TABLE IF NOT EXISTS vault_messages (
    id SERIAL PRIMARY KEY,
    chat_id UUID REFERENCES vault_chats(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    text TEXT NOT NULL,
    model_tier VARCHAR(20) DEFAULT 'mini',
    is_failover BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_vault_chats_user ON vault_chats(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_messages_chat ON vault_messages(chat_id, created_at ASC);
```

---

## ⚡ Getting Started

### Prerequisites
* **Node.js**: v18+
* **Docker & Docker Desktop**
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Krishna-Jajoo-git/AURA-WORKSPACE.git
cd AURA-WORKSPACE
```

### 2. Start PostgreSQL Container
```bash
docker-compose up -d
```

### 3. Setup Backend Environment
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
DATABASE_URL=postgresql://aura_admin_Krishna:aura_secure_password_Krishna@localhost:5432/aura_identity
JWT_SECRET=your_super_secret_jwt_key
CHAT_SIGNING_SECRET=your_vault_chat_signing_secret
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
GOOGLE_CLIENT_ID=your_google_client_id
CLIENT_URL=http://localhost:5173
```

Run the backend server:

```bash
npm run dev
```

### 4. Setup Frontend
In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗺️ Product Vision & Core Module Roadmap

### 🔔 1. Real-Time Alert & Quota Engine
* **Live WebSocket Notifications:** Floating alert toasts when API keys (Gemini, Resend, OpenAI) hit usage limits (429 Rate Limit Exceeded).
* **Auto Model Failover Tracker:** Notification drawer logging model switch events from Primary to Backup tiers.
* **Notification Bell:** Header activity stream storing system uptime logs, quota warnings, and database errors.

### 🗄️ 2. Data Engine 2.0 (Multi-Database Studio)
* **Multi-DB Support:** Connect PostgreSQL, MongoDB, MySQL, SQLite, or Firebase to any project.
* **Visual ERD & Query Runner:** Inspect tables/collections, execute parameterized queries, and view pagination data grids.
* **Safe Mode Toggle:** Read-Only switch to protect production data from accidental edits.

### 🛡️ 3. API Sentinel (Multi-Project Traffic Monitor)
* **Universal Telemetry Middleware:** Light 5-line middleware to track incoming HTTP requests across all your external apps.
* **Global Project Selector:** Filter analytics by Aura Workspace, E-Commerce Store, Portfolio, or custom project IDs.
* **Metrics Dashboard:** Live requests/sec, error rate spikes (500 / 404), latency graphs, and uptime monitors.

### ⚡ 4. API Playground (In-Browser Postman)
* **Request Builder:** Execute GET, POST, PUT, DELETE requests with headers, body payloads, and cookies.
* **Auto Docs:** Generate OpenAPI / Swagger documentation and cURL snippets automatically.

### 🧰 5. Built-In Developer Utilities (Swiss Army Knife)
* **JWT Decoder:** Inspect token headers, payload claims, and expiration timers.
* **Bcrypt & Hash Tester:** Generate and verify SHA-256 signatures and Bcrypt password hashes.
* **UUID & Secret Generator:** Generate secure UUID v4 tokens and cryptographic secrets in 1 click.

### 🚀 6. Next-Gen Enhancements (Phase 1 In-Progress)
* **Interactive Code Engine:** Syntax-highlighted blocks with language badges and one-click clipboard copying (`react-syntax-highlighter`).
* **Slash Command Dispatcher:** Direct contextual shortcuts (`/explain`, `/refactor`, `/test`, `/audit`) into the active prompt pipeline.
* **Local Project RAG:** Local repository vector indexing for grounded repository context.