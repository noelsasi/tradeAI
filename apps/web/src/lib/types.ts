export type Risk = 'Clear' | 'Review' | 'Flagged'
export type SanctionStatus = 'Clear' | 'Review' | 'Flagged'
export interface JobSummary {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input_type: 'text' | 'document'
  file_name: string | null
  total_items: number
  completed_items: number
  error: string | null
  created_at: string
  updated_at: string
}

export interface JobHistoryResponse {
  jobs: JobSummary[]
  total: number
  page: number
  pageSize: number
}

export interface AlternativeCode {
  code: string
  reason: string
}

export interface Sanctions {
  ofac: SanctionStatus
  un: SanctionStatus
  eu: SanctionStatus
}

export interface TradeItem {
  id: number
  desc: string
  origin: string
  qty: string
  hs: string
  title: string
  chapter: string
  confidence: number
  risk: Risk
  reasoning: string
  alternatives: AlternativeCode[]
  sanctions: Sanctions
  flagNote?: string
}

export interface Summary {
  total: number
  clear: number
  review: number
  flagged: number
  sanctions: number
  processingTime: number
  complianceScore: number
}

export interface ProcessingStep {
  key: string
  label: string
  detail: string
}

export interface DocMeta {
  client: string
  files: string[]
  ref: string
}

export interface TradeData {
  items: TradeItem[]
  summary: Summary
  processingSteps: ProcessingStep[]
  docMeta: DocMeta
}
