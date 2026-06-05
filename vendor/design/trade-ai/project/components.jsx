// Shared UI primitives for TradeAI.

// Confidence pill — green >90, yellow 70-90, red <70.
function ConfidencePill({ value, mono }) {
  let tone = '#15803D', bg = '#DCFCE7', bd = '#BBF7D0';
  if (value < 70) { tone = '#B91C1C'; bg = '#FEE2E2'; bd = '#FECACA'; }
  else if (value < 90) { tone = '#B45309'; bg = '#FEF3C7'; bd = '#FDE68A'; }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px',
      borderRadius: 999, background: bg, border: `1px solid ${bd}`, color: tone,
      fontSize: 12, fontWeight: 600, fontFamily: mono, fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone }} />
      {value}%
    </span>
  );
}

// Risk badge — Clear / Review / Flagged.
function RiskBadge({ risk, sm }) {
  const map = {
    Clear: { tone: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0', Icon: window.IconCheck },
    Review: { tone: '#B45309', bg: '#FFFBEB', bd: '#FDE68A', Icon: window.IconAlert },
    Flagged: { tone: '#B91C1C', bg: '#FEF2F2', bd: '#FECACA', Icon: window.IconFlag },
  };
  const c = map[risk] || map.Clear;
  const I = c.Icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '2px 7px' : '3px 9px',
      borderRadius: 6, background: c.bg, border: `1px solid ${c.bd}`, color: c.tone,
      fontSize: sm ? 11 : 12, fontWeight: 600, letterSpacing: '0.01em' }}>
      <I size={sm ? 11 : 12.5} sw={2.2} />{risk}
    </span>
  );
}

// Buttons
function Btn({ children, kind = 'ghost', accent = '#2563EB', sm, onClick, style, icon: I, title }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: sm ? '6px 11px' : '9px 16px', fontSize: sm ? 12.5 : 13.5, fontWeight: 600,
    borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
    border: '1px solid transparent', transition: 'all .14s ease', letterSpacing: '0.005em', ...style,
  };
  const kinds = {
    primary: { background: accent, color: '#fff', boxShadow: '0 1px 2px rgba(15,27,45,0.18)' },
    solid: { background: '#0F1B2D', color: '#fff' },
    ghost: { background: '#fff', color: '#1E293B', border: '1px solid #E2E8F0', boxShadow: '0 1px 1px rgba(15,27,45,0.03)' },
    subtle: { background: '#F1F5F9', color: '#334155' },
    quiet: { background: 'transparent', color: '#64748B' },
  };
  const [hover, setHover] = React.useState(false);
  const hoverFx = {
    primary: { filter: 'brightness(1.07)' },
    solid: { filter: 'brightness(1.25)' },
    ghost: { background: '#F8FAFC', borderColor: '#CBD5E1' },
    subtle: { background: '#E2E8F0' },
    quiet: { color: '#0F1B2D', background: '#F1F5F9' },
  };
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...kinds[kind], ...(hover ? hoverFx[kind] : {}) }}>
      {I && <I size={sm ? 14 : 15.5} sw={2} />}{children}
    </button>
  );
}

// KPI stat block
function Stat({ label, value, sub, tone, mono, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8' }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1,
        color: tone || '#0F1B2D', fontFamily: mono, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {sub && <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>{sub}</span>}
    </div>
  );
}

// Compliance score ring
function ScoreRing({ score, accent, size = 116 }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  let ringColor = '#16A34A';
  if (score < 70) ringColor = '#DC2626'; else if (score < 85) ringColor = '#D97706';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F6" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: '#0F1B2D', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
        <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>/ 100</span>
      </div>
    </div>
  );
}

Object.assign(window, { ConfidencePill, RiskBadge, Btn, Stat, ScoreRing });
