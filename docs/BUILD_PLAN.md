# TradeAI — Phased Build Plan

> Design reference: `vendor/design/trade-ai/project/`  
> Screenshots: `vendor/design/trade-ai/project/screenshots/`

---

## Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR-ready, easy API routes for the real AI backend later |
| UI | **Tailwind CSS + shadcn/ui** | Matches the design's utility-first style; zero-config dark mode |
| State | **Zustand** | Lightweight, fits the upload → processing → results flow |
| Icons | Custom SVG (port from `icons.jsx`) | Exact match to design (lucide-style stroke icons) |
| Font | Inter (Google Fonts) | Exact match to design |
| Mono font | JetBrains Mono | Used for HS codes, stats, timestamps |
| Charts | — | Score ring is a custom SVG; no chart lib needed in Phase 1 |
| AI backend | Claude API (claude-sonnet-4-6) | Phase 3+ |

---

## Phase 1 — Project Foundation & Design System (Day 1)

**Goal:** Runnable Next.js app with brand tokens, shared components, and routing skeleton.

### Tasks
1. `npx create-next-app@latest tradeai-app --typescript --tailwind --app`
2. Configure Tailwind with brand tokens from design:
   - `navy: #0F1B2D`, `accent: #2563EB`, `bg: #F4F7FB`
   - Font stacks: Inter, JetBrains Mono
3. Create `/src/components/ui/` primitives (pixel-perfect ports from `components.jsx`):
   - `ConfidencePill` — green >90%, yellow 70–90%, red <70%
   - `RiskBadge` — Clear / Review / Flagged
   - `Btn` — primary / ghost / subtle / quiet / solid variants
   - `Stat` — KPI stat block
   - `ScoreRing` — SVG compliance score ring
4. Port all icons from `icons.jsx` → `/src/components/icons.tsx` (typed SVG components)
5. Port Logo + NexavineTag from `icons.jsx` → `/src/components/brand.tsx`
6. Create `TopBar` with sticky header, logo, nav tabs, user pill
7. Set up page routing: `/` (landing), `/processing`, `/results`, `/integrations`
8. Create `/src/lib/demo-data.ts` — typed port of `data.js` (all 16 UAE freight items)

**Deliverable:** `http://localhost:3000` renders the top bar + nav; all primitives render in a `/storybook` or simple `/dev` test page.

---

## Phase 2 — Screen 1: Landing / Upload Page (Day 1–2)

**Goal:** Pixel-perfect Upload screen matching `screen-landing.jsx` + `screenshots/landing.png`.

### Tasks
1. Hero section — badge pill, H1 ("Classify GCC HS Codes in **10 seconds**"), subtext
2. Drag-and-drop upload zone:
   - Idle → dragging (dashed blue border) → dropped (green, file pills shown) states
   - Click-to-upload fallback
   - Show file names as pills with file icon (match design exactly)
3. OR divider → textarea for pasting product description
4. "Classify Now" CTA button — disabled/muted until file or 8+ chars typed
5. Trust signals strip: Mirsal 2 Ready · OFAC Screened · GCC 12-Digit Compliant
6. Wire CTA → `/processing` route

**Deliverable:** Fully interactive landing page; matches design screenshot.

---

## Phase 3 — Screen 2: Processing State (Day 2)

**Goal:** Animated 4-step processing screen matching `screen-processing.jsx` + `screenshots/processing.png`.

### Tasks
1. Pulsing badge ("Processing · INV-2026-04471")
2. Animated progress bar (smooth width transition)
3. Live countdown timer (decrement ~0.6s intervals)
4. Step list with 3 states each: `done` (green check) / `active` (spinning ring) / `queued` (grey dot)
5. QUEUED → RUNNING → DONE progression with realistic timing:
   - Extract: 1.9s, Classify: 3.4s, Screen: 2.6s, Report: 2.2s
6. Auto-navigate to `/results` on completion

**Deliverable:** Processing screen auto-advances and transitions to results.

---

## Phase 4 — Screen 3: Results Dashboard (Day 2–3)

**Goal:** Full results table with sidebar, matching both layout modes from `screen-results.jsx`.

### Tasks
1. **Sidebar layout** (default):
   - Dark navy summary bar: Classified / Flagged / Sanctions / Time KPIs
   - Results table card (left) + sidebar (right, sticky)
   - Sidebar: compliance score ring, risk breakdown (Clear/Review/Flagged counts), export buttons
2. **Terminal layout** (toggle):
   - KPI strip across top (6 metrics in grid)
   - Full-width table below
   - Left-side color bar on each row (green/yellow/red by risk)
3. **Results table** — all 16 line items:
   - Columns: Line # | Product Description | HS Code · 12-digit | Confidence | Risk | Action
   - Expandable rows — click expand chevron shows inline AI reasoning + flag note
   - Hover state on rows
4. **Filter bar**: search input + All / Flagged / Review / Clear chip filters
5. Export buttons: Export CSV · Export Mirsal 2 Format · Send to Ops Team
6. "Review →" action column wires to detail drawer (Phase 5)

**Deliverable:** Full results dashboard; filters work; both layouts switchable.

---

## Phase 5 — Screen 4: Detail Drawer (Day 3)

