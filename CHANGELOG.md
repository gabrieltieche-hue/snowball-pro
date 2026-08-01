# CHANGELOG — Snowball Pro v5.1

> Simulation patrimoniale haut de gamme

---

## v5.1.1 — Durcissement sécurité (audit complet)

- **Dépendances** : `vite` 7.2.4 → 7.3.6 — élimine les 5 advisories connus
  (dont 3 High : bypass `server.fs.deny`, lecture de fichiers arbitraires via
  le WebSocket du dev server, path traversal Windows). `npm audit` = 0 vuln.
- **CSP** : meta Content-Security-Policy dans `index.html` (`default-src 'self'`,
  `script-src-attr 'none'`, `object-src 'none'`, `base-uri 'self'`, `frame-src
  'none'`, fonts Google whitelistées). `script-src 'unsafe-inline'` est requis
  par le build single-file — commenté dans le HTML.
- **En-têtes Vercel** : nouveau `vercel.json` — `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, cache
  contrôlé pour `/` et `/sw.js`.
- **Service worker** : activé et sécurisé — cache versionné `snowball-pro-v5`,
  navigation network-first (plus jamais de version obsolète en cache),
  stale-while-revalidate pour les assets, purge des caches v4, `skipWaiting` +
  `clients.claim`, enregistrement en prod uniquement (`src/main.tsx`).
- **PWA** : icônes 192/512 générées, manifest + favicon câblés.
- **Dev server** : lié à `127.0.0.1` (les failles du dev server ne sont
  exploitables que depuis le réseau).
- **CSV** : `escapeCsvCell` (OWASP CSV Injection) appliqué à toutes les cellules
  de l'export.
- **CI** : actions épinglées par SHA (`checkout@11d5960a`, `setup-node@49933ea5`),
  `permissions: contents: read`, étape `npm audit --audit-level=high`.
- **Outillage tiers** : `.github/hooks/`, `.github/skills/` et `.agents/skills/`
  (code non vérifié, accès réseau/clés) exclus du dépôt (`.gitignore`) — à
  revoir ou retirer localement.
- **Confidentialité** : le disclaimer précise que les données restent en
  localStorage sur l'appareil (aucune transmission).
- **Données historiques** : série `msci-world` remplacée par le MSCI World Net
  Return **EUR** 1970-2025 (56 ans, dividendes réinvestis — recoupée justETF /
  Amundi / Curvo) au lieu de la série USD 1995+. Inflation forfaitaire à
  **2,1 %/an** (l'inflation historique réelle des années 70 faussait les
  moyennes) appliquée au dataset, au mode historique et au défaut app.
  Backtest et Monte-Carlo gagnent 25 années de données supplémentaires.
- **Données historiques** : série `msci-world` remplacée par le MSCI World Net
  Return **EUR** 1970-2025 (56 ans, dividendes réinvestis — recoupée justETF /
  Amundi / Curvo) au lieu de la série USD 1995+. Inflation forfaitaire à
  **2,1 %/an** (l'inflation historique réelle des années 70 faussait les
  moyennes) appliquée au dataset, au mode historique et au défaut app.
  Backtest et Monte-Carlo gagnent 25 années de données supplémentaires.

---

## v5.1.0 — Réintroduction des fonctionnalités v4.1 (Comparaison, Undo/Redo, Snapshots)

- **Comparaison A/B** : mode comparateur restauré — bouton « Comparer » dans l'ActionBar, bannière
  « Mode Comparaison actif », panneau éditant le Scénario B (A figé au lancement), graphique
  comparé A vs B, résumé 3 cartes (A, B, écart +/–), tableau comparatif annuel. Les autres onglets
  (MC, Rente, Objectif) opèrent sur B. `compareScenarios` retypé (`ScenarioComparison`), nouveau
  `mergeComparisonSeries` (alignement des courbes, NaN = courbe incomplète).
- **Undo/Redo** : `src/engine/history.ts` (pile 20 entrées, valeurs précédentes stockées — l'undo
  v4.1 était un no-op), hook `useHistory`, boutons Annuler/Rétablir dans l'ActionBar, raccourcis
  ⌘Z / ⌘⇧Z / ⌘Y (et Ctrl sur Windows) via `useKeyboardShortcuts` (champs de saisie exclus, Ctrl+D
  pour le thème).
- **Snapshots** : `src/engine/snapshots.ts` (CRUD pur, limite 8), persistance
  `snowball_v5_snapshots` (migration best-effort depuis `snowball_pro_v41_state`), panneau
  « Snapshots » en bas de la Sidebar (sauvegarder / charger / supprimer).
- **Bugfix** : `FeeImpact` variable morte supprimée ; `.freebuff/` ignoré par ESLint et git.

### Refonte pédagogique de l'interface (langage débutant)

- **Objectif d'épargne** : onglet « Objectif inversé » renommé, cartes « Épargne mensuelle nécessaire »
  et « Rendement nécessaire » expliquées, progression rebaptisée « Avec votre épargne actuelle »
  (capital projeté affiché), tableau comparatif clarifié.
- **Monte Carlo** : P90/P50/P10 reformulés en « Bonne période de bourse / Scénario moyen / Période
  difficile » avec explications « 1 cas sur 10 », sous-titre explicatif du graphique, légende
  complète, jargon (sigma, loi normale) supprimé.
- **KPI** : labels réécrits sans jargon (Croissance/an, Gain par risque, Pire chute, Multiplié par,
  Pour doubler, Part épargne, Part des gains, Après inflation, Perdu en frais, Frais payés) + 10
  sous-titres explicatifs.
- **Graphiques & cartes** : titres pédagogiques (« D'où vient votre argent ? », « Les baisses de
  votre capital »), légendes « Année N », analyse et conseils reformulés (rendement visé explicite).
- **Sidebar** : sections « Votre épargne », « Comment évolue la bourse ? », « Et si la bourse
  s'effondrait ? », profils de crise « Krach éclair / Marché baissier / Stagnation + inflation »,
  labels de frais simplifiés.
- **Fiscal** : notes PFU/PS/IR et descriptions d'enveloppes réécrites en français clair (moteur
  `taxes.ts`, textes de sortie uniquement), tableau « En € d'aujourd'hui ».
- **Export CSV** : en-têtes lisibles (« Épargné (€) », « Capital (€) »…).

### Persistance

- `snowball_v5_settings` (A), `snowball_v5_settings_b` (B, rétabli au prochain lancement),
  `snowball_v5_snapshots`, `snowball_v5_theme`, `snowball_v5_sidebar`.

---

## v5.0 — Architecture & Stack Technique

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
- `history.ts` — pile undo/redo (ajout v5.1)
- `snapshots.ts` — CRUD snapshots (ajout v5.1)
- `comparison.ts` — série comparée A/B (ajout v5.1)
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

## Tests (64)

`src/__tests__/engine.test.ts` — math, formatting, fiscalité française, simulation, KPIs, goal solver, migration v4→v5, history (undo/redo), snapshots, comparaison A/B.

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
