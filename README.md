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
│   └── types/        # Shared TypeScript types (source-of-truth)
└── infra/
    └── db/           # PostgreSQL migrations (pgvector)
```

**Stack:**
- **Frontend:** React 19, Vite, Tailwind CSS, Zustand, React Router v7
- **API:** Node.js 20, Fastify v5, TypeScript (strict), postgres.js
- **AI Service:** Python 3.13, FastAPI, OpenAI / Anthropic
- **Database:** PostgreSQL 16 with pgvector extension

---

## Running each service

Each service is fully independent — no monorepo tooling required.

### Web (`apps/web`)

```bash
cd apps/web
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

---

### API (`apps/api`)

```bash
cd apps/api
npm install
```

Create `.env` (copy from `.env.example` at repo root):
```
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/tradeai
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

```bash
npm run dev        # dev server with hot reload at http://localhost:3001
npm run build      # compile TypeScript to dist/
npm start          # run compiled output
npm test           # run tests
```

Seed sanctions data (runs automatically on startup, or manually):
```bash
npm run seed:sanctions
npm run seed:sanctions:force   # force re-seed
```

---

### AI Service (`services/ai`)

```bash
cd services/ai
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:
```
LLM_PROVIDER=openai            # openai or anthropic
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...   # if using anthropic
DATABASE_URL=postgresql://user:pass@localhost:5432/tradeai
MAX_FILE_SIZE_MB=10
REQUEST_TIMEOUT_SECONDS=30
```

```bash
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

---

## Database

Requires PostgreSQL 16+ with the pgvector extension. Run migrations from `infra/db/migrations/` before starting the API.

Schema:
- `classification_jobs` — tracks document processing jobs
- `classification_results` — stores per-item HS code results
- `sanctions_entries` — OFAC/SDN screening data (seeded on API start)

---

## Project Structure

**Web (`apps/web/src/`):**
```
├── common/           # Shared components, hooks, utils
├── infrastructure/   # API client, adapters, stores
└── screens/          # Page-level components (landing, processing, results, history)
```

**API (`apps/api/src/`):**
```
├── config/           # Environment validation (Zod)
├── domain/           # Business logic (classification, sanctions)
├── infrastructure/   # DB client, AI service client
├── repositories/     # Data access layer
├── routes/           # HTTP route handlers
├── middleware/        # Error handling
├── plugins/          # Fastify plugins (CORS, helmet, rate-limit)
└── types/            # Shared TypeScript types (copied from packages/types)
```
