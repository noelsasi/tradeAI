import { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { COLORS } from '@/common/config/theme'
import { fetchJobHistory, fetchJobResults } from '@/infrastructure/adapters/api/classify-api'
import type { JobSummary } from '@/lib/types'
import { useAppStore } from '@/store/app-store'

const PAGE_SIZE = 20

const STATUS_STYLE: Record<string, { text: string; bg: string; border: string; label: string }> = {
  completed: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Completed' },
  processing: { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Processing' },
  pending:    { text: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', label: 'Pending' },
  failed:     { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Failed' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: s.text,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        width: 'fit-content',
      }}
    >
      {s.label}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function HistoryScreen() {
  const navigate = useNavigate()
  const setTradeData = useAppStore((s) => s.setTradeData)

  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchJobHistory(page, PAGE_SIZE)
      .then((res) => {
        if (!cancelled) {
          setJobs(res.jobs)
          setTotal(res.total)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page])

  async function handleViewJob(jobId: string) {
    setLoadingJobId(jobId)
    try {
      const data = await fetchJobResults(jobId)
      setTradeData(data)
      navigate(`/results/${jobId}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingJobId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.surface }}>
      {/* Header bar */}
      <div
        style={{
          background: COLORS.navy,
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Classification History
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
            {loading ? '—' : `${total} jobs`}
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            background: COLORS.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New Classification
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#DC2626',
              fontSize: 13,
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => { setError(null); setPage((p) => p) }}
              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
        )}

        <div
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 80px 160px 120px',
              padding: '10px 20px',
              gap: '0 8px',
              borderBottom: `1px solid ${COLORS.border}`,
              background: '#F8FAFC',
            }}
          >
            {['File / Source', 'Status', 'Items', 'Date', 'Action'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>
              Loading…
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.navy, marginBottom: 8 }}>No classification jobs yet</div>
              <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>Upload a document or paste a product list to get started.</div>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: COLORS.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Start Classifying
              </button>
            </div>
          ) : (
            jobs.map((job, i) => {
              const fileName = job.file_name ?? (job.input_type === 'text' ? 'Text Input' : 'Untitled')
              const isLast = i === jobs.length - 1
              const isLoadingThis = loadingJobId === job.id

              return (
                <div
                  key={job.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 80px 160px 120px',
                    padding: '14px 20px',
                    borderBottom: isLast ? 'none' : `1px solid ${COLORS.border}`,
                    alignItems: 'center',
                    gap: '0 8px',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy }}>{fileName}</span>
                    <span style={{ fontSize: 11, color: COLORS.subtle, fontFamily: 'monospace' }}>{job.id.slice(0, 8)}…</span>
                  </div>
                  <StatusBadge status={job.status} />
                  <span style={{ fontSize: 13, color: COLORS.muted }}>
                    {job.completed_items} / {job.total_items}
                  </span>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{formatDate(job.created_at)}</span>
                  <div>
                    {job.status === 'completed' ? (
                      <button
                        onClick={() => handleViewJob(job.id)}
                        disabled={loadingJobId !== null}
                        style={{
                          background: isLoadingThis ? '#EFF4FF' : COLORS.accent,
                          color: isLoadingThis ? COLORS.accent : '#fff',
                          border: 'none',
                          borderRadius: 7,
                          padding: '7px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: loadingJobId !== null ? 'not-allowed' : 'pointer',
                          opacity: loadingJobId !== null && !isLoadingThis ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isLoadingThis ? 'Loading…' : 'View Results'}
                      </button>
                    ) : job.status === 'failed' ? (
                      <span
                        title={job.error ?? 'Job failed'}
                        style={{
                          fontSize: 12,
                          color: '#DC2626',
                          cursor: 'help',
                          textDecoration: 'underline dotted',
                        }}
                      >
                        Failed
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: COLORS.subtle }}>In progress…</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: '#fff',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 7,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: page === 1 ? COLORS.subtle : COLORS.navy,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: COLORS.muted }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                background: '#fff',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 7,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: page === totalPages ? COLORS.subtle : COLORS.navy,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
