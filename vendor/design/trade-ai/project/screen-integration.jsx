// Screen 5 — Integration Page
function IntegrationScreen({ accent, mono }) {
  const [copied, setCopied] = React.useState('');
  const [hookUrl, setHookUrl] = React.useState('');
  const [hookOn, setHookOn] = React.useState(false);
  const endpoint = 'https://api.nexavine.io/v1/tradeai/classify';
  const sampleJson = `{
  "client": "Shippify UAE",
  "documents": ["invoice.pdf"],
  "options": {
    "format": "gcc_12_digit",
    "sanctions_screen": true,
    "output": "mirsal2"
  }
}`;
  const copy = (key, val) => { navigator.clipboard && navigator.clipboard.writeText(val); setCopied(key); setTimeout(() => setCopied(''), 1400); };

  const cardStyle = { background: '#fff', border: '1px solid #E8EDF3', borderRadius: 16, padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 14 };
  const cardHead = (I, t, d) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF4FF', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I size={19} sw={2} /></span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F1B2D' }}>{t}</span>
      </div>
      <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>{d}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 28px 56px' }}>
      <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', color: '#0F1B2D', margin: 0 }}>Connect TradeAI to Your Workflow</h2>
      <p style={{ fontSize: 15.5, color: '#64748B', margin: '10px 0 0', maxWidth: 580, lineHeight: 1.5 }}>
        Push classifications straight into your customs and freight stack. No login required for this demo.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16, marginTop: 30 }}>
        {/* API */}
        <div style={cardStyle}>
          {cardHead(window.IconCode, 'API Access', 'POST documents and receive classified line items as JSON.')}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>Endpoint</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E8EDF3', borderRadius: 9, padding: '9px 11px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', fontFamily: mono }}>POST</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: '#0F1B2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{endpoint}</span>
              <button onClick={() => copy('ep', endpoint)} title="Copy" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: copied === 'ep' ? '#15803D' : '#94A3B8', display: 'flex' }}>
                {copied === 'ep' ? <window.IconCheck size={15} sw={2.4} /> : <window.IconCopy size={15} sw={2} />}
              </button>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8' }}>Sample Request</span>
              <button onClick={() => copy('json', sampleJson)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: copied === 'json' ? '#15803D' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit' }}>
                {copied === 'json' ? <window.IconCheck size={13} sw={2.4} /> : <window.IconCopy size={13} sw={2} />}{copied === 'json' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, background: '#0F1B2D', color: '#CBD5E1', borderRadius: 10, padding: '13px 14px', fontFamily: mono,
              fontSize: 11.5, lineHeight: 1.6, overflowX: 'auto' }}>{sampleJson}</pre>
          </div>
        </div>

        {/* Export formats */}
        <div style={cardStyle}>
          {cardHead(window.IconDownload, 'Export Formats', 'Download the current report in the format your team needs.')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[['CSV', 'Spreadsheet-ready, all columns', 'csv'], ['Excel (XLSX)', 'Formatted workbook with risk tabs', 'xlsx'], ['Mirsal 2 XML', 'Dubai Customs declaration format', 'xml']].map(([t, d, k]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #EEF2F6', borderRadius: 10, padding: '11px 13px' }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><window.IconFile size={15} sw={2} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 650, color: '#0F1B2D' }}>{t}</div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{d}</div>
                </div>
                <window.Btn kind="subtle" sm icon={window.IconDownload}>Download</window.Btn>
              </div>
            ))}
          </div>
        </div>

        {/* Webhook */}
        <div style={cardStyle}>
          {cardHead(window.IconWebhook, 'Webhook / Auto-push', 'Fire a POST to your endpoint when a classification completes.')}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>Payload URL</div>
            <input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://ops.shippify.ae/hooks/tradeai"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E2E8F0', fontSize: 12.5, fontFamily: mono, outline: 'none', boxSizing: 'border-box', color: '#0F1B2D' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1px solid #EEF2F6', borderRadius: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>Trigger on classification complete</div>
              <div style={{ fontSize: 11.5, color: '#94A3B8' }}>Sends full JSON report</div>
            </div>
            <button onClick={() => setHookOn(!hookOn)} style={{ width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: hookOn ? accent : '#CBD5E1', position: 'relative', transition: 'background .18s' }}>
              <span style={{ position: 'absolute', top: 3, left: hookOn ? 21 : 3, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'left .18s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          <window.Btn kind="primary" accent={accent} icon={window.IconLink} style={{ width: '100%' }}>Save Webhook</window.Btn>
        </div>
      </div>

      {/* Coming soon */}
      <div style={{ marginTop: 34 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 }}>Coming Soon</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Mirsal 2 Direct Submit', 'CargoWise', 'Freight Tiger', 'Email Trigger'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: '#F8FAFC',
              border: '1px dashed #CBD5E1', borderRadius: 12, flex: '1 1 200px' }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', border: '1px solid #E2E8F0', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><window.IconLink size={15} sw={2} /></span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#475569' }}>{t}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', color: '#94A3B8', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 999, padding: '3px 8px' }}>SOON</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.IntegrationScreen = IntegrationScreen;
