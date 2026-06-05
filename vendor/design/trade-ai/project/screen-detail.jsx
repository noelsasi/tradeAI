// Screen 4 — Single Item Detail / Reasoning Panel (slide-in drawer)
function DetailDrawer({ item, accent, mono, onClose }) {
  const [overridden, setOverridden] = React.useState(false);
  React.useEffect(() => { setOverridden(false); }, [item && item.id]);
  const sancMap = { Clear: ['#15803D', '#F0FDF4', '#BBF7D0'], Review: ['#B45309', '#FFFBEB', '#FDE68A'], Flagged: ['#B91C1C', '#FEF2F2', '#FECACA'] };

  return (
    <React.Fragment>
      {/* scrim */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.42)',
        opacity: item ? 1 : 0, pointerEvents: item ? 'auto' : 'none', transition: 'opacity .25s', zIndex: 40 }} />
      {/* panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: 'min(540px, 94vw)', background: '#fff',
        boxShadow: '-12px 0 40px rgba(15,27,45,0.18)', zIndex: 41, display: 'flex', flexDirection: 'column',
        transform: item ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .3s cubic-bezier(.4,0,.2,1)' }}>
        {item && (
          <React.Fragment>
            {/* header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #EEF2F6', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#94A3B8' }}>LINE {String(item.id).padStart(2, '0')}</span>
                  <window.RiskBadge risk={item.risk} sm />
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 650, color: '#0F1B2D', lineHeight: 1.4 }}>{item.desc}</div>
                <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>Origin {item.origin} · {item.qty}</div>
              </div>
              <button onClick={onClose} style={{ border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', flexShrink: 0 }}><window.IconClose size={16} sw={2} /></button>
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
              {/* classified code */}
              <div style={{ background: overridden ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${overridden ? '#FDE68A' : '#E8EDF3'}`,
                borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8' }}>
                  {overridden ? 'Manually Overridden Code' : 'AI Classified Code'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: '#0F1B2D', letterSpacing: '0.01em' }}>{item.hs}</span>
                  <window.ConfidencePill value={item.confidence} mono={mono} />
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 7, fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.chapter}</div>
              </div>

              <Section title="AI Reasoning" accent={accent}>
                <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0 }}>{item.reasoning}</p>
                {item.flagNote && (
                  <div style={{ marginTop: 11, display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 13px', borderRadius: 9,
                    background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <span style={{ color: '#B91C1C', marginTop: 1 }}><window.IconAlert size={16} sw={2.2} /></span>
                    <span style={{ fontSize: 12.5, color: '#B91C1C', fontWeight: 600, lineHeight: 1.4 }}>{item.flagNote}</span>
                  </div>
                )}
              </Section>

              <Section title="Confidence Breakdown" accent={accent}>
                {[
                  ['Heading match (4-digit)', Math.min(99, item.confidence + 6)],
                  ['Subheading match (6-digit)', item.confidence],
                  ['GCC national extension (12-digit)', Math.max(50, item.confidence - 9)],
                ].map(([l, v]) => (
                  <div key={l} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{l}</span>
                      <span style={{ fontFamily: mono, fontWeight: 600, color: '#0F1B2D' }}>{v}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: '#EEF2F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: v + '%', borderRadius: 999,
                        background: v < 70 ? '#DC2626' : v < 90 ? '#D97706' : '#16A34A' }} />
                    </div>
                  </div>
                ))}
              </Section>

              <Section title="Alternative Codes Considered" accent={accent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.alternatives.map((a) => (
                    <div key={a.code} style={{ border: '1px solid #EEF2F6', borderRadius: 10, padding: '11px 13px' }}>
                      <div style={{ fontFamily: mono, fontSize: 13.5, fontWeight: 600, color: '#0F1B2D' }}>{a.code}</div>
                      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3, lineHeight: 1.45 }}>{a.reason}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Sanctions Screening" accent={accent}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
                  {[['OFAC', item.sanctions.ofac], ['UN', item.sanctions.un], ['EU', item.sanctions.eu]].map(([l, st]) => {
                    const [tone, bg, bd] = sancMap[st] || sancMap.Clear;
                    return (
                      <div key={l} style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 10, padding: '11px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>{l}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: tone, marginTop: 4 }}>{st === 'Clear' ? 'Clear' : 'Match'}</div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>

            {/* footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #EEF2F6', display: 'flex', gap: 10, background: '#FBFCFE' }}>
              <window.Btn kind="ghost" icon={window.IconCode} onClick={() => setOverridden(!overridden)} style={{ flex: 1 }}>
                {overridden ? 'Revert to AI Code' : 'Override Code'}
              </window.Btn>
              <window.Btn kind="primary" accent={accent} icon={window.IconCheck} onClick={onClose} style={{ flex: 1 }}>Accept & Close</window.Btn>
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
window.DetailDrawer = DetailDrawer;
