// Icons + TradeAI logo. Functional UI icons drawn as inline SVG (stroke-based, lucide-ish).
const Icon = ({ d, size = 16, sw = 1.8, fill = 'none', style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {children || <path d={d} />}
  </svg>
);

// Container ship mark — used in the wordmark.
const ShipMark = ({ size = 26, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style} aria-hidden="true">
    <path d="M3 19.5h26l-2.4 5.2a2 2 0 0 1-1.8 1.15H7.2a2 2 0 0 1-1.83-1.2L3 19.5Z"
      fill="currentColor" opacity="0.9" />
    <path d="M6.5 19.5V13a1 1 0 0 1 1-1h7l4 4h4.5a1 1 0 0 1 1 1v2.5"
      stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <rect x="9" y="6.5" width="3.2" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 23h22" stroke="#fff" strokeWidth="1.1" opacity="0.5" />
  </svg>
);

const Logo = ({ accent = '#2563EB', light = false, compact = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <span style={{ color: accent, display: 'flex' }}><ShipMark size={compact ? 22 : 26} /></span>
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 1, lineHeight: 1 }}>
      <span style={{ fontWeight: 700, fontSize: compact ? 17 : 19, letterSpacing: '-0.02em',
        color: light ? '#fff' : '#0F1B2D' }}>Trade</span>
      <span style={{ fontWeight: 700, fontSize: compact ? 17 : 19, letterSpacing: '-0.02em', color: accent }}>AI</span>
    </span>
  </div>
);

const NexavineTag = ({ light }) => (
  <span style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
    color: light ? 'rgba(255,255,255,0.55)' : '#94A3B8' }}>by Nexavine Tech</span>
);

// --- Functional icons ---
const IconUpload = (p) => <Icon {...p}><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 19h14" /></Icon>;
const IconFile = (p) => <Icon {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 21V5a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M5 12.5 10 17 19 7" /></Icon>;
const IconAlert = (p) => <Icon {...p}><path d="M12 9v4m0 4h.01" /><path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /></Icon>;
const IconFlag = (p) => <Icon {...p}><path d="M5 21V4m0 0 8 1 6-1v9l-6 1-8-1" /></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14m-6-6 6 6-6 6" /></Icon>;
const IconChevron = (p) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>;
const IconClose = (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
const IconDownload = (p) => <Icon {...p}><path d="M12 4v11m0 0 4-4m-4 4-4-4" /><path d="M5 20h14" /></Icon>;
const IconSend = (p) => <Icon {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="m22 2-11 11" /></Icon>;
const IconCopy = (p) => <Icon {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></Icon>;
const IconShield = (p) => <Icon {...p}><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" /></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconLink = (p) => <Icon {...p}><path d="M9 15l6-6" /><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></Icon>;
const IconWebhook = (p) => <Icon {...p}><path d="M9 8a3 3 0 1 1 4 2.8L10.5 15" /><path d="M7 13a3 3 0 1 0 2 5.2h5" /><path d="M16 12a3 3 0 1 1-1.5 5.6L12 13" /></Icon>;
const IconCode = (p) => <Icon {...p}><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /></Icon>;
const IconChart = (p) => <Icon {...p}><path d="M4 20V10m5 10V4m5 16v-6m5 6V8" /></Icon>;
const IconFilter = (p) => <Icon {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icon>;
const IconLayers = (p) => <Icon {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Icon>;
const IconSpark = (p) => <Icon {...p}><path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M18 6l-2.5 2.5M6 18l2.5-2.5M18 18l-2.5-2.5" /></Icon>;

Object.assign(window, {
  Icon, ShipMark, Logo, NexavineTag,
  IconUpload, IconFile, IconCheck, IconAlert, IconFlag, IconArrowRight, IconChevron,
  IconClose, IconDownload, IconSend, IconCopy, IconShield, IconSearch, IconLink,
  IconWebhook, IconCode, IconChart, IconFilter, IconClock, IconLayers, IconSpark,
});
