# Snowball Pro — Agent Guide

## Commands (run in this order: `typecheck` → `lint` → `test` → `build`)

| Command                | What                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Vite dev server                                                                                               |
| `npm run typecheck`    | `tsc --noEmit` (strict mode)                                                                                  |
| `npm run lint`         | ESLint 10 + TypeScript strict + react-hooks                                                                   |
| `npm run lint:fix`     | Auto-fix lint                                                                                                 |
| `npm run test`         | `vitest run` (25 tests, node env)                                                                             |
| `npm run test:watch`   | `vitest` watch mode                                                                                           |
| `npm run test:ui`      | `vitest --ui`                                                                                                 |
| `npm run format`       | Prettier (`semi: false`, `singleQuote: false`, `trailingComma: all`, `printWidth: 120`, `arrowParens: avoid`) |
| `npm run format:check` | Check only                                                                                                    |
| `npm run build`        | Vite build with `vite-plugin-singlefile` → everything inlined in `index.html`                                 |
| `vercel --prod`        | Deploy from root                                                                                              |

## Architecture

- **Single-page app**: React 19 + Zustand 5 + Vite 7 + Tailwind CSS 4 + TypeScript strict
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `vitest.config.ts`)
- **Engine** (`src/engine/`): modular pure functions (math, taxes, simulation, montecarlo, kpis, validation, formatting, rng, historical, crisis). Barrel re-exported via `src/engine.ts` → `src/engine/index.ts`
- **Store** (`src/store.ts`): single Zustand store with A/B scenario comparison, undo/redo (20 levels), localStorage persistence (key `snowball_pro_v41_state`), versioned migration
- **UI components** in `src/components/` (Layout, Forms, Charts, Simulation, shared, ui/radix)
- **Hooks** in `src/hooks/`: useSimulation, useUndoRedo, useStorage, useValidation, useKeyboardShortcuts
- **App is French**: labels, tax rules (CTO/PEA/AV/PER), locale formatting

## Testing

- Tests in `src/__tests__/` using Vitest with `globals: true`, `environment: "node"`
- Cover: math, formatting, French taxes, simulation, KPIs, goal solver
- Add a test for every new engine function
- Single test file: `src/__tests__/engine.test.ts`

## Key conventions

- **No business logic in `App.tsx`** — use hooks or store
- **Engine code is pure** — no side effects, no DOM
- **Deterministic RNG** — mulberry32 with exposed seed for Monte Carlo reproducibility
- **Default theme**: light mode (`class="light-mode"` on `<html>`), toggle switches to `dark`
- **Dark mode toggle** toggles `.light-mode` / `.dark` classes on `<html>`
- **Keyboard shortcuts**: Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+Y redo (macOS Cmd variants), Ctrl+D dark mode

## Quirks

- `vite-plugin-singlefile`: build output is a single `index.html` with all JS/CSS inlined. `dist/` has a few extra files (sw.js, manifest.json) but the app lives in one HTML file
- Tailwind CSS 4 with `@import "tailwindcss"` and `@theme` directive (not `tailwind.config.js`)
- localStorage key: `snowball_pro_v41_state` — preserving backward compatibility matters
- `MEMORY.md` serves as a team session log (not an agent instruction file)
