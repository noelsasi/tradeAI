// Screen 1 — Landing / Upload
function LandingScreen({ accent, mono, onClassify }) {
  const D = window.TRADEAI_DATA;
  const [dragging, setDragging] = React.useState(false);
  const [dropped, setDropped] = React.useState(false);
  const [text, setText] = React.useState('');
  const ready = dropped || text.trim().length > 8;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '64px 32px 48px' }}>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 11px', borderRadius: 999,
          background: '#EFF4FF', border: '1px solid #DBE4FF', color: accent, fontSize: 12, fontWeight: 600 }}>
          <window.IconSpark size={13} sw={2} /> AI Customs Engine · GCC Tariff 2026
        </span>
      </div>
      <h1 style={{ fontSize: 46, lineHeight: 1.04, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: '#0F1B2D', textWrap: 'balance' }}>
        Classify GCC HS Codes<br />in <span style={{ color: accent }}>10 seconds</span>.
      </h1>
      <p style={{ fontSize: 17, color: '#64748B', margin: '16px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
        AI-powered customs compliance for UAE freight forwarders. Upload an invoice or packing list and get
        12-digit classifications, sanctions screening, and a Mirsal 2-ready report.
      </p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); setDropped(true); }}
        onClick={() => setDropped(true)}
        style={{
          marginTop: 34, borderRadius: 16, cursor: 'pointer',
          border: `2px dashed ${dragging ? accent : dropped ? '#BBF7D0' : '#CBD5E1'}`,
          background: dragging ? '#EFF4FF' : dropped ? '#F0FDF4' : '#FBFCFE',
          padding: '40px 32px', textAlign: 'center', transition: 'all .16s ease',
        }}>
        {!dropped ? (
          <React.Fragment>
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: accent, color: '#fff', boxShadow: `0 8px 20px ${accent}33` }}>
              <window.IconUpload size={26} sw={2} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 650, color: '#0F1B2D' }}>Drop invoice, packing list, or PDF</div>
            <div style={{ fontSize: 13.5, color: '#94A3B8', marginTop: 5 }}>
              or <span style={{ color: accent, fontWeight: 600 }}>browse files</span> · PDF, XLSX, CSV up to 25 MB
            </div>
          </React.Fragment>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: '#DCFCE7', color: '#15803D' }}>
              <window.IconCheck size={24} sw={2.4} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 650, color: '#0F1B2D' }}>2 documents ready</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 2 }}>
              {D.docMeta.files.map((f) => (
                <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                  borderRadius: 7, background: '#fff', border: '1px solid #E2E8F0', fontSize: 12.5, color: '#334155', fontFamily: mono }}>
                  <window.IconFile size={13} sw={2} style={{ color: '#94A3B8' }} />{f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OR paste */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#94A3B8' }}>OR PASTE DESCRIPTION</span>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
        placeholder="e.g. 120x Dell Latitude notebooks, 14 inch, Intel i5, 16GB RAM, origin China…"
        style={{ width: '100%', minHeight: 88, resize: 'vertical', padding: '13px 15px', borderRadius: 12,
          border: '1px solid #E2E8F0', fontSize: 14, fontFamily: 'inherit', color: '#0F1B2D', outline: 'none',
          boxSizing: 'border-box', lineHeight: 1.5, background: '#fff' }} />

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
        <window.Btn kind="primary" accent={accent} icon={window.IconArrowRight}
          onClick={() => onClassify()} style={{ padding: '12px 22px', fontSize: 15, opacity: ready ? 1 : 0.55, pointerEvents: ready ? 'auto' : 'none' }}>
          Classify Now
        </window.Btn>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>{ready ? 'Avg. classification time ~12s' : 'Add a document or description to begin'}</span>
      </div>

      {/* Trust signals */}
      <div style={{ marginTop: 56, paddingTop: 22, borderTop: '1px solid #EEF2F6',
        display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
        {[
          { t: 'Mirsal 2 Ready', I: window.IconShield },
          { t: 'OFAC Screened', I: window.IconSearch },
          { t: 'GCC 12-Digit Compliant', I: window.IconLayers },
        ].map(({ t, I }) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
            <span style={{ color: accent, display: 'flex' }}><I size={16} sw={2} /></span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}
window.LandingScreen = LandingScreen;
