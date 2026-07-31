# CHANGELOG — Snowball Pro v5.0

> Simulation patrimoniale haut de gamme

---

## Architecture & Stack Technique

- **Framework :** React 19.2 avec StrictMode + TypeScript 5.9 (strict)
- **Bundler :** Vite 7.2 + plugin `vite-plugin-singlefile` (tout inline dans un unique `index.html`)
- **CSS :** Tailwind CSS v4.1 via `@tailwindcss/vite` + variables CSS (thème doré `#d4af37`)
- **State :** état local React uniquement (`useState` dans `App.tsx`), persistance localStorage
- **Animations :** Framer Motion 12.42
- **Graphiques :** Recharts 3.9
- **Icônes :** Lucide React
- **Utilitaires :** `clsx` + `tailwind-merge` (`cn`)

> **Retirés en v5.0 :** Zustand (store mort), Radix UI, Chart.js, hooks store-based
> (useStorage, useKeyboardShortcuts, undo/redo, scénarios A/B), composants
> `ui/radix`, `ComparisonBar`, `index 2.css` (CSS legacy orphelin).

---

## Modules / Fichiers Sources

### `src/types.ts` — Modèle de données complet (`SimulationInputs`, `YearRow`, `DecumulationResult`…)

### `src/engine/` — Moteur de calcul patrimonial modulaire (13 modules)

- `math.ts` — FV, PMT, percentiles, drawdown, average, stddev
- `taxes.ts` — fiscalité française (CTO, PEA, AV, PER)
- `formatting.ts` — formateurs monétaires (€, M€, Md€)
- `rng.ts` — générateur aléatoire (mulberry32, Box-Muller)
- `historical.ts` — données historiques par indice (1995-2025)
- `crisis.ts` — profils de crise financière
- `simulation.ts` — moteur de projection année par année
- `montecarlo.ts` — simulations stochastiques
- `decumulation.ts` — phase de décaissement (rente)
- `kpis.ts` — indicateurs de performance
- `validation.ts` — validation et sanitisation des entrées
- `migration.ts` — `DEFAULT_INPUTS`, clés localStorage, mapping v4 → v5
- `index.ts` — point d'entrée unique ré-exportant tout (via `src/engine.ts`)

### `src/App.tsx` — Coquille mince (~170 lignes)

- État local (`inputs`, `activeTab`, `decumResult`) + `runSimulation` mémoïsé
- Persistance : lit `snowball_v5_settings`, fallback migration depuis `snowball_v4_settings`
- Orchestration des 4 onglets (Simulateur, Monte Carlo, Rente & Retraite, Objectif), export CSV

### `src/components/` — 26 composants prop-based (aucun import store)

- `Layout/` — Sidebar, TabBar, ActionBar, DisclaimerBar
- `Tabs/` — SimulatorTab, MonteCarloPanel, RenteRetraiteTab, GoalTab
- `Charts/` — EquityChart, MonteCarloChart, DrawdownChart, CapitalAllocation
- `Forms/` — EnvelopeSelector, CrisisSelector, ExpenseForm, BacktestSelector
- `Simulation/` — KpiGrid, FiscalPanel, MilestoneTimeline, AmortissementTable, GoalProgress, FeeImpact, AIInsightCard
- `shared/` — SliderInput, SmartInput, Toggle, SectionTitle, CustomTooltip

### `src/utils/` — Utilitaires

- `cn.ts` — Fusion de classes Tailwind (clsx + tailwind-merge)
- `chartTheme.ts` — Thème Recharts (clair/sombre)

---

## Tests (38)

`src/__tests__/engine.test.ts` — math, formatting, fiscalité française, simulation, KPIs, goal solver, migration v4→v5.

---

## Commandes

```bash
npm run dev         # Serveur de développement Vite
npm run build       # Build production (singlefile → dist/index.html)
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run test        # Vitest (38 tests)
npm run format      # Prettier
```
