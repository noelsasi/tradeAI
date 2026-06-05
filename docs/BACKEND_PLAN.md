# TradeAI — Backend Build Plan

> **Goal:** A working demo that solves the real gap — messy PDF invoice in, Mirsal 2-ready
> output out — that no competitor (including Portmind) currently offers to SME freight
> forwarders in Dubai.
>
> **Positioning:** "Mirsal 2 copilot for small UAE freight forwarders" — not a generic
> HS code classifier. The workflow replacement for what a customs clerk does manually
> for 3 hours per shipment. Portmind serves enterprise ERP teams; we serve the 5-person
> freight office in Karama with WhatsApp, Excel, and Mirsal 2.
>
> **Primary demo target:** Shippify UAE (2,500 clients, self-identified the pain publicly).
> Even if it doesn't sell, the demo opens doors to every freight forwarder in Jebel Ali.

---

## Competitor Landscape (Researched June 2026)

| Competitor | What they do | Why we win |
|---|---|---|
| **Al Munasiq** (Dubai Customs AI) | Single-item web form, CAPTCHA, no bulk | We do bulk, API-driven, no friction |
| **Portmind Sail** | Enterprise API into ERP/PLM, structured BOM input | They need an ERP; we take a messy PDF |
| **Nunar** | UAE workflow automation, unclear HS depth | No confirmed bulk + Mirsal 2 output |
| **ICP / Mirsal 2 search** | Government portals, one item at a time | Bulk, no CAPTCHA, export-ready |
| **Avalara / Descartes** | Enterprise, not UAE-specific, no Mirsal 2 | Too expensive, wrong market |

**Key insight from research:** No tool confirmed does bulk invoice PDF → GCC 12-digit
classification → Mirsal 2 XML export for SMEs. That is our exact lane.

---

## The Real Gap We're Filling

| Pain | What exists today | What we add |
|---|---|---|
| Bulk invoice classification | Nothing for SMEs | PDF upload → all line items classified in one job |
| GCC 12-digit specificity | Government tools (single item, CAPTCHA) | Bulk, API-driven, no CAPTCHA |
| Mirsal 2 output | Nobody confirmed for SMEs | Direct XML export, paste-ready |
| Messy supplier descriptions | Portmind needs structured BOM | We handle "misc electrical parts" type descriptions |
| Arabic invoice support | Nothing | Arabic description extraction + classification |
| Sanctions in same workflow | Separate tools | OFAC/UN/EU inline with classification |
| Audit trail | Nothing for SMEs | Every decision stored with reasoning |
| User corrections feed cache | Nobody | Override → verified cache → product gets smarter |

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           apps/web (React/Vite)             │
│           Deployed: Vercel                  │
└──────────────────┬──────────────────────────┘
                   │ REST + SSE
┌──────────────────▼──────────────────────────┐
│           apps/api (Node/TS Fastify)        │
│           Deployed: Railway                 │
│                                             │
│  • Job management                           │
│  • 3-layer HS resolver                      │
│  • SSE progress streaming                   │
│  • Export (CSV + Mirsal 2 XML)              │
│  • Sanctions lookup                         │
└──────┬───────────────────────┬──────────────┘
       │ HTTP                  │ SQL + Redis
┌──────▼──────────┐  ┌─────────▼────────────┐
│  services/ai    │  │  NeonDB (Postgres)   │
│  Python FastAPI │  │  Upstash Redis       │
│  Railway        │  └──────────────────────┘
│                 │
│  • PDF extract  │
│  • HS classify  │
│  • Claude API   │
└─────────────────┘
```

---

## Phase 1 — Local Dev Foundation
**Goal:** One command starts everything locally. No cloud needed yet.

### 1.1 Environment & Docker
- [ ] Root `.env.example` — all vars documented, nothing hardcoded
- [ ] `docker-compose.yml` — postgres + redis locally
- [ ] `apps/api` — Dockerfile
- [ ] `services/ai` — Dockerfile
- [ ] `pnpm install` at root wires all workspaces

### 1.2 NeonDB Schema
Four tables, designed to last:

```sql
-- Tracks every upload/classify job
classification_jobs (
  id uuid PK,
  status: pending|processing|completed|failed,
  input_type: text|document,
  file_name text,
  file_url text,
  total_items int,
  completed_items int,
  error text,
  created_at, updated_at
)

