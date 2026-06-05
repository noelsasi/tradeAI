import { db } from '@/infrastructure/db/client.js';
import { redis } from '@/infrastructure/cache/redis.js';
import type { CacheEntry } from '@/domain/classification/types.js';

type CacheHit = Pick<CacheEntry, 'hs_code' | 'hs_title' | 'confidence'>;

const REDIS_KEY = (hash: string) => `hs:${hash}`;

// ── Layer 1: Redis ─────────────────────────────────────────────────────────────

export async function getCacheByHash(hash: string): Promise<CacheHit | null> {
  try {
    const raw = await redis.get(REDIS_KEY(hash));
    if (!raw) return null;
    return JSON.parse(raw) as CacheHit;
  } catch {
    return null; // Redis miss — fall through to Layer 2
  }
}

export async function setCacheByHash(
  hash: string,
  entry: CacheHit,
  ttlSeconds: number,
): Promise<void> {
  try {
    await redis.set(REDIS_KEY(hash), JSON.stringify(entry), 'EX', ttlSeconds);
  } catch {
    // Non-fatal — next request will just hit Layer 2/3
  }
}

// ── Layer 2: pgvector ──────────────────────────────────────────────────────────
// Note: embedding generation is not yet wired (needs an embeddings API call).
// For Phase 3 the similarity search returns null — Layer 3 handles it.
// Phase 4+ will add OpenAI embeddings here.

export async function findSimilarInCache(
  _normalizedDescription: string,
  _threshold: number,
): Promise<CacheHit | null> {
  // Placeholder until embeddings are integrated in a later phase
  return null;
}

// ── Store new entry (from Layer 3 AI result) ──────────────────────────────────

export async function storeInCache(entry: {
  descriptionHash: string;
  description: string;
  hsCode: string;
  hsTitle: string | null;
  confidence: number;
}): Promise<void> {
  await db`
    INSERT INTO hs_classification_cache (
      description_hash, description, hs_code, hs_title, confidence
    ) VALUES (
      ${entry.descriptionHash}, ${entry.description},
      ${entry.hsCode}, ${entry.hsTitle ?? null}, ${entry.confidence}
    )
    ON CONFLICT (description_hash) DO UPDATE SET
      hit_count = hs_classification_cache.hit_count + 1,
      updated_at = NOW()
  `;
}

export async function markCacheVerified(descriptionHash: string): Promise<void> {
  await db`
    UPDATE hs_classification_cache
    SET verified = TRUE, updated_at = NOW()
    WHERE description_hash = ${descriptionHash}
  `;
}
