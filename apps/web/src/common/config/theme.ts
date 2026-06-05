export const COLORS = {
  navy: '#0F1B2D',
  accent: '#2563EB',
  surface: '#F4F7FB',
  border: '#E8EDF3',
  muted: '#64748B',
  subtle: '#94A3B8',
  risk: {
    clear: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    review: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    flagged: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  },
  confidence: {
    high: { text: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' },
    medium: { text: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
    low: { text: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' },
  },
} as const

export const FONT = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
} as const

export function confidenceTone(value: number): keyof typeof COLORS.confidence {
  if (value >= 90) return 'high'
  if (value >= 70) return 'medium'
  return 'low'
}
