# LLM Cost Optimisation — 3-Layer Classification Architecture

## Current State

Every classification request that misses the Redis cache goes directly to the LLM at ~$0.008 per call. With volume this adds up fast.

The architecture already has 3 layers designed for this. Layer 1 and 3 are live. **Layer 2 (pgvector semantic search) is stubbed** and is the main lever for cost reduction.

```
Request
  │
  ▼
Layer 1 — Redis exact match        ~1ms    $0.000   (live)
  │ miss
  ▼
Layer 2 — pgvector semantic match  ~20ms   $0.00002 (stubbed — returns null)
  │ miss
  ▼
Layer 3 — LLM classification       ~3s     $0.008   (live)
```

---

## How Layer 2 Works

When "Dell XPS 15 laptop 16GB RAM" is classified, the result is stored in the DB.

Later, "Dell laptop 16GB Intel i7" comes in — it's a different string so Layer 1 misses. But semantically it's the same product. Layer 2 converts both descriptions into embedding vectors and finds that they are 94% similar — above the 0.92 threshold — so it returns the cached result without touching the LLM.

**Real-world impact:** In customs/freight, descriptions of the same commodity repeat constantly with minor wording variations. Once a commodity type has been classified once, Layer 2 should absorb 60–80% of subsequent similar requests.

---

## What Needs to Be Done

### Step 1 — DB Migration

pgvector extension must be enabled (check with `SELECT * FROM pg_extension WHERE extname = 'vector'`).

Add an embedding column to the cache table:

```sql
ALTER TABLE hs_classification_cache
  ADD COLUMN embedding vector(1536);

CREATE INDEX hs_cache_embedding_idx
  ON hs_classification_cache
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

`vector(1536)` matches the output dimension of `text-embedding-3-small`.

---

### Step 2 — Embeddings Function

Add a function to the Node API (`apps/api/src/infrastructure/embeddings.ts`):

```ts
import OpenAI from 'openai'
import { env } from '@/config/env.js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
}
```

Cost: $0.00002 per 1K tokens. A typical product description is ~20 tokens = $0.0000004 per call — negligible.

---

### Step 3 — Wire `findSimilarInCache`

In `apps/api/src/repositories/cache-repository.ts`, replace the stub:

```ts
import { generateEmbedding } from '@/infrastructure/embeddings.js'

export async function findSimilarInCache(
  normalizedDescription: string,
  threshold: number,
): Promise<CacheHit | null> {
  const embedding = await generateEmbedding(normalizedDescription)
  const vector = JSON.stringify(embedding)

  const [hit] = await db<CacheHit[]>`
    SELECT hs_code, hs_title, confidence
    FROM hs_classification_cache
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> ${vector}::vector) > ${threshold}
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 1
  `
  return hit ?? null
}
```

---

### Step 4 — Store Embeddings on Layer 3 Results

In `storeInCache`, generate and persist the embedding alongside the HS result so future similar descriptions can find it:

```ts
export async function storeInCache(entry: {
  descriptionHash: string
  description: string
  hsCode: string
  hsTitle: string | null
  confidence: number
}): Promise<void> {
  const embedding = await generateEmbedding(entry.description)
  const vector = JSON.stringify(embedding)

  await db`
    INSERT INTO hs_classification_cache (
      description_hash, description, hs_code, hs_title, confidence, embedding
    ) VALUES (
      ${entry.descriptionHash}, ${entry.description},
      ${entry.hsCode}, ${entry.hsTitle ?? null},
      ${entry.confidence}, ${vector}::vector
    )
    ON CONFLICT (description_hash) DO UPDATE SET
      hit_count = hs_classification_cache.hit_count + 1,
      updated_at = NOW()
  `
}
```

---

## Cost Model at Scale

| Volume | Without Layer 2 | With Layer 2 (est. 70% hit rate) | Saving |
|--------|----------------|----------------------------------|--------|
| 1,000 classifications/month | $8 | $2.60 | $5.40 |
| 10,000 / month | $80 | $26 | $54 |
| 100,000 / month | $800 | $260 | $540 |
| 1,000,000 / month | $8,000 | $2,600 | $5,400 |

Layer 2 embedding calls add ~$0.04 per 1,000 requests — rounding error against the LLM savings.

Hit rate improves over time as the cache warms up. After the first month of real traffic, common commodities (electronics, textiles, food) will be fully cached and the effective LLM hit rate drops further.

---

## Similarity Threshold

Currently set at `0.92` in `resolver.ts`. This controls the trade-off:

- **Higher (0.95+):** Fewer false cache hits, more LLM calls, higher cost
- **Lower (0.85–0.90):** More cache hits, risk of returning a wrong HS code for a different product

`0.92` is a reasonable starting point. Tune it after observing real traffic — log `source: 'vector'` hits and spot-check accuracy.

---

## Files to Change When Implementing

| File | Change |
|------|--------|
| `infra/db/migrations/003_embeddings.sql` | New migration — add `embedding` column + index |
| `apps/api/src/infrastructure/embeddings.ts` | New file — `generateEmbedding()` |
| `apps/api/src/repositories/cache-repository.ts` | Wire `findSimilarInCache` + update `storeInCache` |
| `apps/api/src/config/env.ts` | Ensure `OPENAI_API_KEY` is present (already used by AI service) |

No changes needed to `resolver.ts`, routes, or the frontend — the layer abstraction is already clean.
