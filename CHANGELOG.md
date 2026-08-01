# CHANGELOG — Snowball Pro v5.1

> Simulation patrimoniale haut de gamme

---

## v5.1.3 — Suppression du « Millésime fiscal » + fiscalité TMI/barème

- **Suppression du réglage « Millésime fiscal »** : le curseur 2020–2032 ne
  changeait AUCUN calcul — le moteur (`taxes.ts`) utilise des constantes fixes
  (17,2 % cotisations, 12,8 % IR, abattements AV 4 600/9 200 €) qui ne lisent
  jamais `fiscalYear`. Le champ ne servait qu'à afficher des libellés (« Règles
  2026 » → « Règles 2020 »). Retiré de `SimulationInputs`, de `NUMERIC_KEYS`,
  de `validateInputs`/`sanitizeInputs`, de la sidebar (section « Compte
  d'investissement » simplifiée) et du hash de fraîcheur Monte-Carlo (il
  provoquait des « relancez pour mettre à jour » inutiles).
- **Fiscalité CTO en barème progressif (TMI)** : nouveau champ `tmi` (tranche
  marginale d'imposition, 0–45 %) et `ctoTaxMode` (« pfu » par défaut ou
  « bareme »). En barème, les plus-values CTO sont taxées à la TMI avec
  abattement de 40 % sur les dividendes ; le PER applique la TMI à la sortie
  (abattement 10 %) et l'économie d'impôt à l'entrée est réinvestie ; les
  plafonds de primes AV (150/300 k€) et le taux 12,8 % au-delà sont modélisés.
- **Décaissement (Rente) réécrit** : rééchantillonnage par blocs des
  rendements historiques réels (identique au Monte-Carlo), cumul mensuel des
  retraits (indexation inflation prise en compte), 10 000 runs max.
- **Libellés harmonisés** : les panneaux affichent désormais « règles en
  vigueur » (FiscalPanel, MethodologyPanel, SummaryStats, DisclaimerBar) au
  lieu d'une année figée qui serait devenue fausse.
- **Service worker** : `CACHE_VERSION` bumpé à `snowball-pro-v5.1.3`.
- **Tests** : 133 tests (fixtures et bloc « millésime fiscal » mis à jour,
  - blocs TMI/barème, netYield, rééchantillonnage par blocs, + 10 tests
    composants jsdom dans `components.test.tsx` : undo/redo, comparaison A/B,
    snapshots, export CSV, ErrorBoundary, partage URL).

---

## v5.1.2 — Suppression « Mois de début » + corrections release

- **Suppression du réglage « Mois de début »** : le champ `startMonth` ne servait
  qu'à décaler les dates affichées (valeur par défaut = janvier). Retiré de
  `SimulationInputs`, de la migration v4→v5, de `NUMERIC_KEYS`, du moteur
  (`simulation.ts`) et de la sidebar (section « Calendrier » supprimée). Les
  projections recommencent toujours en janvier ; les réglages sauvegardés avec
  un mois non nul sont ignorés (aucun changement sur les montants calculés).
- **Service worker** : la purge de l'activation ne touche plus QUE les caches
  `snowball-pro-*` (avant, elle supprimait les caches des autres applications
  sur origine partagée) ; `CACHE_VERSION` bumpé à `snowball-pro-v5.1.2`.
- **Typecheck** : `/// <reference types="vite/client" />` dans `src/main.tsx`
  (résout l'erreur `ImportMeta.env`).
- **Lint** : `URL` ajouté aux globals du service worker dans `eslint.config.js`.
- **Tests** : assertion `escapeCsvCell` corrigée (préfixe `'` placé À
  L'INTÉRIEUR des guillemets, anti-injection OWASP) ; test ajouté « la
  projection démarre en janvier » ; timeouts Monte-Carlo élargis à 30 s.

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
- **Hygiène** : `zustand` et `immer` supprimés des dépendances (0 import dans
  `src/`, vestiges de la v4 — cf. AGENTS.md qui les annonçait déjà retirés).
  Purge des caches du service worker ciblée sur `snowball-pro-*` uniquement
  (jamais les caches d'autres apps sur une origine partagée). Timeouts des
  tests Monte-Carlo élargis (30 s — machine lente).

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

## Tests (92)

`src/__tests__/engine.test.ts` — math, formatting, fiscalité française, simulation, KPIs, goal solver, migration v4→v5, history (undo/redo), snapshots, comparaison A/B.

---

## Commandes

```bash
npm run dev         # Serveur de développement Vite
npm run build       # Build production (singlefile → dist/index.html)
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run test        # Vitest (133 tests : engine node + composants jsdom)
npm run format      # Prettier
```
