import { useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import {
  IconAlert,
  IconArrowRight,
  IconChevron,
  IconDownload,
  IconFilter,
  IconLayers,
  IconSearch,
  IconSend,
} from '@/common/components/atoms/icons'
import { Btn } from '@/common/components/atoms/btn'
import { ConfidencePill } from '@/common/components/atoms/confidence-pill'
import { RiskBadge } from '@/common/components/atoms/risk-badge'
import { Stat } from '@/common/components/atoms/stat'
import { TableSkeleton } from '@/common/components/atoms/skeleton'
import { COLORS } from '@/common/config/theme'
import { DEMO_DATA } from '@/lib/data'
import type { TradeItem } from '@/lib/types'
import {
  downloadCsv,
  downloadMirsal,
  fetchJobResults,
} from '@/infrastructure/adapters/api/classify-api'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

type Layout = 'terminal'
type FilterChip = 'All' | 'Flagged' | 'Review' | 'Clear'

function formatProcessingTime(seconds: number): string {
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`
}

const RISK_COLOR: Record<string, string> = {
  Clear: '#16A34A',
  Review: '#D97706',
  Flagged: '#DC2626',
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  filter: FilterChip
  setFilter: (f: FilterChip) => void
  query: string
  setQuery: (q: string) => void
  count: number
}

function FilterBar({ filter, setFilter, query, setQuery, count }: FilterBarProps) {
  const chips: FilterChip[] = ['All', 'Flagged', 'Review', 'Clear']

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <span
          className="absolute left-[11px] top-1/2 -translate-y-1/2 flex"
          style={{ color: COLORS.subtle }}
        >
          <IconSearch size={15} strokeWidth={2} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search description or HS code…"
          className="w-full rounded-lg outline-none box-border"
          style={{
            padding: '8px 12px 8px 34px',
            border: '1px solid #E2E8F0',
            fontSize: 13,
            background: '#fff',
            color: COLORS.navy,
          }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="flex mr-0.5" style={{ color: '#CBD5E1' }}>
          <IconFilter size={15} strokeWidth={2} />
        </span>
        {chips.map((c) => {
          const active = filter === c
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              aria-pressed={active}
              aria-label={`Filter by ${c}`}
              className="font-semibold rounded-[7px] transition-all duration-[120ms]"
              style={{
                padding: '6px 12px',
                fontSize: 12.5,
                fontFamily: 'inherit',
                border: `1px solid ${active ? COLORS.accent : '#E2E8F0'}`,
                background: active ? COLORS.accent : '#fff',
                color: active ? '#fff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      <span className="ml-auto font-mono" style={{ fontSize: 12.5, color: COLORS.subtle }}>
        {count} items
      </span>
    </div>
  )
}

// ─── Export buttons ───────────────────────────────────────────────────────────

function ExportButtons() {
  const addToast = useToastStore((s) => s.addToast)
  const { jobId } = useParams<{ jobId: string }>()
  const tradeData = useAppStore((s) => s.tradeData)
  const ref = tradeData?.docMeta.ref ?? 'classification'

  async function handleCsv() {
    if (!jobId || jobId === 'demo') {
      addToast('No job to export', 'error')
      return
    }
    try {
      addToast('Preparing CSV…', 'info')
      await downloadCsv(jobId, ref)
      addToast('CSV downloaded')
    } catch {
      addToast('CSV export failed', 'error')
    }
  }

  async function handleMirsal() {
    if (!jobId || jobId === 'demo') {
      addToast('No job to export', 'error')
      return
    }
    try {
      addToast('Preparing Mirsal 2 XML…', 'info')
      await downloadMirsal(jobId, ref)
      addToast('Mirsal 2 XML downloaded')
    } catch {
      addToast('Mirsal export failed', 'error')
    }
  }

  return (
    <div className="flex flex-wrap gap-[9px]">
      <Btn kind="ghost" sm icon={IconDownload} onClick={handleCsv}>
        Export CSV
      </Btn>
      <Btn kind="ghost" sm icon={IconLayers} onClick={handleMirsal}>
        Export Mirsal 2 Format
      </Btn>
      <Btn kind="primary" sm icon={IconSend} onClick={() => addToast('Report sent to Ops Team!')}>
        Send to Ops Team
      </Btn>
    </div>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

interface ResultRowProps {
  item: TradeItem
  layout: Layout
  onOpen: (item: TradeItem) => void
}

function ResultRow({ item, layout, onOpen }: ResultRowProps) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)

  const riskColor = RISK_COLOR[item.risk]
  const pad = '12px 15px'

  return (
    <>
      <tr
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onOpen(item)}
        style={{
          borderBottom: '1px solid #F1F5F9',
          background: hover ? '#FBFCFE' : '#fff',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
      >
        {/* Line # */}
        <td
          style={{
            padding: pad,
            verticalAlign: 'top',
            borderLeft: layout === 'terminal' ? `3px solid ${riskColor}` : '3px solid transparent',
          }}
        >
          <span className="font-mono tabular-nums" style={{ fontSize: 12.5, color: COLORS.subtle }}>
            {String(item.id).padStart(2, '0')}
          </span>
        </td>

        {/* Description */}
        <td style={{ padding: pad, verticalAlign: 'top', maxWidth: 360 }}>
          <div className="flex items-start gap-[9px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpen((o) => !o)
              }}
              className="mt-[1px] flex shrink-0 border-0 bg-transparent p-0 cursor-pointer"
              style={{
                color: COLORS.subtle,
                transform: open ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s',
              }}
              title="Show reasoning"
            >
              <IconChevron size={15} strokeWidth={2.2} />
            </button>
            <div className="min-w-0">
              <div
                className="font-[550] leading-[1.35] overflow-hidden"
                style={
                  {
                    fontSize: 13.5,
                    color: COLORS.navy,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                  } as React.CSSProperties
                }
              >
                {item.desc}
              </div>
              {(item.origin || item.qty) && (
                <div style={{ fontSize: 11.5, color: COLORS.subtle, marginTop: 2 }}>
                  {[item.origin && `Origin ${item.origin}`, item.qty].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* HS Code */}
        <td style={{ padding: pad, verticalAlign: 'top' }}>
          <span
            className="font-mono font-semibold tracking-[0.01em] whitespace-nowrap"
            style={{ fontSize: 13, color: COLORS.navy }}
          >
            {item.hs}
          </span>
          <div
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2, maxWidth: 180 }}
          >
            {item.title}
          </div>
        </td>

        {/* Confidence */}
        <td style={{ padding: pad, verticalAlign: 'top' }}>
          <ConfidencePill value={item.confidence} />
        </td>

        {/* Risk */}
        <td style={{ padding: pad, verticalAlign: 'top' }}>
          <RiskBadge risk={item.risk} sm />
        </td>

        {/* Action */}
        <td style={{ padding: pad, verticalAlign: 'top', textAlign: 'right' }}>
          <span
            className="inline-flex items-center gap-[5px] whitespace-nowrap font-semibold"
            style={{
              fontSize: 12.5,
              color: hover ? COLORS.accent : COLORS.subtle,
              transition: 'color 0.1s',
            }}
          >
            Review <IconArrowRight size={14} strokeWidth={2} />
          </span>
        </td>
      </tr>

      {/* Inline expand */}
      {open && (
        <tr style={{ background: '#FBFCFE' }}>
          <td colSpan={6} style={{ padding: '0 18px 16px 50px' }}>
            <div style={{ borderLeft: `2px solid ${COLORS.accent}`, paddingLeft: 14 }}>
              <div
                className="uppercase font-bold tracking-[0.06em] mb-[5px]"
                style={{ fontSize: 11, color: COLORS.accent }}
              >
                AI Reasoning
              </div>
              <div
                className="leading-[1.55]"
                style={{ fontSize: 13, color: '#475569', maxWidth: 720 }}
              >
                {item.reasoning}
              </div>
              {item.flagNote && (
                <div
                  className="mt-[9px] inline-flex items-center gap-[7px] rounded-[7px] font-semibold"
                  style={{
                    padding: '6px 11px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                    fontSize: 12.5,
                  }}
                >
                  <IconAlert size={14} strokeWidth={2.2} />
                  {item.flagNote}
                </div>
              )}
              <div className="mt-[10px]">
                <Btn kind="ghost" sm icon={IconArrowRight} onClick={() => onOpen(item)}>
                  Open full detail
                </Btn>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface ResultsTableProps {
  items: TradeItem[]
  layout: Layout
  onOpen: (item: TradeItem) => void
}

function ResultsTable({ items, layout, onOpen }: ResultsTableProps) {
  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '11px 15px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: COLORS.subtle,
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    background: '#F8FAFC',
    zIndex: 1,
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
      <thead>
        <tr>
          <th style={thStyle}>Line</th>
          <th style={thStyle}>Product Description</th>
          <th style={thStyle}>HS Code · 12-digit</th>
          <th style={thStyle}>Confidence</th>
          <th style={thStyle}>Risk</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <ResultRow key={item.id} item={item} layout={layout} onOpen={onOpen} />
        ))}
      </tbody>
    </table>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ResultsScreen() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { openDrawer, tradeData, setTradeData } = useAppStore()

  const [filter, setFilter] = useState<FilterChip>('All')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    // If we already have data in memory for this job (came from processing screen), skip fetch
    if (tradeData && jobId !== 'demo') {
      const t = setTimeout(() => setLoading(false), 400)
      return () => clearTimeout(t)
    }
    if (jobId === 'demo') {
      setTradeData(DEMO_DATA)
      const t = setTimeout(() => setLoading(false), 400)
      return () => clearTimeout(t)
    }
    if (!jobId) return undefined

    // Direct URL visit — fetch results by jobId
    fetchJobResults(jobId)
      .then((data) => {
        setTradeData(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setFetchError(err.message)
        setLoading(false)
      })
    return undefined
  }, [jobId])

  if (fetchError) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#DC2626' }}>
        Failed to load results: {fetchError}
      </div>
    )
  }

  const { items, summary: S, docMeta } = tradeData ?? DEMO_DATA

  const filtered = items.filter((it) => {
    const matchFilter = filter === 'All' || it.risk === filter
    const q = query.trim().toLowerCase()
    const matchQuery =
      !q ||
      it.desc.toLowerCase().includes(q) ||
      it.hs.includes(q) ||
      it.title.toLowerCase().includes(q)
    return matchFilter && matchQuery
  })

  return (
    <div className="mx-auto px-7 pb-14" style={{ maxWidth: 1320, paddingTop: 24 }}>
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-1.5 mb-4"
        style={{ fontSize: 13, color: COLORS.subtle }}
      >
        <button
          onClick={() => navigate('/history')}
          className="font-medium transition-colors"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: COLORS.muted,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.muted)}
        >
          History
        </button>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <span className="font-medium" style={{ color: COLORS.navy }}>
          {docMeta.ref}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: 12.5, color: COLORS.subtle }}
          >
            Classification Report · {docMeta.client}
          </div>
          <h2
            className="font-bold tracking-tight mt-[3px] mb-0"
            style={{ fontSize: 23, color: COLORS.navy }}
          >
            {docMeta.ref}
          </h2>
        </div>
        <ExportButtons />
      </div>

      {/* KPI strip */}
      <div
        className="grid mb-[18px] rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 1,
          background: '#E8EDF3',
          border: '1px solid #E8EDF3',
        }}
      >
        {[
          {
            label: 'Items Classified',
            value: S.total,
            sub: `across ${docMeta.files.length || 1} ${docMeta.files.length === 1 ? 'document' : 'documents'}`,
          },
          { label: 'Flagged', value: S.flagged, tone: '#DC2626', sub: 'require action' },
          { label: 'For Review', value: S.review, tone: '#D97706', sub: 'low confidence' },
          {
            label: 'Sanctions Hits',
            value: S.sanctions,
            tone: S.sanctions ? '#DC2626' : '#16A34A',
            sub: 'OFAC partial match',
          },
          {
            label: 'Processing Time',
            value: formatProcessingTime(S.processingTime),
            sub: 'end-to-end',
          },
          {
            label: 'Compliance',
            value: S.complianceScore,
            tone: COLORS.accent,
            sub: 'score / 100',
          },
        ].map((k) => (
          <div key={k.label} style={{ background: '#fff', padding: '16px' }}>
            <Stat {...k} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E8EDF3',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            query={query}
            setQuery={setQuery}
            count={filtered.length}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <TableSkeleton rows={8} />
          ) : (
            <ResultsTable items={filtered} layout="terminal" onOpen={openDrawer} />
          )}
        </div>
      </div>
    </div>
  )
}
