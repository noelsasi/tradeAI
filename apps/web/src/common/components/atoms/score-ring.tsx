import { COLORS } from '@/common/config/theme'

interface ScoreRingProps {
  score: number
  size?: number
}

function ringColor(score: number): string {
  if (score >= 85) return '#16A34A'
  if (score >= 70) return '#D97706'
  return '#DC2626'
}

export function ScoreRing({ score, size = 116 }: ScoreRingProps) {
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const color = ringColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EEF2F6"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[30px] font-bold leading-none tabular-nums"
          style={{ color: COLORS.navy }}
        >
          {score}
        </span>
        <span
          className="text-[10.5px] font-semibold tracking-wider"
          style={{ color: COLORS.subtle }}
        >
          / 100
        </span>
      </div>
    </div>
  )
}
