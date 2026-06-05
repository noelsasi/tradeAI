import { CONFIG } from '@/infrastructure/config'
import type { TradeData, JobHistoryResponse } from '@/lib/types'
import { mapJobResultsToTradeData } from './classify-mapper'

export type { ApiResultRow, ClassifyResult } from './classify-mapper'

export interface ClassifyPayload {
  documents?: File[]
  text?: string
  language?: 'en' | 'ar'
}

// ── Submit ────────────────────────────────────────────────────────────────────

export async function submitTextClassify(text: string): Promise<string> {
  const res = await fetch(`${CONFIG.apiBaseUrl}/classify/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const { data } = await res.json()
  return data.jobId as string
}

export async function submitDocumentClassify(file: File, language: 'en' | 'ar' = 'en'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('language', language)

  const res = await fetch(`${CONFIG.apiBaseUrl}/classify/document`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`)
  }
  const { data } = await res.json()
  return data.jobId as string
}

// ── Job status ────────────────────────────────────────────────────────────────

export interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_items: number
  completed_items: number
  error: string | null
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${CONFIG.apiBaseUrl}/classify/${jobId}`)
  if (!res.ok) throw new Error(`Failed to fetch job status (${res.status})`)
  const { data } = await res.json()
  return data.job as JobStatus
}

// ── Poll loop — calls onUpdate every 2s until completed/failed ────────────────

export function pollJobProgress(
  jobId: string,
  onUpdate: (job: JobStatus) => void,
  onComplete: () => void,
  onError: (message: string) => void,
): () => void {
  let stopped = false

  async function tick() {
    if (stopped) return
    try {
      const job = await fetchJobStatus(jobId)
      onUpdate(job)
      if (job.status === 'completed') {
        onComplete()
        return
      }
      if (job.status === 'failed') {
        onError(job.error ?? 'Job failed')
        return
      }
    } catch {
      // transient network error — keep polling
    }
    if (!stopped) setTimeout(tick, 2000)
  }

  void tick()
  return () => { stopped = true }
}

// ── Job history ───────────────────────────────────────────────────────────────

export async function fetchJobHistory(page: number = 1, pageSize: number = 20): Promise<JobHistoryResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const res = await fetch(`${CONFIG.apiBaseUrl}/classify?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch job history (${res.status})`)
  const { data } = await res.json()
  return data as JobHistoryResponse
}

// ── Fetch results ─────────────────────────────────────────────────────────────

export async function fetchJobResults(jobId: string): Promise<TradeData> {
  const res = await fetch(`${CONFIG.apiBaseUrl}/classify/${jobId}`)
  if (!res.ok) throw new Error(`Failed to fetch results (${res.status})`)
  const { data } = await res.json()
  return mapJobResultsToTradeData(data, jobId)
}

// ── Exports ───────────────────────────────────────────────────────────────────

export async function downloadCsv(jobId: string, fileName: string): Promise<void> {
  const res = await fetch(`${CONFIG.apiBaseUrl}/export/${jobId}/csv`)
  if (!res.ok) throw new Error(`CSV export failed (${res.status})`)
  const blob = await res.blob()
  triggerDownload(blob, `${fileName}.csv`, 'text/csv')
}

export async function downloadMirsal(jobId: string, fileName: string): Promise<void> {
  const res = await fetch(`${CONFIG.apiBaseUrl}/export/${jobId}/mirsal`)
  if (!res.ok) throw new Error(`Mirsal export failed (${res.status})`)
  const blob = await res.blob()
  triggerDownload(blob, `${fileName}-mirsal2.xml`, 'application/xml')
}

function triggerDownload(blob: Blob, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([blob], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
