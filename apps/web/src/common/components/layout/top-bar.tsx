import { NavLink, useNavigate } from 'react-router-dom'

import { Logo, NexavineTag } from '@/common/components/atoms/brand'
import { COLORS } from '@/common/config/theme'

const NAV_ITEMS = [
  { label: 'Classify', to: '/' },
  { label: 'History', to: '/history' },
  { label: 'Integrations', to: '/integrations' },
]

export function TopBar() {
  const navigate = useNavigate()

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 sm:gap-3"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        aria-label="Go to home"
      >
        <Logo compact />
        <span className="topbar-nexavine">
          <NexavineTag />
        </span>
      </button>

      <nav className="topbar-nav flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={({ isActive }) => ({
              color: isActive ? COLORS.accent : COLORS.muted,
              background: isActive ? '#EFF4FF' : 'transparent',
              textDecoration: 'none',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div
        className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-full"
        style={{ background: '#F1F5F9', border: `1px solid ${COLORS.border}` }}
        aria-label="User account"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: COLORS.accent }}
          aria-hidden="true"
        >
          N
        </div>
        <span className="topbar-username text-sm font-medium" style={{ color: COLORS.navy }}>
          Noel S.
        </span>
      </div>
    </header>
  )
}
