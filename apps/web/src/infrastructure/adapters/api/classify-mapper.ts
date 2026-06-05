import { CONFIG } from '@/infrastructure/config'
import type { TradeData, TradeItem, Summary } from '@/lib/types'

// Stored as 12 raw digits, display as "XXXX.XX.XX.XXXX" e.g. "8471.30.00.0000"
function formatHsCode(raw: string): string {
  const digits = raw.replace(/\./g, '')
  if (digits.length !== 12) return raw
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}.${digits.slice(8, 12)}`
}

export interface ClassifyResult {
  hsCode: string
  hsTitle: string
  hsChapter: string
  confidence: number
  riskLevel: 'Clear' | 'Review' | 'Flagged'
  aiReasoning: string
  alternatives: Array<{ code: string; reason: string }>
  sanctionsOfac: 'Clear' | 'Review' | 'Flagged'
  sanctionsUn: 'Clear' | 'Review' | 'Flagged'
  sanctionsEu: 'Clear' | 'Review' | 'Flagged'
  flagNote: string | null
  source: string
  sourceModel?: string
}

export interface ApiResultRow {
  id: string
  job_id: string
  line_number: number
  raw_description: string
  hs_code: string | null
  hs_title: string | null
  hs_chapter: string | null
  confidence: number | null
  risk_level: 'Clear' | 'Review' | 'Flagged' | null
  ai_reasoning: string | null
  alternatives: Array<{ code: string; reason: string }> | null
  sanctions_ofac: 'Clear' | 'Review' | 'Flagged'
  sanctions_un: 'Clear' | 'Review' | 'Flagged'
  sanctions_eu: 'Clear' | 'Review' | 'Flagged'
  flag_note: string | null
  user_overridden: boolean
  user_override_code: string | null
}

const PROCESSING_STEPS = [
  { key: 'extract', label: 'Extracting line items from documents', detail: '' },
  { key: 'classify', label: 'Classifying GCC HS codes', detail: 'Matched against 12-digit GCC tariff schedule' },
  { key: 'screen', label: 'Screening sanctions & watchlists', detail: 'OFAC · UN · EU consolidated lists' },
  { key: 'report', label: 'Generating compliance report', detail: 'Mirsal 2 format · risk scoring' },
]

export function mapTextResultToTradeData(
  result: ClassifyResult,
  text: string,
  startTime: number,
): TradeData {
  const item: TradeItem = {
    id: 1,
    desc: text,
    origin: '',
    qty: '',
    hs: formatHsCode(result.hsCode),
    title: result.hsTitle,
    chapter: result.hsChapter,
    confidence: Math.round(result.confidence * 100),
    risk: result.riskLevel,
    reasoning: result.aiReasoning,
    alternatives: result.alternatives.map((a) => ({ ...a, code: formatHsCode(a.code) })),
    sanctions: {
      ofac: result.sanctionsOfac,
      un: result.sanctionsUn,
      eu: result.sanctionsEu,
    },
    flagNote: result.flagNote ?? undefined,
  }

  const hasSanctionsHit = result.sanctionsOfac !== 'Clear' || result.sanctionsUn !== 'Clear' || result.sanctionsEu !== 'Clear'
  const summary: Summary = {
    total: 1,
    clear: result.riskLevel === 'Clear' ? 1 : 0,
    review: result.riskLevel === 'Review' ? 1 : 0,
    flagged: result.riskLevel === 'Flagged' ? 1 : 0,
    sanctions: hasSanctionsHit ? 1 : 0,
    processingTime: Math.round((Date.now() - startTime) / 100) / 10,
    complianceScore: result.riskLevel === 'Clear' && !hasSanctionsHit ? 100 : result.riskLevel === 'Review' ? 50 : 0,
  }

  return {
    items: [item],
    summary,
    processingSteps: PROCESSING_STEPS.map((s) =>
      s.key === 'extract' ? { ...s, detail: '1 line item detected' } : s,
    ),
    docMeta: {
      client: CONFIG.clientName,
      files: [],
      ref: 'Text Classification',
    },
  }
}

export function mapJobResultsToTradeData(
  data: { job: unknown; results: ApiResultRow[] },
  jobId: string,
): TradeData {
  const rows = data.results ?? []
  const job = data.job as Record<string, unknown> | null | undefined
  const startTime = job?.created_at ? new Date(job.created_at as string).getTime() : Date.now()
  const endTime = job?.updated_at ? new Date(job.updated_at as string).getTime() : Date.now()

  const items: TradeItem[] = rows.map((r, idx) => ({
    id: idx + 1,
    desc: r.raw_description,
    origin: '',
    qty: '',
    hs: formatHsCode(r.user_overridden && r.user_override_code ? r.user_override_code : (r.hs_code ?? '')),
    title: r.hs_title ?? '',
    chapter: r.hs_chapter ?? '',
    confidence: r.confidence != null ? Math.round(r.confidence * 100) : 0,
    risk: r.risk_level ?? 'Review',
    reasoning: r.ai_reasoning ?? '',
    alternatives: ((): Array<{ code: string; reason: string }> => {
      const raw = r.alternatives
      if (!raw) return []
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(arr) ? arr.map((a) => ({ ...a, code: formatHsCode(a.code) })) : []
    })(),
    sanctions: {
      ofac: r.sanctions_ofac,
      un: r.sanctions_un,
      eu: r.sanctions_eu,
    },
    flagNote: r.flag_note ?? undefined,
  }))

  const summary: Summary = {
    total: items.length,
    clear: items.filter((i) => i.risk === 'Clear').length,
    review: items.filter((i) => i.risk === 'Review').length,
    flagged: items.filter((i) => i.risk === 'Flagged').length,
    sanctions: items.filter(
      (i) => i.sanctions.ofac !== 'Clear' || i.sanctions.un !== 'Clear' || i.sanctions.eu !== 'Clear',
    ).length,
    processingTime: Math.round((endTime - startTime) / 100) / 10,
    complianceScore: items.length === 0 ? 0 : Math.round(
      (items.filter((i) => i.risk === 'Clear').length / items.length) * 100,
    ),
  }

  return {
    items,
    summary,
    processingSteps: PROCESSING_STEPS.map((s) =>
      s.key === 'extract' ? { ...s, detail: `${items.length} line items detected` } : s,
    ),
    docMeta: {
      client: CONFIG.clientName,
      files: [job?.file_name as string ?? 'invoice.pdf'],
      ref: (job?.file_name as string)?.replace(/\.pdf$/i, '') ?? jobId.slice(0, 8).toUpperCase(),
    },
  }
}
