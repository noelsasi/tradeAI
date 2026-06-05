import type { RiskLevel, SanctionStatus, HsAlternative } from './trade.js';

// ── Extract endpoint ──────────────────────────────────────────────────────────

export interface ExtractRequest {
  language: 'en' | 'ar';
}

export interface ExtractedItem {
  lineNumber: number;
  description: string;
  quantity?: number;
  originCountry?: string;
  unitValue?: number;
}

export interface ExtractResponse {
  items: ExtractedItem[];
}

// ── Classify endpoint ─────────────────────────────────────────────────────────

export interface ClassifyRequest {
  description: string;
  originCountry?: string;
  quantity?: string;
  unitValue?: number;
  language?: 'en' | 'ar';
}

export interface ClassifyResponse {
  hsCode: string;
  title: string;
  chapter: string;
  confidence: number;
  reasoning: string;
  alternatives: HsAlternative[];
  riskLevel: RiskLevel;
  sanctionsOfac: SanctionStatus;
  sanctionsUn: SanctionStatus;
  sanctionsEu: SanctionStatus;
  flagNote?: string | null;
  sourceModel?: string;
}