-- One row per line item per job
classification_results (
  id uuid PK,
  job_id uuid FK,
  line_number int,
  raw_description text,          -- original from invoice
  normalized_description text,   -- cleaned for cache lookup
  hs_code varchar(12),
  hs_title text,
  hs_chapter text,
  confidence numeric,
  risk_level: Clear|Review|Flagged,
  source: cache|vector|ai,       -- which layer answered
  ai_reasoning text,
  alternatives jsonb,
  sanctions_ofac, sanctions_un, sanctions_eu,
  flag_note text,
  user_overridden bool,
  user_override_code varchar(12),
  created_at
)

-- The 3-layer cache — grows smarter over time
hs_classification_cache (
  id uuid PK,
  description_hash varchar(64),  -- sha256 of normalized text (Layer 1 key)
  description text,
  embedding vector(1536),        -- pgvector (Layer 2)
  hs_code varchar(12),
  confidence numeric,
  verified bool,                 -- human-confirmed = higher trust
  hit_count int,                 -- track usage
  created_at, updated_at
)

-- Sanctions lists (self-hosted OpenSanctions dump)
sanctions_entries (
  id uuid PK,
  list_name: ofac|un|eu,
  entity_name text,
  aliases text[],
  hs_codes text[],               -- codes this entity is restricted on
  country text,
  updated_at
)
```

### 1.3 Shared Types
- [ ] `packages/types` — sync `TradeItem`, `Summary`, `ApiResponse` with what frontend already uses
- [ ] Single source of truth — frontend imports from `@tradeai/types`

**Deliverable:** `docker-compose up` → postgres + redis running. DB migrations run clean.

---

## Phase 2 — Python AI Service
**Goal:** Stateless FastAPI service that does two things well — extract and classify.

### 2.1 PDF Extraction Endpoint
```
POST /extract
Input:  { file: PDF bytes, language: 'en' | 'ar' }
Output: { items: [{ line_number, description, quantity, origin, unit_value }] }
Model:  claude-haiku-4-5  (fast + cheap, extraction is straightforward)
```

**Arabic support** — this is a differentiator. Invoice descriptions in Arabic are
extracted and transliterated to English for classification, Arabic preserved in output.

Prompt strategy:
```
System: "You are a UAE customs document specialist. Extract every line item
from this shipping invoice. For Arabic text, extract as-is and provide
English translation. Return structured JSON only."
```

### 2.2 HS Classification Endpoint
```
POST /classify
Input:  { description, origin_country, quantity, unit_value, language }
Output: {
  hs_code: "8471.30.00.00",
  title: "Portable ADP machines ≤10kg",
  chapter: "Ch. 84",
  confidence: 0.97,
  reasoning: "...",
  alternatives: [...],
  risk_level: "Clear",
  flag_note: null
}
```

Model routing — cost optimisation built in:
```python
def pick_model(description: str) -> str:
    # Chemicals (Ch.28-29), DG, dual-use → Sonnet (better reasoning)
    if is_sensitive(description):
        return "claude-sonnet-4-6"
    # Everything else → Haiku (6x cheaper)
    return "claude-haiku-4-5-20251001"
