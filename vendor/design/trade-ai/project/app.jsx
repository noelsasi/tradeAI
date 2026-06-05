// TradeAI — app shell, routing, top bar, tweaks.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2563EB",
  "density": "regular",
  "font": "Inter",
  "dashboardLayout": "sidebar"
}/*EDITMODE-END*/;

const FONT_STACKS = {
  Inter: "'Inter', system-ui, sans-serif",
  'IBM Plex Sans': "'IBM Plex Sans', system-ui, sans-serif",
  'Plus Jakarta Sans': "'Plus Jakarta Sans', system-ui, sans-serif",
};
const MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace";

function TopBar({ accent, screen, go, processing }) {
  const tabs = [
    { key: 'landing', label: 'Upload', match: ['landing', 'processing'] },
    { key: 'results', label: 'Dashboard', match: ['results'] },
    { key: 'integration', label: 'Integrations', match: ['integration'] },
  ];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, height: 60, display: 'flex', alignItems: 'center',
      gap: 22, padding: '0 24px', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E8EDF3' }}>
      <button onClick={() => go('landing')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
        <window.Logo accent={accent} />
      </button>
      <div style={{ width: 1, height: 26, background: '#E8EDF3' }} />
      <window.NexavineTag />

      <nav style={{ display: 'flex', gap: 4, marginLeft: 18 }}>
        {tabs.map((t) => {
          const on = t.match.includes(screen);
          return (
            <button key={t.key} onClick={() => go(t.key)} style={{ position: 'relative', border: 'none', background: on ? '#F1F5F9' : 'transparent',
              color: on ? '#0F1B2D' : '#64748B', fontSize: 13.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 7 }}>
              {t.label}
              {t.key === 'landing' && processing && <span className="ta-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: accent }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 12px 5px 6px', borderRadius: 999, border: '1px solid #E8EDF3', background: '#fff' }}>
          <span style={{ width: 26, height: 26, borderRadius: 999, background: accent, color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>S</span>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 650, color: '#0F1B2D' }}>Shippify UAE</div>
            <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Demo workspace</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState('landing');
  const [drawerItem, setDrawerItem] = React.useState(null);
  const accent = t.accent;
  const font = FONT_STACKS[t.font] || FONT_STACKS.Inter;

  const go = (s) => { setDrawerItem(null); setScreen(s); window.scrollTo({ top: 0 }); };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: font, color: '#0F1B2D' }}>
      <TopBar accent={accent} screen={screen} go={go} processing={screen === 'processing'} />

      <main key={screen} className="ta-fade">
        {screen === 'landing' && <window.LandingScreen accent={accent} mono={MONO} onClassify={() => go('processing')} />}
        {screen === 'processing' && <window.ProcessingScreen accent={accent} mono={MONO} onDone={() => go('results')} />}
        {screen === 'results' && <window.ResultsScreen accent={accent} mono={MONO} density={t.density} layout={t.dashboardLayout} onOpen={setDrawerItem} />}
        {screen === 'integration' && <window.IntegrationScreen accent={accent} mono={MONO} />}
      </main>

      <window.DetailDrawer item={drawerItem} accent={accent} mono={MONO} onClose={() => setDrawerItem(null)} />

      {/* Tweaks */}
      <window.TweaksPanel>
        <window.TweakSection label="Brand" />
        <window.TweakColor label="Accent" value={t.accent}
          options={['#2563EB', '#0E7C86', '#4F46E5', '#0F766E', '#B45309']}
          onChange={(v) => setTweak('accent', v)} />
        <window.TweakSelect label="Font" value={t.font}
          options={['Inter', 'IBM Plex Sans', 'Plus Jakarta Sans']}
          onChange={(v) => setTweak('font', v)} />
        <window.TweakSection label="Results Dashboard" />
        <window.TweakRadio label="Layout" value={t.dashboardLayout}
          options={['sidebar', 'terminal']}
          onChange={(v) => { setTweak('dashboardLayout', v); }} />
        <window.TweakRadio label="Density" value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />
        <window.TweakSection label="Jump to screen" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {[['landing', 'Upload'], ['processing', 'Processing'], ['results', 'Dashboard'], ['integration', 'Integrations']].map(([k, l]) => (
            <window.TweakButton key={k} label={l} onClick={() => go(k)} />
          ))}
        </div>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
