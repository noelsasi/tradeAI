# TradeAI API — Engineering Guidelines

> This document is the single source of truth for architecture, coding standards, and tooling
> for the Node/TypeScript Fastify API service.
> Every engineer (and AI assistant) working on this service must follow it.
> Update it when conventions change — never let code drift silently from these rules.

---

## Table of Contents

1. [Project Stack](#1-project-stack)
2. [Folder Structure](#2-folder-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Route Design](#4-route-design)
5. [TypeScript Rules](#5-typescript-rules)
6. [Error Handling](#6-error-handling)
7. [Infrastructure Layer](#7-infrastructure-layer)
8. [Three-Layer HS Resolver](#8-three-layer-hs-resolver)
9. [SSE Streaming](#9-sse-streaming)
10. [Database Rules](#10-database-rules)
11. [Environment & Config](#11-environment--config)
12. [Testing](#12-testing)
13. [Security](#13-security)
14. [Logging](#14-logging)
15. [Portability Rules](#15-portability-rules)
16. [Available Scripts](#16-available-scripts)

---

## 1. Project Stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 20 LTS | LTS only — no odd versions |
| Language | TypeScript (strict) | No `any`, no implicit returns |
| Framework | Fastify v5 | Schema validation built-in, fast |
| DB client | postgres.js | Lightweight, no ORM — raw SQL only |
| Cache | ioredis | Redis client, used for Layer 1 cache |
| Validation | Zod | All input/output shapes validated |
| HTTP client | undici | Native Node fetch — no axios |
| Testing | Vitest | Unit + integration |
| Linting | ESLint (flat config) | Zero warnings in CI |
| Formatting | Prettier | Enforced on commit |
| Dev runner | tsx --watch | Hot reload in dev |
| Migrations | node-pg-migrate | SQL-first migrations, no ORM |

---

## 2. Folder Structure

```
src/
├── config/
│   └── env.ts                  # All env vars — single source of truth
│
├── infrastructure/             # External world — swap without touching business logic
│   ├── db/
│   │   ├── client.ts           # postgres.js connection (singleton)
│   │   └── migrations/         # .sql migration files
│   ├── cache/
│   │   └── redis.ts            # ioredis client (singleton)
│   ├── storage/
│   │   └── r2.ts               # Cloudflare R2 / S3 client
│   └── ai-service/
│       └── client.ts           # HTTP client for Python AI service
│
├── domain/                     # Business logic — no framework, no DB imports
│   ├── classification/
│   │   ├── resolver.ts         # 3-layer HS resolver
│   │   ├── normalizer.ts       # Description normalisation + hashing
│   │   └── types.ts            # Domain types for this feature
│   ├── sanctions/
│   │   └── screener.ts         # OFAC/UN/EU sanctions lookup
│   └── export/
│       ├── csv-builder.ts      # CSV export logic
│       └── mirsal-builder.ts   # Mirsal 2 XML builder
│
├── repositories/               # All DB reads/writes — one file per entity
│   ├── job-repository.ts
│   ├── result-repository.ts
│   └── cache-repository.ts
│
├── routes/                     # Fastify route handlers — thin, delegate to domain
│   ├── classify.ts
│   ├── export.ts
│   └── health.ts
│
├── middleware/
│   ├── error-handler.ts        # Global Fastify error handler
│   ├── request-logger.ts       # Request/response logging
│   └── api-key.ts              # API key auth (prototype)
│
├── plugins/                    # Fastify plugin registrations
│   └── index.ts
│
└── index.ts                    # Entry point — registers plugins + routes, starts server
```

**Rules:**

- Never import from `infrastructure/` inside `domain/` — domain is pure business logic.
- Never import from `routes/` inside `domain/` or `repositories/` — routes are thin wrappers.
- Never put SQL inside routes or domain — all DB access goes through `repositories/`.
- No `index.ts` barrel files — import directly from the file.

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` | `job-repository.ts` |
| Functions | `camelCase` | `resolveHsCode`, `buildMirsalXml` |
| Classes | `PascalCase` (avoid unless necessary) | `HsResolver` |
| Types / Interfaces | `PascalCase` | `ClassifyResult`, `JobStatus` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_MB` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `AI_SERVICE_URL` |
| Route paths | `kebab-case` | `/classify/document`, `/export/:jobId/mirsal` |

**Named exports only — no default exports.**

```ts
// ✅
export async function resolveHsCode(description: string): Promise<ClassifyResult> { ... }

// ❌
export default async function resolveHsCode(...) { ... }
```

---

## 4. Route Design

Routes are thin. They validate input, call domain logic, return output. Nothing else.

```ts
// routes/classify.ts

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { resolveHsCode } from '@/domain/classification/resolver'
import type { ApiResponse } from '@tradeai/types'

const TextClassifyBody = z.object({
  text: z.string().min(3).max(2000),
})

export async function classifyRoutes(app: FastifyInstance) {
  app.post('/classify/text', async (req, reply) => {
    const { text } = TextClassifyBody.parse(req.body)
    const result = await resolveHsCode(text)
    return reply.send({ success: true, data: result } satisfies ApiResponse<typeof result>)
  })
}
```

**Route rules:**

- No business logic in route handlers — delegate to `domain/`.
- No direct DB calls in routes — use `repositories/`.
- Always validate with Zod before passing to domain.
- Always return `ApiResponse<T>` or `ApiError` shape (from `@tradeai/types`).
- HTTP status codes: `200` success, `400` validation, `404` not found, `500` unexpected.

### Response envelope

Every response uses the shared envelope from `@tradeai/types`:

```ts
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

Never return raw data without the envelope — frontend depends on this shape.

---

## 5. TypeScript Rules

```ts
// ✅ Explicit return types on all exported functions
export async function createJob(input: CreateJobInput): Promise<Job> { ... }

// ❌ No any — ever
const result: any = await db.query(...)

// ✅ Use unknown + narrow
const result: unknown = await db.query(...)

// ✅ Type imports — keeps runtime bundle clean
import type { TradeItem, ApiResponse } from '@tradeai/types'

// ✅ Zod for runtime validation at boundaries
const body = ClassifyBody.parse(req.body)  // throws ZodError if invalid

// ✅ Discriminated unions for states
type JobState =
  | { status: 'pending' }
  | { status: 'processing'; completedItems: number; totalItems: number }
  | { status: 'completed'; resultId: string }
  | { status: 'failed'; error: string }
```

All shared types (`TradeItem`, `ApiResponse`, `AiClassifyRequest`) live in
`packages/types` — import from `@tradeai/types`, never redefine locally.

Service-local types (DB row shapes, internal state) live in `domain/<feature>/types.ts`.

---

## 6. Error Handling

Never throw raw errors from routes. All errors flow through the Fastify error handler.

```ts
// domain/classification/resolver.ts

export class ClassificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message)
    this.name = 'ClassificationError'
  }
}

// Usage
if (!description.trim()) {
  throw new ClassificationError('Description cannot be empty', 'EMPTY_DESCRIPTION', 400)
}
```

```ts
// middleware/error-handler.ts

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      })
    }
    if (error instanceof ClassificationError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      })
    }
    // Unexpected — log + generic response
    app.log.error(error)
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    })
  })
}
```

**Rules:**

- Never expose stack traces or internal error details in responses.
- Always log unexpected errors with full context.
- Domain errors (`ClassificationError`) carry their own HTTP status code.

---

## 7. Infrastructure Layer

Every external dependency lives behind a thin interface. Business logic never imports
vendor SDKs directly — only infrastructure files do.

```
domain/classification/resolver.ts
  imports → repositories/cache-repository.ts   (interface)
  imports → infrastructure/ai-service/client.ts (HTTP, not SDK)

NOT:
domain/classification/resolver.ts
  imports → ioredis              ❌ vendor in domain
  imports → @anthropic-ai/sdk    ❌ vendor in domain
```

### DB Client

```ts
// infrastructure/db/client.ts
import postgres from 'postgres'
import { env } from '@/config/env'

export const db = postgres(env.databaseUrl, {
  max: 10,
  idle_timeout: 20,
})
```

All queries go through `repositories/` — never import `db` directly in routes or domain.

### Redis Client

```ts
// infrastructure/cache/redis.ts
import { Redis } from 'ioredis'
import { env } from '@/config/env'

export const redis = new Redis(env.redisUrl)
```

### AI Service Client

```ts
// infrastructure/ai-service/client.ts
import { env } from '@/config/env'
import type { AiClassifyRequest, AiClassifyResponse } from '@tradeai/types'

export async function aiClassify(req: AiClassifyRequest): Promise<AiClassifyResponse> {
  const res = await fetch(`${env.aiServiceUrl}/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`AI service error: ${res.status}`)
  return res.json() as Promise<AiClassifyResponse>
}
```

When you move from Railway to AWS ECS, only `env.aiServiceUrl` changes. Zero code changes.

---

## 8. Three-Layer HS Resolver

This is the core of the product. It lives in `domain/classification/resolver.ts`.

```
Layer 1 — Redis exact match     ~1ms    free
Layer 2 — pgvector similarity   ~20ms   ~$0.00001
Layer 3 — Claude via AI service ~2-4s   ~$0.008
```

```ts
// domain/classification/resolver.ts

export async function resolveHsCode(
  description: string,
  context?: ClassifyContext,
): Promise<ClassifyResult> {

  const normalized = normalizeDescription(description)
  const hash = sha256(normalized)

  // Layer 1 — exact match in Redis
  const cached = await cacheRepo.getByHash(hash)
  if (cached) return { ...cached, source: 'cache' }

  // Layer 2 — semantic match in pgvector
  const embedding = await embedText(normalized)
  const similar = await cacheRepo.findSimilar(embedding, SIMILARITY_THRESHOLD)
  if (similar) {
    await cacheRepo.setByHash(hash, similar)      // promote to L1
    return { ...similar, source: 'vector' }
  }

  // Layer 3 — Claude via AI service
  const result = await aiServiceClient.classify({ description, ...context })
  await cacheRepo.store({ description, normalized, embedding, ...result })
  await cacheRepo.setByHash(hash, result)
  return { ...result, source: 'ai' }
}
```

**Rules:**

- `SIMILARITY_THRESHOLD = 0.92` — do not lower without measuring false positive rate.
- Never skip Layer 1 or Layer 2 — they are the cost optimisation.
- User overrides (via `/classify/:jobId/override`) set `verified: true` in cache —
  verified results are always returned over unverified at the same similarity score.
- The `source` field (`cache | vector | ai`) must always be stored and returned —
  it is the audit trail for how a classification was derived.

---

## 9. SSE Streaming

SSE drives the processing screen's live step animation. Use Fastify's raw reply object.

```ts
// routes/classify.ts

app.get('/classify/:jobId/stream', async (req, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const send = (event: string, data: unknown) => {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // Poll job status until complete or failed
  const interval = setInterval(async () => {
    const job = await jobRepo.getById(req.params.jobId)
    send('progress', { completedItems: job.completedItems, totalItems: job.totalItems })
    if (job.status === 'completed') {
      send('complete', { jobId: job.id })
      clearInterval(interval)
      reply.raw.end()
    }
    if (job.status === 'failed') {
      send('error', { message: job.error })
      clearInterval(interval)
      reply.raw.end()
    }
  }, 500)

  req.raw.on('close', () => clearInterval(interval))
})
```

**SSE event types** (frontend listens for these exactly):

| Event | Payload | When |
|---|---|---|
| `step` | `{ key, status: 'active'\|'done' }` | Step state changes |
| `progress` | `{ completedItems, totalItems, percent }` | Each item classified |
| `complete` | `{ jobId }` | All items done |
| `error` | `{ message }` | Job failed |

Never change event names without updating the frontend simultaneously.

---

## 10. Database Rules

**Raw SQL only — no ORM.** SQL is readable, debuggable, and portable.

```ts
// repositories/job-repository.ts

import { db } from '@/infrastructure/db/client'
import type { Job, CreateJobInput } from '@/domain/classification/types'

export async function createJob(input: CreateJobInput): Promise<Job> {
  const [job] = await db<Job[]>`
    INSERT INTO classification_jobs (id, status, input_type, file_name, total_items)
    VALUES (gen_random_uuid(), 'pending', ${input.inputType}, ${input.fileName}, ${input.totalItems})
    RETURNING *
  `
  return job
}

export async function getJobById(id: string): Promise<Job | null> {
  const [job] = await db<Job[]>`
    SELECT * FROM classification_jobs WHERE id = ${id}
  `
  return job ?? null
}
```

**Rules:**

- All queries in `repositories/` — never inline SQL in routes or domain.
- Always use parameterised queries (postgres.js template literals do this automatically).
- Never use `*` in production queries — list columns explicitly.
- Migrations go in `infrastructure/db/migrations/` as numbered `.sql` files:
  `001_initial_schema.sql`, `002_add_verified_flag.sql`.
- Never edit a migration that has already run — always add a new one.

---

## 11. Environment & Config

All env vars are declared and validated in one place.

```ts
// config/env.ts
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  AI_SERVICE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  API_KEY: z.string().min(32),
  R2_BUCKET_URL: z.string().url().optional(),
})

export const env = EnvSchema.parse(process.env)
```

If a required env var is missing, the server **refuses to start** with a clear error.
No silent fallbacks for secrets.

`.env.example` at the repo root documents every variable. `.env.local` is gitignored.

---

## 12. Testing

### What to test

| Layer | Test type | Focus |
|---|---|---|
| Domain (resolver, normalizer, builders) | Unit | Pure function input/output |
| Repositories | Integration | Real DB queries against test DB |
| Routes | Integration | Full request/response cycle |
| Infrastructure clients | Unit (mocked) | Error handling, timeout behaviour |

### File co-location

```
domain/classification/
├── resolver.ts
├── resolver.test.ts       ← unit test
├── normalizer.ts
└── normalizer.test.ts
```

### Test style

```ts
// domain/classification/resolver.test.ts

describe('resolveHsCode', () => {
  it('returns cached result when hash matches Layer 1', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(mockCachedResult))
    const result = await resolveHsCode('Dell laptop 14 inch')
    expect(result.source).toBe('cache')
    expect(mockAiService.classify).not.toHaveBeenCalled()
  })

  it('falls through to AI service when cache and vector both miss', async () => {
    mockRedis.get.mockResolvedValue(null)
    mockDb.findSimilar.mockResolvedValue(null)
    mockAiService.classify.mockResolvedValue(mockAiResult)
    const result = await resolveHsCode('obscure industrial widget')
    expect(result.source).toBe('ai')
    expect(result.hsCode).toBe(mockAiResult.hsCode)
  })
})
```

- Mock at the infrastructure boundary — never mock domain logic itself.
- Integration tests use a real NeonDB test branch (Neon supports branching — use it).
- Target ≥80% coverage on domain layer. Routes need at least a smoke test per endpoint.

---

## 13. Security

- **API key auth on all routes** (prototype): `X-API-Key` header, validated in middleware.
- **Never log request bodies** that may contain PII or document contents.
- **Validate all input with Zod** before it touches any business logic.
- **File uploads**: validate MIME type + file size before storing. Max 10MB per file.
- **SQL injection**: postgres.js template literals parameterise automatically — never
  string-concatenate SQL.
- **CORS**: set `CORS_ORIGIN` explicitly — never use `*` in production.
- **Secrets**: never in source code, never in logs, always from env vars.
- **Rate limiting**: add `@fastify/rate-limit` before any public deployment. 
  Default: 100 req/min per IP for classify endpoints.

---

## 14. Logging

Fastify's built-in Pino logger. Never use `console.log` in production code.

```ts
// ✅
req.log.info({ jobId, itemCount }, 'Classification job started')
req.log.error({ error, jobId }, 'Classification failed')

// ❌
console.log('job started', jobId)
```

**Log levels:**

| Level | When |
|---|---|
| `info` | Job lifecycle events (created, completed) |
| `warn` | Degraded state (cache miss rate high, AI slow) |
| `error` | Unexpected failures — always include error object |
| `debug` | Layer resolver path taken (cache/vector/ai hit) — dev only |

**Never log:**

- Full document text
- API keys or secrets
- Full user-uploaded file contents

---

## 15. Portability Rules

This service must run identically on Railway (now), AWS ECS (later), or a client's
on-premise Docker setup. These rules enforce that:

1. **No platform-specific SDKs in business logic** — AWS SDK, Railway SDK, etc. only
   in `infrastructure/` behind interfaces.

2. **All config from environment variables** — no hardcoded URLs, credentials, or
   region names anywhere in source code.

3. **Dockerfile at the root of this package** — the container is the deployment unit.

4. **Health endpoint always available at `GET /health`** — load balancers depend on it.

5. **Graceful shutdown** — handle `SIGTERM` to drain in-flight requests before exit.
   ECS and Railway both send `SIGTERM` before killing a container.

```ts
// index.ts
process.on('SIGTERM', async () => {
  await app.close()
  process.exit(0)
})
```

6. **Stateless** — no in-memory state that must survive a restart. Jobs and cache live
   in DB/Redis, not in-process.

---

## 16. Available Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server with hot reload (`tsx watch`) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled `dist/index.js` (production) |
| `pnpm lint` | ESLint — zero warnings allowed |
| `pnpm type-check` | TypeScript check without emitting |
| `pnpm test` | Vitest watch mode |
| `pnpm test:run` | Single test run (CI) |
| `pnpm migrate` | Run pending DB migrations |
| `pnpm migrate:create <name>` | Create a new migration file |

---

> Last updated: 2026-06-04
> Maintained by: Nexavine Tech