```

Prompt strategy — GCC-specific, not generic:
```
System: "You are a GCC customs tariff expert specialising in UAE Mirsal 2
declarations. Classify to the full 12-digit GCC Integrated Customs Tariff
(6 WCO + 2 GCC regional + 4 UAE national). January 2026 tariff schedule.
Always return the 12-digit code. Flag dual-use goods."
```

### 2.3 Health + Error Handling
- [ ] `GET /health` — returns model availability + Claude API status
- [ ] Structured error responses matching `ApiError` type
- [ ] Request timeout: 30s max per classification

**Deliverable:** `curl -X POST localhost:8000/classify -d '{"description":"Dell laptop"}'`
returns a valid GCC 12-digit code with reasoning.

---

## Phase 3 — Node API Core
**Goal:** Job lifecycle management + the 3-layer resolver.

### 3.1 Three-Layer HS Resolver
This is the core of the product — gets smarter and cheaper over time.

```typescript
// services/hs-resolver.ts
async function resolve(description: string): Promise<ClassifyResult> {

  const normalized = normalize(description)  // lowercase, strip punctuation

  // Layer 1 — Redis exact match (~1ms, free)
  const hash = sha256(normalized)
  const cached = await redis.get(`hs:${hash}`)
  if (cached) return { ...JSON.parse(cached), source: 'cache' }

  // Layer 2 — pgvector semantic match (~20ms, ~$0.00001)
  const embedding = await embed(normalized)
  const similar = await db.findSimilar(embedding, threshold: 0.92)
  if (similar) {
    await redis.set(`hs:${hash}`, JSON.stringify(similar), 'EX', 86400)
    return { ...similar, source: 'vector' }
  }

  // Layer 3 — Claude API (~2-4s, ~$0.008)
  const result = await aiService.classify(description)
  await db.storeInCache({ description, embedding, ...result })
  await redis.set(`hs:${hash}`, JSON.stringify(result), 'EX', 86400)
  return { ...result, source: 'ai' }
}
```

### 3.2 API Endpoints

```
POST /classify/text
  Body: { text: string }
  → sync (single item, < 5s)
  → returns TradeData directly

POST /classify/document
  Body: multipart/form-data { file: PDF }
  → async (creates job, returns jobId immediately)
  → returns { jobId, status: 'pending' }

GET  /classify/:jobId/stream   ← SSE
  → streams progress events to drive processing screen
  → events: { step, progress, completedItems, totalItems }

GET  /classify/:jobId
  → poll job status + results when complete

POST /classify/:jobId/override
  Body: { resultId, hsCode }
  → user overrides AI result → stored + fed back to cache as verified

GET  /export/:jobId/csv
GET  /export/:jobId/mirsal    ← Mirsal 2 XML (the differentiator)

GET  /health
```

### 3.3 SSE Progress Streaming
This drives the processing screen's live steps — the demo wow factor.

```typescript
// Events pushed during a document classification job:
{ event: 'step', data: { key: 'extract', status: 'active' } }
{ event: 'step', data: { key: 'extract', status: 'done' } }
{ event: 'step', data: { key: 'classify', status: 'active', item: 3, total: 16 } }
{ event: 'progress', data: { percent: 45 } }
{ event: 'complete', data: { jobId } }
{ event: 'error', data: { message } }
```

**Deliverable:** Upload a PDF, watch the processing screen fill in live, results appear.

---

## Phase 4 — Mirsal 2 XML Export
**Goal:** The output nobody else produces for SMEs — paste directly into Dubai Customs.

### 4.1 Mirsal 2 XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomsDeclaration>
  <DeclarationHeader>
    <DeclarantCode>...</DeclarantCode>
    <DeclarationDate>2026-06-04</DeclarationDate>
    <ReferenceNo>INV-2026-04471</ReferenceNo>
  </DeclarationHeader>
  <GoodItems>
    <GoodItem>
      <ItemNumber>1</ItemNumber>
      <HSCode>8471300000</HSCode>        <!-- 12-digit, no dots -->
      <Description>Portable ADP machines</Description>
      <OriginCountry>CN</OriginCountry>
      <Quantity>120</Quantity>
      <UnitOfMeasure>PCE</UnitOfMeasure>
      <CustomsValue>...</CustomsValue>
    </GoodItem>
  </GoodItems>
</CustomsDeclaration>
```

### 4.2 CSV Export
Standard columns matching what freight forwarders paste into their TMS:
`Line#, Description, HSCode, Title, Confidence, Risk, OFAC, UN, EU, Reasoning`

**Deliverable:** Click "Export Mirsal 2" → download XML → open in text editor → valid
structure. This is what you show in the demo.

---

