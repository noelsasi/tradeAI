// Screen 3 — Results Dashboard. Two layout directions: 'sidebar' and 'terminal'.

function RiskDot({ risk }) {
  const c = { Clear: '#16A34A', Review: '#D97706', Flagged: '#DC2626' }[risk] || '#16A34A';
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: c, flexShrink: 0 }} />;
}

// One table row (+ inline expand for quick reasoning)
function ResultRow({ item, accent, mono, density, layout, onOpen }) {
  const [open, setOpen] = React.useState(false);
  const pad = density === 'compact' ? '9px 14px' : density === 'comfy' ? '16px 16px' : '12px 15px';
  const riskColor = { Clear: '#16A34A', Review: '#D97706', Flagged: '#DC2626' }[item.risk];
  const [hover, setHover] = React.useState(false);
  return (
    <React.Fragment>
      <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ borderBottom: '1px solid #F1F5F9', background: hover ? '#FBFCFE' : '#fff', cursor: 'pointer' }}
        onClick={() => onOpen(item)}>
        <td style={{ padding: pad, borderLeft: layout === 'terminal' ? `3px solid ${riskColor}` : '3px solid transparent', verticalAlign: 'top' }}>
          <span style={{ fontFamily: mono, fontSize: 12.5, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
            {String(item.id).padStart(2, '0')}
          </span>
        </td>
        <td style={{ padding: pad, verticalAlign: 'top', maxWidth: 360 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
              style={{ marginTop: 1, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8',
                display: 'flex', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} title="Show reasoning">
              <window.IconChevron size={15} sw={2.2} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 550, color: '#0F1B2D', lineHeight: 1.35,
                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: density === 'compact' ? 1 : 2, WebkitBoxOrient: 'vertical' }}>
                {item.desc}
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                Origin {item.origin} · {item.qty}
              </div>
            </div>
          </div>
        </td>
        <td style={{ padding: pad, verticalAlign: 'top' }}>
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#0F1B2D', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
            {item.hs}
          </span>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
        </td>
        <td style={{ padding: pad, verticalAlign: 'top' }}><window.ConfidencePill value={item.confidence} mono={mono} /></td>
        <td style={{ padding: pad, verticalAlign: 'top' }}><window.RiskBadge risk={item.risk} sm /></td>
        <td style={{ padding: pad, verticalAlign: 'top', textAlign: 'right' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600,
            color: hover ? accent : '#94A3B8', whiteSpace: 'nowrap' }}>
            Review <window.IconArrowRight size={14} sw={2} />
          </span>
        </td>
      </tr>
      {open && (
        <tr style={{ background: '#FBFCFE' }}>
          <td colSpan={6} style={{ padding: '0 18px 16px 50px' }}>
            <div style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: accent, textTransform: 'uppercase', marginBottom: 5 }}>AI Reasoning</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, maxWidth: 720 }}>{item.reasoning}</div>
              {item.flagNote && (
                <div style={{ marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 7,
                  background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 12.5, fontWeight: 600 }}>
                  <window.IconAlert size={14} sw={2.2} /> {item.flagNote}
                </div>
              )}
              <div style={{ marginTop: 10 }}>
                <window.Btn kind="ghost" sm icon={window.IconArrowRight} onClick={() => onOpen(item)}>Open full detail</window.Btn>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

function ResultsTable({ items, accent, mono, density, layout, onOpen }) {
  const th = { textAlign: 'left', padding: '11px 15px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: '#94A3B8', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 1 };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
      <thead>
        <tr>
          <th style={th}>Line</th>
          <th style={th}>Product Description</th>
          <th style={th}>HS Code · 12-digit</th>
          <th style={th}>Confidence</th>
          <th style={th}>Risk</th>
          <th style={{ ...th, textAlign: 'right' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => <ResultRow key={it.id} item={it} accent={accent} mono={mono} density={density} layout={layout} onOpen={onOpen} />)}
      </tbody>
    </table>
  );
}

function FilterBar({ filter, setFilter, query, setQuery, accent, mono, count }) {
  const chips = ['All', 'Flagged', 'Review', 'Clear'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><window.IconSearch size={15} sw={2} /></span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description or HS code…"
          style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13,
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0F1B2D' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: '#CBD5E1', display: 'flex', marginRight: 2 }}><window.IconFilter size={15} sw={2} /></span>
        {chips.map((c) => {
          const on = filter === c;
          return (
            <button key={c} onClick={() => setFilter(c)} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${on ? accent : '#E2E8F0'}`,
              background: on ? accent : '#fff', color: on ? '#fff' : '#475569', transition: 'all .12s' }}>{c}</button>
          );
        })}
      </div>
      <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#94A3B8', fontFamily: mono }}>{count} items</span>
    </div>
  );
}

function ExportButtons({ accent, stacked }) {
  return (
    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', flexDirection: stacked ? 'column' : 'row' }}>
      <window.Btn kind="ghost" sm icon={window.IconDownload} style={stacked ? { justifyContent: 'flex-start' } : null}>Export CSV</window.Btn>
      <window.Btn kind="ghost" sm icon={window.IconLayers} style={stacked ? { justifyContent: 'flex-start' } : null}>Export Mirsal 2 Format</window.Btn>
      <window.Btn kind="primary" accent={accent} sm icon={window.IconSend} style={stacked ? { justifyContent: 'flex-start' } : null}>Send to Ops Team</window.Btn>
    </div>
  );
}

function ResultsScreen({ accent, mono, density, layout, onOpen }) {
  const D = window.TRADEAI_DATA;
  const S = D.summary;
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const items = D.items.filter((it) => {
    const mf = filter === 'All' || it.risk === filter;
    const q = query.trim().toLowerCase();
    const mq = !q || it.desc.toLowerCase().includes(q) || it.hs.includes(q) || it.title.toLowerCase().includes(q);
    return mf && mq;
  });

  // ---------- TERMINAL layout ----------
  if (layout === 'terminal') {
    return (
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 28px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>Classification Report · {D.docMeta.client}</div>
            <h2 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1B2D', margin: '3px 0 0' }}>{D.docMeta.ref}</h2>
          </div>
          <ExportButtons accent={accent} />
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, background: '#E8EDF3',
          border: '1px solid #E8EDF3', borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
          {[
            { label: 'Items Classified', value: S.total, sub: 'across 2 documents' },
            { label: 'Flagged', value: S.flagged, tone: '#DC2626', sub: 'require action' },
            { label: 'For Review', value: S.review, tone: '#D97706', sub: 'low confidence' },
            { label: 'Sanctions Hits', value: S.sanctions, tone: S.sanctions ? '#DC2626' : '#16A34A', sub: 'OFAC partial match' },
            { label: 'Processing Time', value: S.processingTime + 's', sub: 'end-to-end' },
            { label: 'Compliance', value: S.complianceScore, tone: accent, sub: 'overall score / 100' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#fff', padding: '16px 16px' }}>
              <window.Stat {...k} mono={mono} />
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #E8EDF3', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
            <FilterBar filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} accent={accent} mono={mono} count={items.length} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <ResultsTable items={items} accent={accent} mono={mono} density={density} layout={layout} onOpen={onOpen} />
          </div>
        </div>
      </div>
    );
  }

  // ---------- SIDEBAR layout (default) ----------
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 28px 56px' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 18,
        background: '#0F1B2D', borderRadius: 14, padding: '16px 22px', color: '#fff' }}>
        <div style={{ marginRight: 'auto' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600, whiteSpace: 'nowrap' }}>Classification Report · {D.docMeta.client}</div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 2, fontFamily: mono }}>{D.docMeta.ref}</div>
        </div>
        {[
          { label: 'Classified', value: S.total },
          { label: 'Flagged', value: S.flagged, tone: '#FCA5A5' },
          { label: 'Sanctions Hits', value: S.sanctions, tone: '#FCA5A5' },
          { label: 'Time', value: S.processingTime + 's', tone: '#86EFAC' },
        ].map((k, i) => (
          <div key={k.label} style={{ padding: '0 22px', borderLeft: '1px solid rgba(255,255,255,0.12)', textAlign: 'left' }}>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: mono, color: k.tone || '#fff', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 270px', gap: 18, alignItems: 'start' }}>
        {/* Main table card */}
        <div style={{ background: '#fff', border: '1px solid #E8EDF3', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
            <FilterBar filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} accent={accent} mono={mono} count={items.length} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <ResultsTable items={items} accent={accent} mono={mono} density={density} layout={layout} onOpen={onOpen} />
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 78 }}>
          <div style={{ background: '#fff', border: '1px solid #E8EDF3', borderRadius: 14, padding: '20px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 }}>Compliance Score</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}><window.ScoreRing score={S.complianceScore} accent={accent} /></div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 12, lineHeight: 1.45 }}>
              {S.flagged + S.review} of {S.total} line items need attention before Mirsal 2 submission.
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #E8EDF3', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>Risk Breakdown</div>
            {[['Clear', S.clear, '#16A34A'], ['Review', S.review, '#D97706'], ['Flagged', S.flagged, '#DC2626']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: c }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{l}</span>
                <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#0F1B2D' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #E8EDF3', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>Export</div>
            <ExportButtons accent={accent} stacked />
          </div>
        </aside>
      </div>
    </div>
  );
}
window.ResultsScreen = ResultsScreen;
