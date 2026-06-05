import { useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import {
  IconArrowRight,
  IconClock,
  IconFile,
  IconLayers,
  IconSearch,
  IconShield,
  IconSpark,
  IconUpload,
} from '@/common/components/atoms/icons'
import { COLORS } from '@/common/config/theme'
import { submitDocumentClassify, submitTextClassify, fetchJobResults } from '@/infrastructure/adapters/api/classify-api'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

const TRUST_SIGNALS = [
  { label: 'Mirsal 2 Ready', Icon: IconShield },
  { label: 'OFAC Screened', Icon: IconSearch },
  { label: 'GCC 12-Digit Compliant', Icon: IconLayers },
]

const SUBMIT_INSIGHTS = [
  'Reading your document and extracting every line item…',
  'Matching items against the GCC 12-digit tariff schedule…',
  'Cross-referencing OFAC, UN, and EU sanctions lists…',
  'Scoring confidence levels for each classification…',
  'Flagging items that need human review…',
  'Calculating duty rates and compliance scores…',
  'Almost there — generating your Mirsal 2-ready report…',
]

function formatElapsed(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`
}

export function LandingScreen() {
  const navigate = useNavigate()
  const { setTradeData } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [insightIdx, setInsightIdx] = useState(0)
  const [insightVisible, setInsightVisible] = useState(true)
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const insightTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const ready = files.length > 0 || text.trim().length > 8

  const ACCEPTED = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.files ?? []).filter((f) => ACCEPTED.has(f.type))
      if (items.length > 0) setFiles(items)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) => ACCEPTED.has(f.type))
    if (dropped.length > 0) setFiles(dropped)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
    }
  }

  function startSubmitTimers() {
    setElapsed(0)
    setInsightIdx(0)
    setInsightVisible(true)

    elapsedTimer.current = setInterval(() => setElapsed((e) => e + 1), 1000)

    insightTimer.current = setInterval(() => {
      setInsightVisible(false)
      setTimeout(() => {
        setInsightIdx((i) => Math.min(i + 1, SUBMIT_INSIGHTS.length - 1))
        setInsightVisible(true)
      }, 350)
    }, 3500)
  }

  function stopSubmitTimers() {
    if (elapsedTimer.current) clearInterval(elapsedTimer.current)
    if (insightTimer.current) clearInterval(insightTimer.current)
  }

  async function handleClassify() {
    if (!ready || submitting) return
    setSubmitting(true)
    startSubmitTimers()

    try {
      if (files.length > 0) {
        const jobId = await submitDocumentClassify(files[0])
        stopSubmitTimers()
        navigate(`/processing/${jobId}`)
      } else {
        const jobId = await submitTextClassify(text.trim())
        const data = await fetchJobResults(jobId)
        stopSubmitTimers()
        setTradeData(data)
        navigate(`/results/${jobId}`)
      }
    } catch (err) {
      stopSubmitTimers()
      useToastStore.getState().addToast(err instanceof Error ? err.message : 'Submission failed', 'error')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto px-8 pb-12" style={{ maxWidth: 920, paddingTop: 64 }}>
      {/* Hero badge */}
      <div className="flex items-center gap-2 mb-[18px]">
        <span
          className="inline-flex items-center gap-[7px] px-[11px] py-1 rounded-full text-xs font-semibold"
          style={{ background: '#EFF4FF', border: '1px solid #DBE4FF', color: COLORS.accent }}
        >
          <IconSpark size={13} strokeWidth={2} />
          AI Customs Engine · GCC Tariff 2026
        </span>
      </div>

      {/* H1 */}
      <h1
        className="m-0 font-bold tracking-tight leading-[1.04]"
        style={{ fontSize: 46, color: COLORS.navy, textWrap: 'balance' } as React.CSSProperties}
      >
        Classify GCC HS Codes
        <br />
        in <span style={{ color: COLORS.accent }}>10 seconds</span>.
      </h1>

      <p className="mt-4 leading-relaxed" style={{ fontSize: 17, color: COLORS.muted, maxWidth: 560 }}>
        AI-powered customs compliance for UAE freight forwarders. Upload an invoice or packing list
        and get 12-digit classifications, sanctions screening, and a Mirsal 2-ready report.
      </p>

      {/* Combined input */}
      <div
        className="mt-[34px] rounded-2xl transition-all duration-150 relative"
        style={{
          border: `1.5px solid ${dragging ? COLORS.accent : files.length > 0 ? '#BBF7D0' : '#E2E8F0'}`,
          background: dragging ? '#EFF4FF' : '#fff',
          boxShadow: dragging ? `0 0 0 3px ${COLORS.accent}22` : 'none',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple={false}
          className="hidden"
          onChange={handleFileChange}
          aria-label="File upload"
        />

        {/* File chip row (shown when file selected) */}
        {files.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 pt-3">
            {files.map((f) => (
              <span
                key={f.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-[7px] font-mono"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12.5, color: '#15803D' }}
              >
                <IconFile size={13} strokeWidth={2} />
                {f.name}
                <button
                  onClick={() => setFiles([])}
                  style={{ marginLeft: 2, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}
                  aria-label="Remove file"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={files.length > 0 ? 'Add notes (optional)…' : 'Paste product descriptions — or drag & drop a PDF, JPEG, or PNG invoice above'}
          className="w-full outline-none leading-relaxed box-border resize-none"
          style={{
            minHeight: files.length > 0 ? 64 : 120,
            padding: files.length > 0 ? '10px 15px 12px' : '18px 16px 12px',
            fontSize: 14,
            color: COLORS.navy,
            background: 'transparent',
            border: 'none',
            display: 'block',
          }}
        />

        {/* Bottom toolbar */}
        <div
          className="flex items-center justify-between px-3 pb-3 pt-1"
          style={{ borderTop: '1px solid #F1F5F9' }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors"
            style={{
              padding: '6px 11px',
              fontSize: 12.5,
              color: files.length > 0 ? '#15803D' : COLORS.muted,
              background: files.length > 0 ? '#F0FDF4' : '#F8FAFC',
              border: `1px solid ${files.length > 0 ? '#BBF7D0' : '#E2E8F0'}`,
              cursor: 'pointer',
            }}
          >
            <IconUpload size={13} strokeWidth={2} />
            {files.length > 0 ? 'Replace file' : 'Attach file'}
          </button>
          <span style={{ fontSize: 12, color: '#CBD5E1' }}>PDF · JPEG · PNG · up to 10 MB</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-[22px]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleClassify}
            disabled={!ready || submitting}
            className="inline-flex items-center gap-2 rounded-xl font-semibold text-white transition-opacity shrink-0"
            style={{
              padding: '12px 22px',
              fontSize: 15,
              background: COLORS.accent,
              opacity: ready && !submitting ? 1 : 0.55,
              cursor: ready && !submitting ? 'pointer' : 'not-allowed',
              boxShadow: ready ? `0 4px 14px ${COLORS.accent}44` : 'none',
            }}
          >
            {submitting ? 'Classifying…' : 'Classify Now'}
            {!submitting && <IconArrowRight size={17} strokeWidth={2} />}
          </button>

          {submitting ? (
            <span
              className="inline-flex items-center gap-[6px] font-mono font-semibold"
              style={{ fontSize: 13, color: COLORS.accent }}
            >
              <IconClock size={13} strokeWidth={2} />
              {formatElapsed(elapsed)}
            </span>
          ) : (
            <span style={{ fontSize: 13, color: COLORS.subtle }}>
              {ready ? 'Avg. classification time ~12s' : 'Add a document or description to begin'}
            </span>
          )}
        </div>

        {/* Inline insight shown while submitting */}
        {submitting && (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl"
            style={{
              padding: '11px 14px',
              background: '#F8FAFC',
              border: '1px solid #EEF2F6',
            }}
          >
            <span
              className="ta-pulse shrink-0 rounded-full"
              style={{ width: 7, height: 7, background: COLORS.accent }}
            />
            <span
              style={{
                fontSize: 13,
                color: '#475569',
                opacity: insightVisible ? 1 : 0,
                transition: 'opacity 0.35s ease',
              }}
            >
              {SUBMIT_INSIGHTS[insightIdx]}
            </span>
          </div>
        )}
      </div>

      {/* Trust signals */}
      <div
        className="mt-14 pt-[22px] flex flex-wrap items-center gap-[22px]"
        style={{ borderTop: '1px solid #EEF2F6' }}
      >
        {TRUST_SIGNALS.map(({ label, Icon }) => (
          <span key={label} className="inline-flex items-center gap-2 font-semibold" style={{ fontSize: 13, color: '#475569' }}>
            <span style={{ color: COLORS.accent }} className="flex">
              <Icon size={16} strokeWidth={2} />
            </span>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
