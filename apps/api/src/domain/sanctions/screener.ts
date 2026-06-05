import type { SanctionStatus } from '@tradeai/types';
import { checkDualUse } from './dual-use.js';
import { findSanctionsMatches } from '@/repositories/sanctions-repository.js';

export interface SanctionsResult {
  ofac: SanctionStatus;
  un: SanctionStatus;
  eu: SanctionStatus;
  riskLevel: SanctionStatus;
  flagNote: string | null;
}

// Severity order for merging multiple results
const SEVERITY: Record<SanctionStatus, number> = { Clear: 0, Review: 1, Flagged: 2 };

function max(a: SanctionStatus, b: SanctionStatus): SanctionStatus {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

export async function screenItem(
  description: string,
  hsCode: string,
): Promise<SanctionsResult> {
  // 1. Dual-use static check (sync, no DB)
  const dualUse = checkDualUse(hsCode);

  // 2. Sanctions DB lookup — entity name keywords + HS code
  const dbMatches = await findSanctionsMatches(description, hsCode);

  let ofac: SanctionStatus = 'Clear';
  let un: SanctionStatus = 'Clear';
  let eu: SanctionStatus = 'Clear';
  const notes: string[] = [];

  for (const match of dbMatches) {
    const level: SanctionStatus = 'Flagged';
    if (match.list_name === 'ofac') ofac = max(ofac, level);
    if (match.list_name === 'un') un = max(un, level);
    if (match.list_name === 'eu') eu = max(eu, level);
    notes.push(`${match.list_name.toUpperCase()} sanctions match: ${match.entity_name}`);
  }

  // 3. Merge dual-use into flags
  const overallRisk = max(
    dualUse.riskLevel as SanctionStatus,
    max(ofac, max(un, eu)),
  );

  if (dualUse.flagNote) notes.unshift(dualUse.flagNote);

  return {
    ofac,
    un,
    eu,
    riskLevel: overallRisk,
    flagNote: notes.length > 0 ? notes.join(' | ') : null,
  };
}
