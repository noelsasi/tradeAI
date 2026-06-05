import { COLORS, confidenceTone } from '@/common/config/theme'

interface ConfidencePillProps {
  value: number
}

export function ConfidencePill({ value }: ConfidencePillProps) {
  const tone = confidenceTone(value)
  const { text, bg, border } = COLORS.confidence[tone]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold font-mono tabular-nums"
      style={{ color: text, background: bg, border: `1px solid ${border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: text }} />
      {value}%
    </span>
  )
}
