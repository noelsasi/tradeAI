import type { JobStatus, InputType, RiskLevel, ClassifySource, SanctionStatus } from '@tradeai/types';

export interface Job {
  id: string;
  status: JobStatus;
  input_type: InputType;
  file_name: string | null;
  file_url: string | null;
  total_items: number;
  completed_items: number;
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJobInput {
  inputType: InputType;
  fileName?: string;
  fileUrl?: string;
  totalItems?: number;
}

export interface ClassifyResult {
  hsCode: string;
  hsTitle: string;
  hsChapter: string;
  confidence: number;
  riskLevel: RiskLevel;
  aiReasoning: string;
  alternatives: Array<{ code: string; reason: string }>;
  sanctionsOfac: SanctionStatus;
  sanctionsUn: SanctionStatus;
  sanctionsEu: SanctionStatus;
  flagNote: string | null;
  source: ClassifySource;
  sourceModel?: string;
}

export interface ClassifyContext {
  originCountry?: string;
  quantity?: string;
  unitValue?: number;
  language?: 'en' | 'ar';
}

export interface CacheEntry {
  description_hash: string;
  description: string;
  hs_code: string;
  hs_title: string | null;
  confidence: number;
  verified: boolean;
  hit_count: number;
}

export interface ResultRow {
  id: string;
  job_id: string;
  line_number: number;
  raw_description: string;
  normalized_description: string;
  hs_code: string | null;
  hs_title: string | null;
  hs_chapter: string | null;
  confidence: number | null;
  risk_level: RiskLevel | null;
  source: ClassifySource | null;
  ai_reasoning: string | null;
  alternatives: Array<{ code: string; reason: string }> | null;
  sanctions_ofac: SanctionStatus;
  sanctions_un: SanctionStatus;
  sanctions_eu: SanctionStatus;
  flag_note: string | null;
  user_overridden: boolean;
  user_override_code: string | null;
  created_at: Date;
}
