import { COLORS } from '@/common/config/theme'

interface LogoProps {
  accent?: string
  compact?: boolean
}

function ShipMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M3 19.5h26l-2.4 5.2a2 2 0 0 1-1.8 1.15H7.2a2 2 0 0 1-1.83-1.2L3 19.5Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M6.5 19.5V13a1 1 0 0 1 1-1h7l4 4h4.5a1 1 0 0 1 1 1v2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect
        x="9"
        y="6.5"
        width="3.2"
        height="5.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M5 23h22" stroke="#fff" strokeWidth="1.1" opacity="0.5" />
    </svg>
  )
}

export function Logo({ accent = COLORS.accent, compact = false }: LogoProps) {
  const size = compact ? 22 : 26
  const fontSize = compact ? 17 : 19

  return (
    <div className="flex items-center gap-2">
      <span style={{ color: accent }} className="flex">
        <ShipMark size={size} />
      </span>
      <span className="flex items-baseline gap-0 leading-none">
        <span style={{ fontSize, color: COLORS.navy }} className="font-bold tracking-tight">
          Trade
        </span>
        <span style={{ fontSize, color: accent }} className="font-bold tracking-tight">
          AI
        </span>
      </span>
    </div>
  )
}

export function NexavineTag() {
  return (
    <span
      className="text-[10.5px] font-semibold uppercase tracking-widest"
      style={{ color: COLORS.subtle }}
    >
      by Nexavine Tech
    </span>
  )
}
