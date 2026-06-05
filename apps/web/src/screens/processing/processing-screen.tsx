import { useEffect, useRef, useState } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import { IconCheck, IconClock } from '@/common/components/atoms/icons'
import { COLORS } from '@/common/config/theme'
import { DEMO_DATA } from '@/lib/data'
import { pollJobProgress, fetchJobResults, type JobStatus } from '@/infrastructure/adapters/api/classify-api'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

type StepState = 'done' | 'active' | 'pending'

function deriveStepIdx(job: JobStatus): { active: number; done: number } {
  if (job.status === 'pending') return { active: 0, done: -1 }
  if (job.status === 'processing' && job.total_items === 0) return { active: 0, done: -1 }
  if (job.status === 'processing') return { active: 1, done: 0 }
  if (job.status === 'completed') return { active: 3, done: 3 }
  return { active: 0, done: -1 }
}

function formatElapsed(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`
}

const INSIGHTS = [
  'The GCC 12-digit tariff schedule has over 8,000 distinct HS codes — AI narrows it down in seconds.',
  'OFAC maintains over 10,000 sanctions entries. Every item is screened automatically.',
  'Misclassification is the #1 cause of customs delays in UAE ports. Accuracy saves days.',
  'Dubai handles over 14 million TEUs annually — precise HS codes keep cargo moving.',
  'Mirsal 2 requires 12-digit GCC codes. Your report is formatted and ready to submit.',
  'AI confidence scores flag low-certainty items so your team reviews only what matters.',
  'UN, EU, and OFAC watchlists are checked simultaneously for each line item.',
  'HS code accuracy directly impacts duty calculation — a wrong code can cost thousands.',
  'Jebel Ali is the largest port in the Middle East. TradeAI speaks its language.',
  'Each classification comes with AI reasoning — full audit trail for customs queries.',
]

export function ProcessingScreen() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { setTradeData } = useAppStore()
  const steps = DEMO_DATA.processingSteps

  const [job, setJob] = useState<JobStatus | null>(null)
  const [activeStepIdx, setActiveStepIdx] = useState(0)
  const [doneStepIdx, setDoneStepIdx] = useState(-1)
  const [elapsed, setElapsed] = useState(0)
  const [insightIdx, setInsightIdx] = useState(() => Math.floor(Math.random() * INSIGHTS.length))
  const [insightVisible, setInsightVisible] = useState(true)
  const insightTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const completedItems = job?.completed_items ?? 0
  const totalItems = job?.total_items ?? 0

  const pct = totalItems > 0
    ? Math.min(99, Math.round((completedItems / totalItems) * 100))
    : Math.min(99, activeStepIdx * 25 + 12)

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Rotate insights every 6s with fade
  useEffect(() => {
    insightTimer.current = setInterval(() => {
      setInsightVisible(false)
      setTimeout(() => {
        setInsightIdx((i) => (i + 1) % INSIGHTS.length)
        setInsightVisible(true)
      }, 400)
    }, 6000)
    return () => { if (insightTimer.current) clearInterval(insightTimer.current) }
  }, [])

  useEffect(() => {
    if (!jobId) {
      const STEP_DURATIONS = [1900, 3400, 2600, 2200]
      let t: ReturnType<typeof setTimeout>

      function advance(idx: number) {
        setActiveStepIdx(idx)
        if (idx >= steps.length - 1) {
          setTimeout(() => {
            setTradeData(DEMO_DATA)
            navigate('/results/demo')
          }, 700)
          return
        }
        t = setTimeout(() => {
          setDoneStepIdx(idx)
          advance(idx + 1)
        }, STEP_DURATIONS[idx] ?? 2200)
      }

      t = setTimeout(() => advance(0), 300)
      return () => clearTimeout(t)
    }

    const stop = pollJobProgress(
      jobId,
      (updated) => {
        setJob(updated)
        const { active, done } = deriveStepIdx(updated)
        setActiveStepIdx(active)
        setDoneStepIdx(done)
      },
      async () => {
        try {
          const data = await fetchJobResults(jobId)
          setTradeData(data)
          navigate(`/results/${jobId}`)
        } catch (err) {
          useToastStore.getState().addToast(err instanceof Error ? err.message : 'Failed to load results', 'error')
          navigate('/')
        }
      },
      (message) => {
        useToastStore.getState().addToast(message, 'error')
        navigate('/')
      },
    )

    return stop
  }, [jobId])

  function stepState(i: number): StepState {
    if (i <= doneStepIdx) return 'done'
    if (i === activeStepIdx) return 'active'
    return 'pending'
  }

  function stepDetail(i: number, state: StepState): string {
    if (state === 'active' && i === 0) {
      return totalItems > 0
        ? `${totalItems} line item${totalItems !== 1 ? 's' : ''} detected`
        : 'Extracting line items from document…'
    }
    if (state === 'active' && i === 1 && totalItems > 0) {
      return `Classifying item ${completedItems} of ${totalItems}…`
    }
    if (state === 'done' && i === 0 && totalItems > 0) {
      return `${totalItems} line item${totalItems !== 1 ? 's' : ''} extracted`
    }
    return steps[i]?.detail ?? ''
  }

  return (
    <div className="mx-auto px-8 pb-12" style={{ maxWidth: 720, paddingTop: 88 }}>
      {/* Pulsing badge */}
      <div className="text-center mb-2">
        <span
          className="inline-flex items-center gap-2 px-[13px] py-[5px] rounded-full font-semibold"
          style={{ background: '#EFF4FF', border: '1px solid #DBE4FF', color: COLORS.accent, fontSize: 12.5 }}
        >
          <span className="ta-pulse rounded-full" style={{ width: 7, height: 7, background: COLORS.accent }} />
          Processing
          {totalItems > 0 && ` · ${completedItems} / ${totalItems} items`}
        </span>
      </div>

      {/* Heading */}
      <h2 className="text-center font-bold tracking-tight mt-[14px] mb-1" style={{ fontSize: 27, color: COLORS.navy }}>
        Analyzing your shipment
      </h2>
      <p className="text-center m-0" style={{ fontSize: 14.5, color: COLORS.subtle }}>
        TradeAI is classifying every line item against the GCC 12-digit tariff schedule.
      </p>

      {/* Progress bar */}
      <div className="mt-[34px] mb-2 rounded-full overflow-hidden" style={{ height: 7, background: '#EEF2F6' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent}cc)`,
            transition: 'width 0.9s cubic-bezier(.4,0,.2,1)',
          }}
        />
      </div>

      {/* Progress labels */}
      <div className="flex justify-between font-mono" style={{ fontSize: 12.5, color: COLORS.subtle }}>
        <span>{pct}% complete</span>
        <span className="inline-flex items-center gap-[5px]">
          <IconClock size={13} strokeWidth={2} />
          {formatElapsed(elapsed)} elapsed
        </span>
      </div>

      {/* Steps card */}
      <div
        className="mt-[30px] rounded-[14px] overflow-hidden"
        style={{ border: '1px solid #EEF2F6', background: '#fff' }}
      >
        {steps.map((step, i) => {
          const state = stepState(i)
          const isLast = i === steps.length - 1

          return (
            <div
              key={step.key}
              className="flex items-center gap-[14px] transition-colors duration-300"
              style={{
                padding: '16px 18px',
                borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                background: state === 'active' ? '#FBFCFE' : '#fff',
              }}
            >
              {/* Status icon */}
              <div
                className="shrink-0 flex items-center justify-center rounded-[9px]"
                style={{
                  width: 30,
                  height: 30,
                  background: state === 'done' ? '#DCFCE7' : state === 'active' ? '#EFF4FF' : '#F1F5F9',
                  color: state === 'done' ? '#15803D' : state === 'active' ? COLORS.accent : '#CBD5E1',
                }}
              >
                {state === 'done' ? (
                  <IconCheck size={17} strokeWidth={2.6} />
                ) : state === 'active' ? (
                  <span
                    className="ta-spin block rounded-full"
                    style={{
                      width: 16,
                      height: 16,
                      border: `2.4px solid ${COLORS.accent}33`,
                      borderTopColor: COLORS.accent,
                    }}
                  />
                ) : (
                  <span className="rounded-full" style={{ width: 7, height: 7, background: '#CBD5E1' }} />
                )}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold"
                  style={{ fontSize: 14.5, color: state === 'pending' ? COLORS.subtle : COLORS.navy }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: 12.5, color: COLORS.subtle, marginTop: 1, opacity: state === 'pending' ? 0.6 : 1 }}>
                  {stepDetail(i, state)}
                </div>
              </div>

              {/* Status badge */}
              <span
                className="font-mono font-semibold tracking-[0.02em]"
                style={{
                  fontSize: 11.5,
                  color: state === 'done' ? '#15803D' : state === 'active' ? COLORS.accent : '#CBD5E1',
                }}
              >
                {state === 'done' ? 'DONE' : state === 'active' ? 'RUNNING' : 'QUEUED'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Insight strip */}
      <div
        className="mt-[22px] rounded-xl flex items-start gap-3"
        style={{
          padding: '14px 16px',
          background: '#F8FAFC',
          border: '1px solid #EEF2F6',
        }}
      >
        <span
          className="shrink-0 mt-[1px] font-bold"
          style={{ fontSize: 13, color: COLORS.accent }}
        >
          💡
        </span>
        <p
          className="m-0 leading-relaxed"
          style={{
            fontSize: 13,
            color: '#475569',
            opacity: insightVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          {INSIGHTS[insightIdx]}
        </p>
      </div>
    </div>
  )
}
