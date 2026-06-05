import { COLORS } from '@/common/config/theme'

interface StatProps {
  label: string
  value: string | number
  sub?: string
  tone?: string
}

export function Stat({ label, value, sub, tone }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: COLORS.subtle }}
      >
        {label}
      </span>
      <span
        className="text-[26px] font-bold leading-none font-mono tabular-nums"
        style={{ color: tone ?? COLORS.navy }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[11.5px] font-medium" style={{ color: COLORS.subtle }}>
          {sub}
        </span>
      )}
    </div>
  )
}