## Phase 5 — Sanctions Screening
**Goal:** OFAC/UN/EU flag inline with every classification. No separate tool needed.

### 5.1 Self-Hosted OpenSanctions (Free for Demo)
- Download OpenSanctions consolidated dataset (weekly CSV dump, free)
- Load into `sanctions_entries` table on startup
- Screen by: entity name + HS code combination
- Returns: `{ ofac: 'Clear'|'Review'|'Flagged', un: ..., eu: ... }`

### 5.2 Dual-Use Goods Flag
- Maintain a static list of HS codes with export control implications
  (Ch. 28-29 chemicals, Ch. 84-85 electronics with military use, Ch. 93 arms)
- Flag automatically during classification
- Add `flagNote` explaining why

**Deliverable:** Classify a shipment with a sanctions-adjacent HS code → see
"Flagged" in results with reason. Visible in the demo.

---

## Phase 6 — Frontend Wiring
**Goal:** Replace the demo stub in `classify-api.ts` with real API calls.

### 6.1 Replace the Stub
```typescript
// apps/web/src/infrastructure/adapters/api/classify-api.ts
export async function classifyDocuments(payload: ClassifyPayload): Promise<string> {
  const formData = new FormData()
  if (payload.documents?.[0]) formData.append('file', payload.documents[0])
  if (payload.text) formData.append('text', payload.text)

  const res = await fetch(`${CONFIG.apiBaseUrl}/classify/document`, {
    method: 'POST',
    body: formData,
  })
  const { jobId } = await res.json()
  return jobId
}

export function streamJobProgress(jobId: string, onEvent: (e: ProgressEvent) => void) {
  const es = new EventSource(`${CONFIG.apiBaseUrl}/classify/${jobId}/stream`)
  es.onmessage = (e) => onEvent(JSON.parse(e.data))
  return () => es.close()
}
```

### 6.2 Processing Screen
- Connect SSE stream to the existing step animation
- Real steps replace the hardcoded timer
- `completed_items / total_items` drives the progress bar

### 6.3 Results Screen
- Fetch real results from `/classify/:jobId`
- Map API response to existing `TradeItem` shape (already matches)
- Export buttons hit real `/export/:jobId/csv` and `/export/:jobId/mirsal`

**Deliverable:** Upload a real invoice PDF → processing screen shows live steps →
real HS codes appear in results table → download real Mirsal 2 XML.

---

## Phase 7 — Demo Polish (The Networking Tool)
**Goal:** Make this impressive enough to open doors, not just functional.

### 7.1 Demo Mode
- Pre-loaded Shippify-style invoice (UAE freight, realistic items)
- One click "Load Demo Invoice" on landing screen
- Runs through the full flow with real AI in ~10 seconds
- Shows the Arabic invoice variant as a second demo

### 7.2 Branding for Pitches
- `VITE_CLIENT_NAME=Shippify UAE` already in config — shows their name in the UI
- White-label ready: swap logo + client name via env vars
- Works on mobile — show it on your phone in a meeting

### 7.3 Confidence Calibration
- If AI confidence < 75%, show "Needs Review" prominently
- Never show a code we're not confident in as "Clear"
- Better to say "Review this one" than to be wrong — builds trust with forwarders

### 7.4 The One Slide That Goes With the Demo
```
Before TradeAI:         After TradeAI:
50-line invoice →       50-line invoice →
3 hours manual work     47 seconds
AED 50k fine risk       Sanctions screened
8-digit rejection       Mirsal 2 XML ready
```

---

## What Makes This Stand Out vs Every Competitor

| Feature | Al Munasiq | Portmind | Us |
|---|---|---|---|
| Bulk invoice upload | ✗ | ✓ (enterprise) | ✓ SME-friendly |
| Arabic invoices | ✗ | ✗ | ✓ |
| Mirsal 2 XML export | ✗ | Unconfirmed | ✓ |
| Sanctions inline | ✗ | ✗ | ✓ |
| Self-serve (no sales call) | ✓ (free, gov) | ✗ | ✓ |
| SME pricing | Free (limited) | Enterprise | Affordable |
| Audit trail + reasoning | ✗ | ✓ | ✓ |
| User override → feeds cache | ✗ | ✗ | ✓ |

