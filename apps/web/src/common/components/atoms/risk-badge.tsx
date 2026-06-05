import { IconAlert, IconCheck, IconFlag } from '@/common/components/atoms/icons'
import { COLORS } from '@/common/config/theme'
import type { Risk } from '@/lib/types'

interface RiskBadgeProps {
  risk: Risk
  sm?: boolean
}

const RISK_CONFIG = {
  Clear: { Icon: IconCheck, colors: COLORS.risk.clear },
  Review: { Icon: IconAlert, colors: COLORS.risk.review },
  Flagged: { Icon: IconFlag, colors: COLORS.risk.flagged },
} as const

export function RiskBadge({ risk, sm = false }: RiskBadgeProps) {
  const { Icon, colors } = RISK_CONFIG[risk]
  const iconSize = sm ? 11 : 12.5
  const fontSize = sm ? 11 : 12

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold rounded-md"
      style={{
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize,
        padding: sm ? '2px 7px' : '3px 9px',
      }}
    >
      <Icon size={iconSize} strokeWidth={2.2} />
      {risk}
    </span>
  )
}
