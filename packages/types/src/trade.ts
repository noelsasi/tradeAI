// ── Enums / literals ──────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type InputType = 'text' | 'document';
export type RiskLevel = 'Clear' | 'Review' | 'Flagged';
export type ClassifySource = 'cache' | 'vector' | 'ai';
export type SanctionStatus = 'Clear' | 'Review' | 'Flagged';

// ── Classification job ─────────────────────────────────────────────────────────

export interface ClassificationJob {
  id: string;
  status: JobStatus;
  inputType: InputType;
  fileName?: string;
  fileUrl?: string;
  totalItems: number;
  completedItems: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Classification result (one per invoice line item) ────────────────────────

export interface HsAlternative {
  hsCode: string;
  title: string;
  confidence: number;
}

export interface ClassificationResult {
  id: string;
  jobId: string;
  lineNumber: number;
  rawDescription: string;
  normalizedDescription: string;
  hsCode: string;
  hsTitle: string;
  hsChapter: string;
  confidence: number;
  riskLevel: RiskLevel;
  source: ClassifySource;
  aiReasoning?: string;
  alternatives: HsAlternative[];
  sanctionsOfac: SanctionStatus;
  sanctionsUn: SanctionStatus;
  sanctionsEu: SanctionStatus;
  flagNote?: string;
  userOverridden: boolean;
  userOverrideCode?: string;
  createdAt: string;
}

// ── SSE progress events ────────────────────────────────────────────────────────

export type StepKey = 'upload' | 'extract' | 'classify' | 'sanctions' | 'export';
export type StepStatus = 'pending' | 'active' | 'done' | 'error';

export interface StepEvent {
  event: 'step';
  data: {
    key: StepKey;
    status: StepStatus;
    item?: number;
    total?: number;
  };
}

export interface ProgressEvent {
  event: 'progress';
  data: { percent: number };
}

export interface CompleteEvent {
  event: 'complete';
  data: { jobId: string };
}

export interface ErrorEvent {
  event: 'error';
  data: { message: string };
}

export type SseEvent = StepEvent | ProgressEvent | CompleteEvent | ErrorEvent;
