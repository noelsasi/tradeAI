// Screen 2 — AI Processing State
function ProcessingScreen({ accent, mono, onDone }) {
  const D = window.TRADEAI_DATA;
  const steps = D.processingSteps;
  const [active, setActive] = React.useState(0); // index currently spinning
  const [eta, setEta] = React.useState(12);

  React.useEffect(() => {
    const durations = [1900, 3400, 2600, 2200];
    let t = setTimeout(function next() {
      setActive((a) => {
        const n = a + 1;
        if (n >= steps.length) { setTimeout(() => onDone(), 700); return a; }
        t = setTimeout(next, durations[n] || 2200);
        return n;
      });
    }, durations[0]);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const i = setInterval(() => setEta((e) => (e > 1 ? +(e - 0.6).toFixed(1) : e)), 600);
    return () => clearInterval(i);
  }, []);

  const pct = Math.min(100, Math.round(((active + 0.5) / steps.length) * 100));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '88px 32px 48px' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 13px', borderRadius: 999,
          background: '#EFF4FF', border: '1px solid #DBE4FF', color: accent, fontSize: 12.5, fontWeight: 600 }}>
          <span className="ta-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: accent }} />
          Processing · {D.docMeta.ref}
        </div>
      </div>
      <h2 style={{ textAlign: 'center', fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1B2D', margin: '14px 0 4px' }}>
        Analyzing your shipment
      </h2>
      <p style={{ textAlign: 'center', fontSize: 14.5, color: '#94A3B8', margin: 0 }}>
        TradeAI is reading {D.docMeta.files.length} documents and classifying every line item.
      </p>

      {/* Progress bar */}
      <div style={{ margin: '34px 0 8px', height: 7, borderRadius: 999, background: '#EEF2F6', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 999,
          background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, transition: 'width .9s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#94A3B8', fontFamily: mono }}>
        <span>{pct}% complete</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <window.IconClock size={13} sw={2} /> ~{eta > 0 ? eta : 1}s remaining
        </span>
      </div>

      {/* Steps */}
      <div style={{ marginTop: 30, border: '1px solid #EEF2F6', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
        {steps.map((s, i) => {
          const state = i < active ? 'done' : i === active ? 'active' : 'pending';
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              borderBottom: i < steps.length - 1 ? '1px solid #F1F5F9' : 'none',
              background: state === 'active' ? '#FBFCFE' : '#fff', transition: 'background .3s' }}>
              {/* status dot */}
              <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: state === 'done' ? '#DCFCE7' : state === 'active' ? '#EFF4FF' : '#F1F5F9',
                color: state === 'done' ? '#15803D' : state === 'active' ? accent : '#CBD5E1' }}>
                {state === 'done' ? <window.IconCheck size={17} sw={2.6} />
                  : state === 'active' ? <span className="ta-spin" style={{ width: 16, height: 16, borderRadius: 999,
                      border: `2.4px solid ${accent}33`, borderTopColor: accent, display: 'block' }} />
                  : <span style={{ width: 7, height: 7, borderRadius: 999, background: '#CBD5E1' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600,
                  color: state === 'pending' ? '#94A3B8' : '#0F1B2D' }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 1,
                  opacity: state === 'pending' ? 0.6 : 1 }}>{s.detail}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: mono, letterSpacing: '0.02em',
                color: state === 'done' ? '#15803D' : state === 'active' ? accent : '#CBD5E1' }}>
                {state === 'done' ? 'DONE' : state === 'active' ? 'RUNNING' : 'QUEUED'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.ProcessingScreen = ProcessingScreen;
