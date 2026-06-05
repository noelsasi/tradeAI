import { env } from '@/config/env.js';
import type { ClassifyRequest, ClassifyResponse } from '@tradeai/types';

// Snake_case shape returned by the Python AI service /extract endpoint
export interface ExtractedItem {
  line_number: number;
  description: string;
  quantity?: number;
  origin_country?: string;
  unit_value?: number;
}

export class AiServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 502,
  ) {
    super(message);
    this.name = 'AiServiceError';
  }
}

// Python AI service returns snake_case — map to camelCase shared types here
interface PythonClassifyResponse {
  hs_code: string;
  title: string;
  chapter: string;
  confidence: number;
  reasoning: string;
  risk_level: 'Clear' | 'Review' | 'Flagged';
  flag_note: string | null;
  alternatives: Array<{ code: string; reason: string }>;
  source_model: string;
  sanctions_ofac: 'Clear' | 'Review' | 'Flagged';
  sanctions_un: 'Clear' | 'Review' | 'Flagged';
  sanctions_eu: 'Clear' | 'Review' | 'Flagged';
}

function mapClassifyResponse(raw: PythonClassifyResponse): ClassifyResponse {
  return {
    hsCode: raw.hs_code,
    title: raw.title,
    chapter: raw.chapter,
    confidence: raw.confidence,
    reasoning: raw.reasoning,
    riskLevel: raw.risk_level,
    flagNote: raw.flag_note,
    alternatives: raw.alternatives.map((a) => ({
      hsCode: a.code,
      title: a.reason,
      confidence: 0,
    })),
    sourceModel: raw.source_model,
    sanctionsOfac: raw.sanctions_ofac,
    sanctionsUn: raw.sanctions_un,
    sanctionsEu: raw.sanctions_eu,
  };
}

export async function aiClassify(req: ClassifyRequest): Promise<ClassifyResponse> {
  let res: Response;
  try {
    res = await fetch(`${env.AI_SERVICE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: req.description,
        origin_country: req.originCountry,
        quantity: req.quantity,
        unit_value: req.unitValue,
        language: req.language ?? 'en',
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new AiServiceError('AI service timed out', 'AI_TIMEOUT', 504);
    }
    throw new AiServiceError('AI service unreachable', 'AI_UNREACHABLE', 502);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiServiceError(`AI service returned ${res.status}: ${body}`, 'AI_ERROR', 502);
  }

  const raw = (await res.json()) as PythonClassifyResponse;
  return mapClassifyResponse(raw);
}

export async function aiExtract(formData: FormData): Promise<{ items: ExtractedItem[] }> {
  let res: Response;
  try {
    res = await fetch(`${env.AI_SERVICE_URL}/extract`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new AiServiceError('AI service timed out', 'AI_TIMEOUT', 504);
    }
    throw new AiServiceError('AI service unreachable', 'AI_UNREACHABLE', 502);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiServiceError(`AI service returned ${res.status}: ${body}`, 'AI_ERROR', 502);
  }

  return res.json() as Promise<{ items: ExtractedItem[] }>;
}

export async function aiProcess(jobId: string, formData: FormData): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${env.AI_SERVICE_URL}/process/${jobId}`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(10_000), // just the handoff, not the full job
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new AiServiceError('AI service timed out', 'AI_TIMEOUT', 504);
    }
    throw new AiServiceError('AI service unreachable', 'AI_UNREACHABLE', 502);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiServiceError(`AI service returned ${res.status}: ${body}`, 'AI_ERROR', 502);
  }
}