---

## Build Order Summary

| Phase | What | Est. Time |
|---|---|---|
| 1 | Local dev setup + DB schema | 1 day |
| 2 | Python AI service (extract + classify) | 1-2 days |
| 3 | Node API (jobs + resolver + SSE) | 2 days |
| 4 | Mirsal 2 XML + CSV export | 1 day |
| 5 | Sanctions screening | 1 day |
| 6 | Frontend wiring (replace stub) | 1 day |
| 7 | Demo polish | 1 day |
| **Total** | **Working demo** | **~8-9 days** |

---

## Tech Stack (Final)

| Layer | Tech | Why |
|---|---|---|
| Web | React/Vite → Vercel | Already built |
| API | Node/TS Fastify → Railway | Zero ops, portable container |
| AI service | Python FastAPI + Mangum → Railway | Async, Claude SDK, portable |
| DB | NeonDB (Postgres + pgvector) | Free tier, serverless, pgvector built-in |
| Cache | Upstash Redis | Free tier, zero ops |
| Files | Cloudflare R2 | S3-compatible API, free 10GB |
| Claude extraction | claude-haiku-4-5-20251001 | Fast + cheap, extraction is simple |
| Claude commodity | claude-haiku-4-5-20251001 | 80% of classifications |
| Claude DG/chemicals | claude-sonnet-4-6 | Ch.28-29, dual-use, ambiguous |

**Total prototype cost: ~$0/month on free tiers**

### Portability guarantee
Every service runs in Docker. Moving to AWS ECS + ECR later is:
- Build images → push to ECR
- Update `DATABASE_URL`, `REDIS_URL`, `AI_SERVICE_URL` in env
- Deploy task definitions — zero code changes

Client on-prem deployment = hand them `docker-compose.prod.yml` + `.env` template.

---

## Guidelines Reference

Each service has its own engineering guidelines covering folder structure, naming
conventions, coding standards, and portability rules:

| Service | Guidelines file |
|---|---|
| Node/TS API | `apps/api/GUIDELINES.md` |
| Python AI service | `services/ai/GUIDELINES.md` |
| React frontend | `apps/web/GUIDELINES.md` |

Key cross-service contracts:
- All shared TypeScript types live in `packages/types` (`@tradeai/types`)
- All API responses use `{ success: true, data }` or `{ success: false, error }` envelope
- SSE event names: `step`, `progress`, `complete`, `error` — frontend depends on these exactly
- HS code format: 12-digit GCC `XXXX.XX.XX.XX` everywhere — validated by Pydantic regex on AI service

---

## Cost Model at Scale

| Stage | Volume | AI cost | Total infra | vs Pure AI |
|---|---|---|---|---|
| MVP (1 client) | 5k/mo | ~$22 | ~$22 | baseline |
| Early prod (10 clients) | 50k/mo | ~$200 | ~$246 | 40% saving |
| Shippify full (2,500 clients) | 500k/mo | ~$1,000 | ~$1,117 | 72% saving |
| Scale (25+ clients) | 5M/mo | ~$4,500 | ~$4,865 | 84% saving |

Cache hit rate improves over time: 40% cold → 75% at 6 months → 85% at 12 months.
The cache is a proprietary dataset — a moat competitors using pure AI don't build.

---

## Future (Post-Demo)

Validate with one real freight forwarder conversation first. Then:

- **WhatsApp bot** — submit invoice via WhatsApp, get results in chat (biggest UAE UX win)
- **Mirsal 2 direct submit** — API integration into Dubai Trade portal (needs portal approval)
- **Recurring shipment profiles** — same client ships same goods monthly, auto-classify
- **Multi-GCC** — Qatar, Bahrain, Oman have same 12-digit migration (same codebase, different rule sets loaded)
- **ECS/ECR on AWS** — already Docker-ready, migration is env vars + task definitions only
- **OpenSanctions → paid feed** — upgrade to Dow Jones / Refinitiv when enterprise clients need it
