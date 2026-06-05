import { resolveHsCode } from './resolver.js';
import { normalizeDescription } from './normalizer.js';
import type { ClassifyContext } from './types.js';
import { updateJobStatus, incrementCompleted, finalizeJob } from '@/repositories/job-repository.js';
import { createResult } from '@/repositories/result-repository.js';
import { aiExtract } from '@/infrastructure/ai-service/client.js';
import type { ExtractedItem } from '@/infrastructure/ai-service/client.js';

export interface LineItemInput {
  lineNumber: number;
  description: string;
  originCountry?: string;
  quantity?: string;
  unitValue?: number;
  language?: 'en' | 'ar';
}

export async function processTextJob(
  jobId: string,
  description: string,
): Promise<void> {
  await updateJobStatus(jobId, 'processing', { totalItems: 1 });
  try {
    const result = await resolveHsCode(description);
    await createResult({
      jobId,
      lineNumber: 1,
      rawDescription: description,
      normalizedDescription: normalizeDescription(description),
      result,
    });
    await incrementCompleted(jobId);
    await finalizeJob(jobId, 'completed');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await finalizeJob(jobId, 'failed', message);
  }
}

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function processDocumentJob(
  jobId: string,
  fileBytes: Buffer,
  language: 'en' | 'ar' = 'en',
  mimeType: string = 'application/pdf',
): Promise<void> {
  await updateJobStatus(jobId, 'processing');
  try {
    // Step 1 — Extract line items via AI service
    const ext = MIME_TO_EXT[mimeType] ?? 'pdf';
    const formData = new FormData();
    formData.append('file', new Blob([fileBytes.buffer as ArrayBuffer], { type: mimeType }), `invoice.${ext}`);
    formData.append('language', language);

    const { items } = await aiExtract(formData);
    await updateJobStatus(jobId, 'processing', { totalItems: items.length });

    // Step 2 — Classify each line item
    for (const item of items) {
      const context: ClassifyContext = {
        originCountry: item.origin_country ?? undefined,
        quantity: item.quantity ?? undefined,
        unitValue: item.unit_value ?? undefined,
        language,
      };

      try {
        const result = await resolveHsCode(item.description, context);
        await createResult({
          jobId,
          lineNumber: item.line_number,
          rawDescription: item.description,
          normalizedDescription: normalizeDescription(item.description),
          result,
        });
      } catch {
        // Store failed result so job can still complete with partial data
        await createResult({
          jobId,
          lineNumber: item.line_number,
          rawDescription: item.description,
          normalizedDescription: normalizeDescription(item.description),
          result: {
            hsCode: '',
            hsTitle: '',
            hsChapter: '',
            confidence: 0,
            riskLevel: 'Review',
            aiReasoning: 'Classification failed',
            alternatives: [],
            sanctionsOfac: 'Clear',
            sanctionsUn: 'Clear',
            sanctionsEu: 'Clear',
            flagNote: null,
            source: 'ai',
          },
        });
      }

      await incrementCompleted(jobId);
    }

    await finalizeJob(jobId, 'completed');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await finalizeJob(jobId, 'failed', message);
  }
}
