import { normalizeDescription, sha256 } from './normalizer.js';
import type { ClassifyResult, ClassifyContext } from './types.js';
import { getCacheByHash, findSimilarInCache, storeInCache, setCacheByHash } from '@/repositories/cache-repository.js';
import { aiClassify } from '@/infrastructure/ai-service/client.js';
import { screenItem } from '@/domain/sanctions/screener.js';

export class ClassificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ClassificationError';
  }
}

const SIMILARITY_THRESHOLD = 0.92;
const CACHE_TTL_SECONDS = 86_400; // 24h

const SEVERITY: Record<string, number> = { Clear: 0, Review: 1, Flagged: 2 };

function maxSeverity(
  a: ClassifyResult['riskLevel'],
  b: ClassifyResult['riskLevel'],
): ClassifyResult['riskLevel'] {
  return (SEVERITY[a] ?? 0) >= (SEVERITY[b] ?? 0) ? a : b;
}

function buildCacheResult(
  hit: { hs_code: string; hs_title: string | null; confidence: number },
  sanctions: Awaited<ReturnType<typeof screenItem>>,
  source: 'cache' | 'vector',
): ClassifyResult {
  return {
    hsCode: hit.hs_code,
    hsTitle: hit.hs_title ?? '',
    hsChapter: '',
    confidence: hit.confidence,
    riskLevel: maxSeverity(sanctions.riskLevel, 'Clear'),
    aiReasoning: `Classified from ${source === 'cache' ? 'exact match' : 'semantic match'} in classification cache.`,
    alternatives: [],
    sanctionsOfac: sanctions.ofac,
    sanctionsUn: sanctions.un,
    sanctionsEu: sanctions.eu,
    flagNote: sanctions.flagNote,
    source,
  };
}

export async function resolveHsCode(
  description: string,
  context?: ClassifyContext,
): Promise<ClassifyResult> {
  if (!description.trim()) {
    throw new ClassificationError('Description cannot be empty', 'EMPTY_DESCRIPTION', 400);
  }

  const normalized = normalizeDescription(description);
  const hash = sha256(normalized);

  // Layer 1 — Redis exact match (~1ms, $0)
  const cached = await getCacheByHash(hash);
  if (cached) {
    const sanctions = await screenItem(description, cached.hs_code);
    return buildCacheResult(cached, sanctions, 'cache');
  }

  // Layer 2 — pgvector semantic match (~20ms, $0)
  // Note: stub until embeddings are integrated — always returns null for now
  const similar = await findSimilarInCache(normalized, SIMILARITY_THRESHOLD);
  if (similar) {
    await setCacheByHash(hash, similar, CACHE_TTL_SECONDS);
    const sanctions = await screenItem(description, similar.hs_code);
    return buildCacheResult(similar, sanctions, 'vector');
  }

  // Layer 3 — AI classification (~2-4s, ~$0.008 per call)
  const aiResult = await aiClassify({
    description,
    originCountry: context?.originCountry,
    quantity: context?.quantity,
    unitValue: context?.unitValue,
    language: context?.language ?? 'en',
  });

  // Strip any dots the model may add defensively, enforce exactly 12 digits
  aiResult.hsCode = aiResult.hsCode.replace(/\./g, '').slice(0, 12).padEnd(12, '0');

  const [sanctions] = await Promise.all([
    screenItem(description, aiResult.hsCode),
    storeInCache({
      descriptionHash: hash,
      description: normalized,
      hsCode: aiResult.hsCode,
      hsTitle: aiResult.title,
      confidence: aiResult.confidence,
    }),
    setCacheByHash(
      hash,
      { hs_code: aiResult.hsCode, hs_title: aiResult.title, confidence: aiResult.confidence },
      CACHE_TTL_SECONDS,
    ),
  ]);

  return {
    hsCode: aiResult.hsCode,
    hsTitle: aiResult.title,
    hsChapter: aiResult.chapter,
    confidence: aiResult.confidence,
    riskLevel: maxSeverity(aiResult.riskLevel, sanctions.riskLevel),
    aiReasoning: aiResult.reasoning,
    alternatives: aiResult.alternatives.map((a) => ({ code: a.hsCode, reason: a.title })),
    sanctionsOfac: sanctions.ofac,
    sanctionsUn: sanctions.un,
    sanctionsEu: sanctions.eu,
    flagNote: [aiResult.flagNote, sanctions.flagNote].filter(Boolean).join(' | ') || null,
    source: 'ai',
    sourceModel: aiResult.sourceModel,
  };
}