**Goal:** Slide-in detail panel matching `screen-detail.jsx` + `screenshots/01-drawer.png`.

### Tasks
1. Backdrop scrim (click to close) + slide-in from right (540px wide)
2. Header: line number, risk badge, product description, origin/qty, close button
3. AI Classified Code box: large monospace HS code + confidence pill + title + chapter
4. Sections (collapsible headings in accent color):
   - **AI Reasoning** — full plain-English text + flagNote alert box if present
   - **Confidence Breakdown** — 3 progress bars (heading/subheading/national extension)
   - **Alternative Codes Considered** — card list with code + rejection reason
   - **Sanctions Screening** — 3-up grid: OFAC / UN / EU status tiles
5. Footer: "Override Code" toggle (switches to "Revert to AI Code") + "Accept & Close"
6. Opening/closing animation (`translateX` transition)

**Deliverable:** Click any row → drawer slides in with full item detail.

---

## Phase 6 — Screen 5: Integrations Page (Day 3–4)

**Goal:** Integration screen matching `screen-integration.jsx`.

### Tasks
1. Page header + subtext
2. Three cards:
   - **API Access**: POST endpoint display with copy button, syntax-highlighted JSON sample
   - **Export Formats**: CSV / Excel / Mirsal 2 XML download rows
   - **Webhook / Auto-push**: URL input, trigger toggle (animated), Save button
3. "Coming Soon" strip: Mirsal 2 Direct Submit · CargoWise · Freight Tiger · Email Trigger

**Deliverable:** Full integrations page; copy-to-clipboard works; webhook toggle animates.

---

## Phase 7 — Polish, Accessibility & Responsive (Day 4)

**Goal:** Production-quality finish on all screens.

### Tasks
1. Responsive breakpoints — all screens work on iPad (768px) and mobile (375px):
   - Results sidebar collapses below table on mobile
   - Drawer goes full-screen on mobile
2. Keyboard navigation: Esc closes drawer, Tab order correct
3. ARIA labels on interactive elements (filter chips, confidence pills, risk badges)
4. Page transitions — fade + slide between screens (Framer Motion or CSS)
5. Loading skeletons for table rows
6. Toast notifications for "Copied to clipboard", "Webhook saved", etc.

---

## Phase 8 — Real AI Backend (Week 2+)

**Goal:** Wire UI to actual Claude API for real HS code classification.

### Tasks
1. `/api/classify` Next.js route handler:
   - Accept PDF/text upload via `multipart/form-data`
   - Stream response via Server-Sent Events (SSE) to drive processing screen steps
   - Call Claude API (`claude-sonnet-4-6`) with structured output prompt
2. Claude prompt engineering:
   - System: GCC tariff expert, 12-digit classification, sanctions awareness
   - Tool use: `classify_items` tool with typed schema matching `TRADEAI_DATA` shape
3. PDF extraction: `pdf-parse` or `pdfjs-dist` to extract text from uploaded invoices
4. Sanctions screening: integrate OFAC/UN/EU list lookup (or mock)
5. Mirsal 2 XML export builder
6. API key management + rate limiting

---

## File Structure (target)

```
tradeai-app/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing screen
│   │   ├── processing/page.tsx       # Processing screen
│   │   ├── results/page.tsx          # Results dashboard
│   │   ├── integrations/page.tsx     # Integrations page
│   │   └── api/classify/route.ts     # Phase 8: AI endpoint
│   ├── components/
│   │   ├── brand.tsx                 # Logo, NexavineTag, ShipMark
│   │   ├── icons.tsx                 # All 20+ stroke icons
│   │   ├── top-bar.tsx               # Sticky nav
│   │   ├── detail-drawer.tsx         # Slide-in panel
│   │   └── ui/
│   │       ├── btn.tsx
│   │       ├── confidence-pill.tsx
│   │       ├── risk-badge.tsx
│   │       ├── score-ring.tsx
│   │       └── stat.tsx
│   ├── lib/
│   │   ├── demo-data.ts              # 16 UAE freight items + types
│   │   └── types.ts                  # TradeItem, Summary, etc.
│   └── store/
│       └── use-trade-store.ts        # Zustand: screen, drawerItem, filters
├── vendor/
│   └── design/                       # ← design reference (already copied)
└── tailwind.config.ts
```

---

## Color Reference (from design)

| Token | Hex | Usage |
|---|---|---|
| Navy | `#0F1B2D` | Primary text, summary bar bg |
| Accent blue | `#2563EB` | CTAs, active states, links |
| Surface | `#F4F7FB` | Page background |
| Border | `#E8EDF3` | Card borders |
| Muted text | `#64748B` | Secondary text |
| Subtle text | `#94A3B8` | Labels, placeholders |
| Green | `#16A34A` / `#DCFCE7` | Clear risk, success |
| Amber | `#D97706` / `#FEF3C7` | Review risk, warning |
| Red | `#DC2626` / `#FEE2E2` | Flagged risk, error |
| Mono font | JetBrains Mono | HS codes, KPI numbers, timestamps |

---

## Start Command

```bash
cd tradeai-app
npm run dev
```

Open `vendor/design/trade-ai/project/TradeAI.html` in a browser as the live design reference while building.
