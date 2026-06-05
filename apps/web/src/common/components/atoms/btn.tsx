import { useState } from 'react'

import { COLORS } from '@/common/config/theme'

type BtnKind = 'primary' | 'solid' | 'ghost' | 'subtle' | 'quiet'

interface BtnProps {
  children: React.ReactNode
  kind?: BtnKind
  accent?: string
  sm?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
  title?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const BASE_STYLES: Record<BtnKind, React.CSSProperties> = {
  primary: { color: '#fff', boxShadow: '0 1px 2px rgba(15,27,45,0.18)' },
  solid: { background: COLORS.navy, color: '#fff' },
  ghost: {
    background: '#fff',
    color: '#1E293B',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 1px rgba(15,27,45,0.03)',
  },
  subtle: { background: '#F1F5F9', color: '#334155' },
  quiet: { background: 'transparent', color: COLORS.muted },
}

const HOVER_STYLES: Record<BtnKind, React.CSSProperties> = {
  primary: { filter: 'brightness(1.07)' },
  solid: { filter: 'brightness(1.25)' },
  ghost: { background: '#F8FAFC', borderColor: '#CBD5E1' },
  subtle: { background: '#E2E8F0' },
  quiet: { color: COLORS.navy, background: '#F1F5F9' },
}

export function Btn({
  children,
  kind = 'ghost',
  accent = COLORS.accent,
  sm = false,
  onClick,
  style,
  icon: Icon,
  title,
  disabled = false,
  type = 'button',
}: BtnProps) {
  const [hovered, setHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: sm ? '6px 11px' : '9px 16px',
    fontSize: sm ? 12.5 : 13.5,
    fontWeight: 600,
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    border: '1px solid transparent',
    transition: 'all 0.14s ease',
    letterSpacing: '0.005em',
    opacity: disabled ? 0.5 : 1,
    ...BASE_STYLES[kind],
    ...(kind === 'primary' ? { background: accent } : {}),
    ...(hovered && !disabled ? HOVER_STYLES[kind] : {}),
    ...style,
  }

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={baseStyle}
    >
      {Icon && <Icon size={sm ? 14 : 15.5} strokeWidth={2} />}
      {children}
    </button>
  )
}
