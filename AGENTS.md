# Snowball Pro — Agent Guide

## Commands (run in this order: `typecheck` → `lint` → `test` → `build`)

| Command                | What                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Vite dev server                                                                                               |
| `npm run typecheck`    | `tsc --noEmit` (strict mode)                                                                                  |
| `npm run lint`         | ESLint 10 + TypeScript strict + react-hooks                                                                   |
| `npm run lint:fix`     | Auto-fix lint                                                                                                 |
| `npm run test`         | `vitest run` (93 tests, node env)                                                                             |
| `npm run test:watch`   | `vitest` watch mode                                                                                           |
| `npm run test:ui`      | `vitest --ui`                                                                                                 |
| `npm run format`       | Prettier (`semi: false`, `singleQuote: false`, `trailingComma: all`, `printWidth: 120`, `arrowParens: avoid`) |
| `npm run format:check` | Check only                                                                                                    |
| `npm run build`        | Vite build with `vite-plugin-singlefile` → everything inlined in `index.html`                                 |
| `vercel --prod`        | Deploy from root                                                                                              |

## Architecture

- **Single-page app**: React 19 + Vite 7 + Tailwind CSS 4 + Recharts + framer-motion + TypeScript strict (Zustand/Radix/Chart.js removed in v5)
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `vitest.config.ts`)
- **Engine** (`src/engine/`): modular pure functions (math, taxes, simulation, montecarlo, kpis, validation, formatting, rng, historical, crisis, decumulation, migration). Barrel re-exported via `src/engine.ts` → `src/engine/index.ts`
- **State**: local component state only (`useState` in `App.tsx`), persisted to localStorage (key `snowball_v5_settings`, read via `parseStoredInputs`, fallback migration from v4 key `snowball_v4_settings` via `v4SettingsToInputs`)
- **UI components** in `src/components/` (Layout, Forms, Charts, Simulation, Tabs, shared) — all prop-based, no store imports
- **App is French**: labels, tax rules (CTO/PEA/AV/PER), locale formatting

## Testing

- Tests in `src/__tests__/` using Vitest with `globals: true`, `environment: "node"`
- Cover: math, formatting, French taxes, simulation, KPIs, goal solver
- Add a test for every new engine function
- Single test file: `src/__tests__/engine.test.ts`

## Key conventions

- **`App.tsx` is a thin shell**: local state (inputs, activeTab), `runSimulation` memo, CSV export, tab orchestration — no business logic beyond that
- **Engine code is pure** — no side effects, no DOM
- **Deterministic RNG** — mulberry32 with exposed seed for Monte Carlo reproducibility
- **Dark mode**: light default; `darkMode` state lives in `App.tsx` (localStorage key `snowball_v5_theme`, default `light`), toggled from `ActionBar`; the `light-mode` class is applied on `<html>` (CSS vars in `index.css`) and components take a `darkMode` prop for Recharts colors via `chartTheme(darkMode)`

## Quirks

- `vite-plugin-singlefile`: build output is a single `index.html` with all JS/CSS inlined. `dist/` has a few extra files (sw.js, manifest.json) but the app lives in one HTML file
- Tailwind CSS 4 with `@import "tailwindcss"` and `@theme` directive (not `tailwind.config.js`)
- localStorage keys: `snowball_v5_settings` (current) and `snowball_v4_settings` (legacy, read-only fallback) — preserving backward compatibility matters
- `MEMORY.md` serves as a team session log (not an agent instruction file)
