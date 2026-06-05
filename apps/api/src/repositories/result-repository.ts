import { db } from '@/infrastructure/db/client.js';
import type { ResultRow } from '@/domain/classification/types.js';
import type { ClassifyResult } from '@/domain/classification/types.js';

export interface CreateResultInput {
  jobId: string;
  lineNumber: number;
  rawDescription: string;
  normalizedDescription: string;
  result: ClassifyResult;
}

export async function createResult(input: CreateResultInput): Promise<ResultRow> {
  const { jobId, lineNumber, rawDescription, normalizedDescription, result } = input;
  const [row] = await db<ResultRow[]>`
    INSERT INTO classification_results (
      job_id, line_number, raw_description, normalized_description,
      hs_code, hs_title, hs_chapter, confidence,
      risk_level, source, ai_reasoning, alternatives,
      sanctions_ofac, sanctions_un, sanctions_eu, flag_note
    ) VALUES (
      ${jobId}, ${lineNumber}, ${rawDescription}, ${normalizedDescription},
      ${result.hsCode}, ${result.hsTitle}, ${result.hsChapter}, ${result.confidence},
      ${result.riskLevel}, ${result.source}, ${result.aiReasoning ?? null},
      ${JSON.stringify(result.alternatives)},
      ${result.sanctionsOfac}, ${result.sanctionsUn}, ${result.sanctionsEu},
      ${result.flagNote}
    )
    RETURNING *
  `;
  return row;
}

export async function getResultsByJobId(jobId: string): Promise<ResultRow[]> {
  return db<ResultRow[]>`
    SELECT *
    FROM classification_results
    WHERE job_id = ${jobId}
    ORDER BY line_number ASC
  `;
}

export async function applyUserOverride(resultId: string, hsCode: string): Promise<void> {
  await db`
    UPDATE classification_results
    SET user_overridden = TRUE, user_override_code = ${hsCode}
    WHERE id = ${resultId}
  `;
}
