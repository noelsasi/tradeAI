# TradeAI

AI-powered trade document classification platform. Upload invoices, packing lists, or other trade documents and get HS code classifications, sanctions screening, and export compliance checks — in seconds.

## Architecture

```
tradeAI/
├── apps/
│   ├── web/          # React 19 frontend (Vite + Tailwind + Zustand)
│   └── api/          # Node.js API (Fastify v5 + TypeScript)
├── services/
│   └── ai/           # Python FastAPI AI microservice
├── packages/
│   └── types/        # Shared TypeScript types
└── infra/
    └── db/           # PostgreSQL migrations (pgvector)
```

**Stack:**
- **Frontend:** React 19, Vite, Tailwind CSS, Zustand, React Router v7
- **API:** Node.js 20, Fastify v5, TypeScript (strict), postgres.js, ioredis
- **AI Service:** Python 3.12, FastAPI, OpenAI / Anthropic / Azure OpenAI
- **Database:** PostgreSQL 16 with pgvector extension
- **Cache:** Redis 7
- **Package manager:** pnpm (workspaces)

---

## Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker & Docker Compose
- Python 3.12+ (for running the AI service locally without Docker)

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy the root example and fill in values:

```bash
cp .env.example .env
```

For the web app:

```bash
cp apps/web/.env.example apps/web/.env
```

Key variables to set in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AI_SERVICE_URL` | Python AI service URL (default: `http://localhost:8000`) |
| `LLM_PROVIDER` | `openai`, `anthropic`, or `azure_openai` |
| `OPENAI_API_KEY` | Required if using OpenAI |
| `ANTHROPIC_API_KEY` | Required if using Anthropic |

### 3. Start infrastructure (Postgres + Redis)

```bash
pnpm db:up
```

---

## Development

### Run everything locally (recommended)

**Terminal 1 — infrastructure:**
```bash
pnpm db:up
```

**Terminal 2 — AI service:**
```bash
cd services/ai
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 3 — API:**
```bash
pnpm dev:api
```

**Terminal 4 — Web:**
```bash
pnpm dev
```

Web app runs at `http://localhost:5173`, API at `http://localhost:3001`.

### Run all apps in parallel (web + api only)

```bash
pnpm dev:all
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start web frontend |
| `pnpm dev:api` | Start API server with hot reload |
| `pnpm dev:all` | Start web + API in parallel |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all workspaces |
| `pnpm type-check` | TypeScript check across all workspaces |
| `pnpm test` | Run all tests |
| `pnpm db:up` | Start Postgres + Redis via Docker |
| `pnpm db:down` | Stop Postgres + Redis |
| `pnpm docker:up` | Start full stack (includes API + AI service) |
| `pnpm docker:down` | Stop full Docker stack |
| `pnpm docker:logs` | Tail Docker logs |

### API-specific scripts

```bash
# Seed OFAC/sanctions data (runs automatically on startup)
pnpm --filter api seed:sanctions

# Force re-seed
pnpm --filter api seed:sanctions:force
```

---

## Docker (full stack)

To run everything — including the API and AI service — in Docker:

```bash
cp .env.example .env   # fill in LLM API keys
pnpm docker:up
```

Services:
- Web: `http://localhost:5173`
- API: `http://localhost:3001`
- AI service: `http://localhost:8000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

---

## Database

Migrations run automatically on first `db:up` from `infra/db/migrations/`.

The schema uses:
- `classification_jobs` — tracks document processing jobs
- `classification_results` — stores per-item HS code results
- `sanctions_entries` — OFAC/SDN screening data (seeded on API start)
- pgvector for semantic similarity on HS code resolution

---

## Project Structure (Web)

```
apps/web/src/
├── common/           # Shared components, hooks, utils
├── infrastructure/   # API client, adapters, stores
└── screens/          # Page-level components (landing, processing, results, history)
```

## Project Structure (API)

```
apps/api/src/
├── config/           # Environment validation (Zod)
├── domain/           # Business logic (classification, sanctions)
├── infrastructure/   # DB client, Redis, AI service client
├── repositories/     # Data access layer
├── routes/           # HTTP route handlers
├── middleware/       # Error handling
└── plugins/          # Fastify plugins (CORS, helmet, rate-limit)
```
