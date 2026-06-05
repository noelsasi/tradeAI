# TradeAI Frontend — Engineering Guidelines

> This document is the single source of truth for architecture, coding standards, and tooling.  
> Every engineer (and AI assistant) working on this project must follow it.  
> Update it when conventions change — never let code drift silently from these rules.

---

## Table of Contents

1. [Project Stack](#1-project-stack)
2. [Folder Structure](#2-folder-structure)
3. [Absolute Imports](#3-absolute-imports)
4. [shadcn/ui Convention](#4-shadcnui-convention)
5. [Naming Conventions](#5-naming-conventions)
6. [Component Rules (Atomic Design)](#6-component-rules-atomic-design)
7. [TypeScript Rules](#7-typescript-rules)
8. [State Management](#8-state-management)
9. [Styling Rules](#9-styling-rules)
10. [Import Order](#10-import-order)
11. [Testing](#11-testing)
12. [Git & Pre-commit](#12-git--pre-commit)
13. [Performance](#13-performance)
14. [Security](#14-security)
15. [Multi-client Scaling](#15-multi-client-scaling)
16. [Available Scripts](#16-available-scripts)

---

## 1. Project Stack

| Layer      | Choice                          | Notes                                          |
| ---------- | ------------------------------- | ---------------------------------------------- |
| Framework  | Vite + React 19                 | No Next.js — pure SPA                          |
| Language   | TypeScript (strict)             | No `any`, no implicit returns                  |
| Styling    | Tailwind CSS v3 + CSS variables | Layout via Tailwind, brand colors via CSS vars |
| Components | shadcn/ui (atoms) + custom      | shadcn installs to `common/components/ui/`     |
| State      | Zustand                         | Feature-scoped stores, one global store        |
| Testing    | Vitest + Testing Library        | Co-located test files                          |
| Linting    | ESLint (flat config)            | Zero warnings allowed in CI                    |
| Formatting | Prettier                        | Enforced on commit via Husky                   |
| Git hooks  | Husky + lint-staged             | Blocks commits that fail lint/format           |

---

## 2. Folder Structure

```
src/
├── assets/                        # Static files: images, fonts, SVGs
│
├── common/                        # Shared across all features
│   ├── components/
│   │   ├── ui/                    # shadcn/ui installs here — DO NOT EDIT DIRECTLY
│   │   ├── atoms/                 # Smallest reusable units (no business logic)
│   │   ├── molecules/             # Composed from atoms
│   │   ├── organisms/             # Complex sections (TopBar, DetailDrawer)
│   │   └── templates/             # Page-level layout shells (add when needed)
│   ├── hooks/                     # Shared custom hooks
│   ├── utils/                     # Pure helper functions, no side effects
│   └── config/
│       └── theme.ts               # Brand color constants + CSS variable names
│
├── features/                      # One folder per product feature
│   ├── upload/
│   │   ├── components/            # Feature-specific components
│   │   └── pages/                 # Screen-level components
│   ├── classification/
│   │   ├── components/
│   │   ├── pages/
│   │   └── state/                 # Zustand store scoped to this feature
│   └── integration/
│       └── pages/
│
├── infrastructure/                # External world — adapters + providers
│   ├── adapters/
│   │   ├── api/                   # All HTTP calls live here, never in components
│   │   └── storage/               # localStorage / sessionStorage abstraction
│   ├── providers/
│   │   ├── theme-provider.tsx
│   │   └── state-provider.tsx
│   └── config.ts                  # Env vars, API base URL
│
├── test-setup.ts                  # Vitest global setup
└── App.tsx                        # Root: providers + screen routing
```

**Rules:**

- Never create a new top-level folder without discussion.
- No `index.ts` barrel files — they make tree-shaking and navigation harder.
- Co-locate tests with the file they test: `btn.tsx` → `btn.test.tsx`.

---

## 3. Absolute Imports

Always use `@/` — never relative paths that go up more than one level.

```ts
// ✅ Correct
import { Btn } from '@/common/components/atoms/btn'
import { classificationStore } from '@/features/classification/state/classification-store'
import { THEME } from '@/common/config/theme'

// ❌ Wrong
import { Btn } from '../../../common/components/atoms/btn'
```

Configured in `tsconfig.app.json` (`paths`) and `vite.config.ts` (`resolve.alias`).

---

## 4. shadcn/ui Convention

shadcn installs components into `src/common/components/ui/` (configured in `components.json`).

```
common/components/
├── ui/           ← shadcn owns this folder. Never edit files here directly.
├── atoms/        ← Your custom atoms. May wrap shadcn components.
├── molecules/    ← Compose atoms + shadcn primitives.
```

**The wrapper rule:** If you need to customize a shadcn component, wrap it in an atom — never fork the source file in `ui/`.

```tsx
// ✅ correct — atoms/action-btn.tsx wraps shadcn Button
import { Button } from '@/common/components/ui/button'

export function ActionBtn({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button className="font-semibold rounded-lg tracking-wide" {...props}>
      {children}
    </Button>
  )
}

// ❌ wrong — editing ui/button.tsx directly
```

This means shadcn upgrades (`npx shadcn add button`) never overwrite your customizations.

---

## 5. Naming Conventions

| Thing            | Convention                  | Example                    |
| ---------------- | --------------------------- | -------------------------- |
| Files            | `kebab-case.tsx`            | `confidence-pill.tsx`      |
| Components       | `PascalCase`                | `ConfidencePill`           |
| Hooks            | `camelCase`, prefix `use`   | `useKeyboardShortcut`      |
| Stores           | `camelCase`, suffix `Store` | `classificationStore`      |
| Types/Interfaces | `PascalCase`                | `TradeItem`, `Risk`        |
| Constants        | `SCREAMING_SNAKE_CASE`      | `THEME`, `API_BASE_URL`    |
| Utils            | `camelCase`                 | `formatHsCode`, `cn`       |
| Test files       | Same name + `.test.tsx`     | `confidence-pill.test.tsx` |

**Named exports only — no default exports anywhere.**

```ts
// ✅
export function ConfidencePill({ value }: Props) { ... }

// ❌
export default function ConfidencePill({ value }: Props) { ... }
```

---

## 6. Component Rules (Atomic Design)

### Atoms

- No business logic, no API calls, no store access.
- Accept only what they need to render via typed props.
- Under 80 lines. If longer, it's a molecule.

```tsx
// ✅ atom — pure, typed, no side effects
interface ConfidencePillProps {
  value: number
}

export function ConfidencePill({ value }: ConfidencePillProps) {
  const tone = value >= 90 ? 'green' : value >= 70 ? 'yellow' : 'red'
  ...
}
```

### Molecules

- Compose 2–4 atoms into a unit with a single responsibility.
- May have local UI state (open/closed, hover). No store access.

### Organisms

- Complex UI sections like `TopBar`, `DetailDrawer`, `ResultsTable`.
- May read from Zustand store. Must not write to stores directly — fire callbacks up or dispatch actions.

### Pages (in `features/*/pages/`)

- One file per screen.
- Owns data-fetching, store subscriptions, and layout composition.
- Should read thin — mostly composing organisms.
- Max ~150 lines. Split into organisms if longer.

### General component rules

- Prefer stateless components. Add `useState` only when state is truly local.
- Never use array index as `key` — use stable IDs.
- Never use `dangerouslySetInnerHTML` without explicit sanitization.
- Prefer composition over conditional rendering chains longer than 3 branches.

---

## 7. TypeScript Rules

```ts
// ✅ Explicit prop interfaces
interface ResultRowProps {
  item: TradeItem
  onOpen: (item: TradeItem) => void
}

// ❌ No inline object types on props
function ResultRow({ item }: { item: TradeItem }) { ... }

// ✅ Type imports (keeps runtime bundle clean)
import type { TradeItem } from '@/lib/types'

// ❌ No any — ever
const data: any = response.json()

// ✅ Use unknown + narrow instead
const data: unknown = response.json()
if (isTradeItem(data)) { ... }

// ✅ Consistent return types on non-trivial functions
function getConfidenceTone(value: number): 'green' | 'yellow' | 'red' { ... }
```

All types live in `src/lib/types.ts` unless they are component-local (only used by one file).

---

## 8. State Management

**Rule: local state first — Zustand only for state shared across features.**

```
Local useState  →  if state lives in one component
Feature store   →  if state is shared within one feature (e.g. classification filters)
Global store    →  if state crosses feature boundaries (e.g. current screen, drawer item)
```

### Store conventions

```ts
// features/classification/state/classification-store.ts

import { create } from 'zustand'

import type { TradeItem } from '@/lib/types'

interface ClassificationState {
  filter: string
  query: string
  setFilter: (filter: string) => void
  setQuery: (query: string) => void
}

export const useClassificationStore = create<ClassificationState>((set) => ({
  filter: 'All',
  query: '',
  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
}))
```

- Stores are named `use<Feature>Store` and live in `features/<feature>/state/`.
- Never import a feature store from a different feature — use global store for cross-feature state.
- No async logic inside stores — async lives in `infrastructure/adapters/api/`.

---

## 9. Styling Rules

Three layers — each has a job:

| Layer            | Tool             | Used for                                             |
| ---------------- | ---------------- | ---------------------------------------------------- |
| Layout & spacing | Tailwind classes | flex, grid, padding, margin, rounded, shadow         |
| Brand colors     | CSS variables    | `--color-accent`, `--color-navy` — set in `:root`    |
| Dynamic values   | Inline `style`   | widths from data (progress bars), opacity from state |

```tsx
// ✅ Correct: Tailwind for layout, CSS var for brand color, inline for dynamic
<div
  className="flex items-center gap-2 rounded-lg px-3 py-2"
  style={{ background: 'var(--color-accent)', width: `${pct}%` }}
/>

// ❌ Wrong: magic hex in className (breaks theming)
<div className="bg-[#2563EB]" />

// ❌ Wrong: layout in inline style (hard to override, verbose)
<div style={{ display: 'flex', padding: '8px 12px', borderRadius: '8px' }} />
```

### CSS variable convention (defined in `src/index.css`)

```css
:root {
  --color-navy: #0f1b2d;
  --color-accent: #2563eb;
  --color-surface: #f4f7fb;
  --color-border: #e8edf3;
  --color-muted: #64748b;
  --color-subtle: #94a3b8;
}
```

For multi-client theming, override these variables per client in a `ThemeProvider`.

---

## 10. Import Order

ESLint enforces this — do not rearrange manually.

```ts
// 1. React first
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { create } from 'zustand'

// 3. Internal — common (alias)
import { Btn } from '@/common/components/atoms/btn'
import { THEME } from '@/common/config/theme'

// 4. Internal — features (alias)
import { useClassificationStore } from '@/features/classification/state/classification-store'

// 5. Relative
import { ResultRow } from './result-row'

// 6. Type imports (always last)
import type { TradeItem } from '@/lib/types'
```

---

## 11. Testing

### What to test

| Layer     | Test type   | Focus                                   |
| --------- | ----------- | --------------------------------------- |
| Atoms     | Unit        | Renders correctly for each prop variant |
| Molecules | Unit        | Interaction (click, input change)       |
| Organisms | Integration | User flows through the component        |
| Pages     | Integration | Store reads + screen composition        |
| Utils     | Unit        | Pure function input/output              |

### Co-location rule

Tests live next to the file they test:

```
atoms/
├── confidence-pill.tsx
└── confidence-pill.test.tsx
```

### Test style

```tsx
// ✅ Describe by behaviour, not implementation
describe('ConfidencePill', () => {
  it('shows green pill for values 90 and above', () => {
    render(<ConfidencePill value={95} />)
    expect(screen.getByText('95%')).toBeInTheDocument()
    // assert colour class / aria / role
  })

  it('shows red pill for values below 70', () => {
    render(<ConfidencePill value={60} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
  })
})
```

- Never test implementation details (class names, internal state).
- Always test from the user's perspective: what they see, what happens when they interact.
- Aim for ≥80% coverage on atoms and utils. Pages need at least a smoke test.

---

## 12. Git & Pre-commit

### Husky pre-commit hook

On every `git commit`, Husky runs `lint-staged` which:

1. Runs ESLint `--fix` on all staged `.ts`/`.tsx` files
2. Runs Prettier `--write` on all staged files
3. **Blocks the commit** if ESLint reports errors after auto-fix

### Commit message format (Conventional Commits)

```
<type>(<scope>): <short description>

feat(upload): add drag-and-drop zone with file type validation
fix(results): correct confidence pill colour threshold
chore(deps): update shadcn button to v2.1
refactor(classification): split results-table into result-row atom
test(atoms): add coverage for risk-badge variants
docs: update GUIDELINES with shadcn convention
```

Types: `feat` | `fix` | `chore` | `refactor` | `test` | `docs` | `style` | `perf`

---

## 13. Performance

- **Lazy-load all pages** with `React.lazy` + `Suspense`. Pages should never be in the initial bundle.
- **Never memoize prematurely.** Use `useMemo` / `useCallback` only when a profiler shows a problem.
- **Localize state.** A component that only needs one field from a store should select only that field.

```ts
// ✅ Select only what you need — avoids re-render on unrelated state changes
const filter = useClassificationStore((s) => s.filter)

// ❌ Subscribes to entire store — re-renders on any store change
const store = useClassificationStore()
```

- **No anonymous functions as props** to components that are wrapped in `memo`.
- Images in `assets/` should be WebP where possible.

---

## 14. Security

- **Never put secrets in source code.** API keys go in `.env.local` (gitignored).
- **Validate all user input** at the API boundary, not just the UI.
- **No `dangerouslySetInnerHTML`** unless the content is explicitly sanitized with DOMPurify.
- **No direct `eval()`** or `new Function()`.
- **Content Security Policy** — configure this in the server layer before any public deployment.

---

## 15. Multi-client Scaling

This project is built for Nexavine Tech and may be white-labelled for multiple clients (e.g. different freight forwarders). To keep this clean:

### Theme per client

Override CSS variables per client in `ThemeProvider`:

```tsx
// infrastructure/providers/theme-provider.tsx
const CLIENT_THEMES: Record<string, Record<string, string>> = {
  shippify: { '--color-accent': '#2563EB', '--color-navy': '#0F1B2D' },
  dubaicargo: { '--color-accent': '#0E7C86', '--color-navy': '#0D1F2D' },
}

export function ThemeProvider({ client, children }: ThemeProviderProps) {
  const vars = CLIENT_THEMES[client] ?? CLIENT_THEMES.shippify
  return <div style={vars as React.CSSProperties}>{children}</div>
}
```

### Config per client

Client-specific config (API endpoints, feature flags) lives in `infrastructure/config.ts` and is driven by env vars — no hardcoded client logic inside components.

### Never hardcode client names in components

```tsx
// ❌ Wrong
<div>Shippify UAE Dashboard</div>

// ✅ Correct — read from config/store
<div>{config.clientName} Dashboard</div>
```

---

## 16. Available Scripts

| Command                 | What it does                         |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start dev server at `localhost:5173` |
| `npm run build`         | Type-check + production build        |
| `npm run preview`       | Serve production build locally       |
| `npm run lint`          | ESLint — zero warnings allowed       |
| `npm run lint:fix`      | ESLint with auto-fix                 |
| `npm run format`        | Prettier — format all files          |
| `npm run format:check`  | Prettier check (CI mode)             |
| `npm run type-check`    | TypeScript check without emitting    |
| `npm run test`          | Vitest in watch mode                 |
| `npm run test:ui`       | Vitest browser UI                    |
| `npm run test:run`      | Single test run (CI)                 |
| `npm run test:coverage` | Coverage report                      |
| `npm run validate`      | Full CI check: types + lint + tests  |

---

> Last updated: 2026-06-04  
> Maintained by: Nexavine Tech
