import { useEffect, useRef, useState } from 'react'

import { Btn } from '@/common/components/atoms/btn'
import { ConfidencePill } from '@/common/components/atoms/confidence-pill'
import { IconAlert, IconCheck, IconClose, IconCode } from '@/common/components/atoms/icons'
import { RiskBadge } from '@/common/components/atoms/risk-badge'
import { COLORS } from '@/common/config/theme'
import type { SanctionStatus, TradeItem } from '@/lib/types'
import { useAppStore } from '@/store/app-store'

const SANC_MAP: Record<SanctionStatus, { tone: string; bg: string; border: string }> = {
  Clear: { tone: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  Review: { tone: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  Flagged: { tone: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[22px]">
      <div
        className="font-bold uppercase tracking-[0.06em] mb-[10px]"
        style={{ fontSize: 11.5, color: COLORS.accent }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const barColor = value < 70 ? '#DC2626' : value < 90 ? '#D97706' : '#16A34A'
  return (
    <div className="mb-[11px]">
      <div className="flex justify-between mb-1" style={{ fontSize: 12.5 }}>
        <span className="font-medium" style={{ color: '#475569' }}>
          {label}
        </span>
        <span className="font-mono font-semibold" style={{ color: COLORS.navy }}>
          {value}%
        </span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#EEF2F6' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

function DrawerBody({ item }: { item: TradeItem }) {
  const closeDrawer = useAppStore((s) => s.closeDrawer)
  const [overridden, setOverridden] = useState(false)

  useEffect(() => {
    setOverridden(false)
  }, [item.id])


  return (
    <>
      {/* Header */}
      <div
        className="flex items-start gap-3 shrink-0"
        style={{ padding: '18px 22px', borderBottom: '1px solid #EEF2F6' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-[9px] mb-1.5">
            <span className="font-mono" style={{ fontSize: 12, color: COLORS.subtle }}>
              LINE {String(item.id).padStart(2, '0')}
            </span>
            <RiskBadge risk={item.risk} sm />
          </div>
          <div
            className="font-[650] leading-[1.4]"
            style={{ fontSize: 15.5, color: COLORS.navy }}
          >
            {item.desc}
          </div>
          {(item.origin || item.qty) && (
            <div className="mt-1" style={{ fontSize: 12.5, color: COLORS.subtle }}>
              {[item.origin && `Origin ${item.origin}`, item.qty].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <button
          onClick={closeDrawer}
          className="shrink-0 flex items-center justify-center rounded-lg cursor-pointer"
          style={{
            width: 32,
            height: 32,
            border: '1px solid #E2E8F0',
            background: '#fff',
            color: COLORS.muted,
          }}
          aria-label="Close drawer"
        >
          <IconClose size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 22px' }}>
        {/* Classified code box */}
        <div
          className="rounded-xl mb-5"
          style={{
            background: overridden ? '#FFFBEB' : '#F8FAFC',
            border: `1px solid ${overridden ? '#FDE68A' : '#E8EDF3'}`,
            padding: '16px 18px',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          <div
            className="font-bold uppercase tracking-[0.06em]"
            style={{ fontSize: 11, color: COLORS.subtle }}
          >
            {overridden ? 'Manually Overridden Code' : 'AI Classified Code'}
          </div>
          <div className="flex items-center gap-[14px] mt-2">
            <span
              className="font-mono font-bold tracking-[0.01em]"
              style={{ fontSize: 26, color: COLORS.navy }}
            >
              {item.hs}
            </span>
            <ConfidencePill value={item.confidence} />
          </div>
          <div className="font-medium mt-[7px]" style={{ fontSize: 13, color: '#475569' }}>
            {item.title}
          </div>
          <div className="mt-0.5" style={{ fontSize: 12, color: COLORS.subtle }}>
            {item.chapter}
          </div>
        </div>

        {/* AI Reasoning */}
        <Section title="AI Reasoning">
          <p className="m-0 leading-[1.6]" style={{ fontSize: 13.5, color: '#334155' }}>
            {item.reasoning}
          </p>
          {item.flagNote && (
            <div
              className="mt-[11px] flex items-start gap-[9px] rounded-[9px]"
              style={{
                padding: '10px 13px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
              }}
            >
              <span className="mt-px shrink-0" style={{ color: '#B91C1C' }}>
                <IconAlert size={16} strokeWidth={2.2} />
              </span>
              <span
                className="font-semibold leading-[1.4]"
                style={{ fontSize: 12.5, color: '#B91C1C' }}
              >
                {item.flagNote}
              </span>
            </div>
          )}
        </Section>

        {/* Confidence */}
        <Section title="Classification Confidence">
          <ConfidenceBar label="AI model confidence score" value={item.confidence} />
        </Section>

        {/* Alternative codes */}
        <Section title="Alternative Codes Considered">
          <div className="flex flex-col gap-2">
            {item.alternatives.map((alt) => (
              <div
                key={alt.code}
                className="rounded-[10px]"
                style={{ border: '1px solid #EEF2F6', padding: '11px 13px' }}
              >
                <div className="font-mono font-semibold" style={{ fontSize: 13.5, color: COLORS.navy }}>
                  {alt.code}
                </div>
                <div
                  className="mt-0.5 leading-[1.45]"
                  style={{ fontSize: 12.5, color: COLORS.muted }}
                >
                  {alt.reason}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Sanctions screening */}
        <Section title="Sanctions Screening">
          <div className="grid gap-[9px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {(
              [
                ['OFAC', item.sanctions.ofac],
                ['UN', item.sanctions.un],
                ['EU', item.sanctions.eu],
              ] as const
            ).map(([label, status]) => {
              const { tone, bg, border } = SANC_MAP[status]
              return (
                <div
                  key={label}
                  className="rounded-[10px] text-center"
                  style={{ background: bg, border: `1px solid ${border}`, padding: '11px 10px' }}
                >
                  <div
                    className="font-bold tracking-[0.04em]"
                    style={{ fontSize: 11, color: COLORS.muted }}
                  >
                    {label}
                  </div>
                  <div className="font-bold mt-1" style={{ fontSize: 13.5, color: tone }}>
                    {status === 'Clear' ? 'Clear' : 'Match'}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div
        className="flex gap-2.5 shrink-0"
        style={{
          padding: '14px 22px',
          borderTop: '1px solid #EEF2F6',
          background: '#FBFCFE',
        }}
      >
        <Btn
          kind="ghost"
          icon={IconCode}
          onClick={() => setOverridden((o) => !o)}
          style={{ flex: 1 }}
        >
          {overridden ? 'Revert to AI Code' : 'Override Code'}
        </Btn>
        <Btn kind="primary" icon={IconCheck} onClick={closeDrawer} style={{ flex: 1 }}>
          Accept &amp; Close
        </Btn>
      </div>
    </>
  )
}

export function DetailDrawer() {
  const drawerItem = useAppStore((s) => s.drawerItem)
  const closeDrawer = useAppStore((s) => s.closeDrawer)
  const panelRef = useRef<HTMLDivElement>(null)

  // Trap Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && drawerItem) closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerItem, closeDrawer])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerItem ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerItem])

  return (
    <>
      {/* Scrim */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 56,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15,27,45,0.42)',
          opacity: drawerItem ? 1 : 0,
          pointerEvents: drawerItem ? 'auto' : 'none',
          transition: 'opacity 0.25s',
          zIndex: 40,
        }}
      />

      {/* Panel — detail-drawer-panel class makes it 100vw on mobile via CSS */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Item detail"
        className="detail-drawer-panel"
        style={{
          position: 'fixed',
          top: 56,
          right: 0,
          height: 'calc(100% - 56px)',
          width: 'min(540px, 94vw)',
          background: '#fff',
          boxShadow: '-12px 0 40px rgba(15,27,45,0.18)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          transform: drawerItem ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {drawerItem && <DrawerBody item={drawerItem} />}
      </div>
    </>
  )
}
