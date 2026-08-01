# MÉMOIRE — Snowball Pro v5.0

> Fichier de mémoire persistante : capture chaque session et décision pour garantir une continuité parfaite.

---

## SESSION — 2026-08-01 (v5.1.1 : durcissement sécurité + déploiement prod)

### Résumé

Audit de sécurité complet traité de bout en bout (Vite, CSP, en-têtes Vercel, service worker, CSV injection, CI, hooks tiers), puis commit et déploiement en production.

### Modifications

- **vite** 7.2.4 → 7.3.6 : les 5 advisories (3 High) éliminés — `npm audit` = 0 vuln.
- **CSP** meta dans `index.html` + nouveau `vercel.json` (nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, Cache-Control contrôlé pour `/` et `/sw.js`). `script-src 'unsafe-inline'` assumé (build single-file : tout le JS est inliné) + `script-src-attr 'none'`.
- **Service worker** activé en prod : cache `snowball-pro-v5`, navigation **network-first**, stale-while-revalidate, purge des caches **`snowball-pro-*` uniquement** (jamais ceux d'autres apps sur une origine partagée), `skipWaiting` + `clients.claim`. Enregistrement prod-only dans `main.tsx` (+ `/// <reference types="vite/client" />`).
- **PWA** : icônes 192/512 générées (`scripts/generate-icons.mjs`), manifest + favicon câblés.
- **Dev server** : `host: 127.0.0.1` (server + preview).
- **CSV** : `escapeCsvCell` (OWASP CSV Injection) sur toutes les cellules de l'export.
- **CI** : actions épinglées par SHA (`checkout@11d5960a`, `setup-node@49933ea5`), `permissions: contents: read`, étape `npm audit --audit-level=high`.
- **Hooks tiers** : `.github/hooks/`, `.github/skills/`, `.agents/skills/` gitignorés (supply-chain) — toujours actifs localement (config globale), à retirer si le flux impeccable est inutilisé.
- **Deps** : `zustand` + `immer` supprimés (0 imports, vestiges de la v4).
- **Tests** : timeouts MC élargis à 30 s (machine lente — 12-15 s par test), assertion CSV corrigée (préfixe `'` à l'intérieur des guillemets).

### Vérifications

- Gate : npm audit 0 vuln ✓ typecheck ✓ lint ✓ **93/93 tests** ✓ build ✓ (dist 892 kB / 267 kB gzip).
- Navigateur (dev + build prod servi statiquement) : zéro violation CSP (WebSocket HMR OK, fonts OK), SW `activated` avec cache `snowball-pro-v5`, page contrôlée.
- Déploiement : `vercel --prod` → https://v4-three-beige.vercel.app

### Notes

- Le commit principal (`102da1a8`) a été créé en parallèle pendant la session (identity git de l'utilisateur) ; un second commit couvre les retouches (purge caches SW, types vite/client, lint sw.js, timeouts tests, cleanup deps, docs).

---

## SESSION — 2026-08-01 (v5.1.0 : comparaison A/B, undo/redo, snapshots)

### Résumé

Les 3 fonctionnalités v4.1 perdues lors de la migration v5 ont été restaurées dans l'architecture composants, avec des corrections de bugs v4.1 et une validation Playwright complète.

### Décisions d'architecture

- **Engine pur par fichier** (règle MEMORY) : `src/engine/history.ts`, `snapshots.ts`, `comparison.ts` + `compareScenarios` typé dans `kpis.ts`.
- **Undo/redo corrigé vs v4.1** : l'historique stocke `patch` + `previous` (valeurs d'avant l'édition) par clé → l'undo du v4.1 était un no-op (il ré-appliquait les valeurs courantes).
- **Historique scénario-aware** : chaque entrée porte `scenario: "A" | "B"` → l'undo/redo cible le bon état même après avoir quitté le mode comparaison (bug latent v4.1 évité).
- **Scénario B isolé** : état `inputsB` propre + clé `snowball_v5_settings_b` (survit au rechargement) ; `frozenA` = copie d'`inputsRef.current` au clic « Comparer » ; `applyPatch` route vers le bon ref.
- **Snapshots** : cap 8, clé `snowball_v5_snapshots`, lecture fallback de la clé v4.1 `snowball_pro_v41_state` (migration best-effort).
- **`null` (pas `NaN`)** dans `mergeComparisonSeries` : contrat Recharts pour créer des trous de courbe (tooltip gère `value == null`).

### Modifications

- **Engine** : `history.ts` (cap 20, `HistoryScenario`), `snapshots.ts` (CRUD, cap 8), `comparison.ts` (`mergeComparisonSeries`), `kpis.ts` (`ScenarioComparison`), exports barrel `engine/index.ts`.
- **Hooks** : `src/hooks/useHistory.ts` (API `record(prev, patch, scenario)` → `{patch, scenario}`), `src/hooks/useKeyboardShortcuts.ts` (⌘Z / ⌘⇧Z / ⌘Y / ⌘D, saute les champs de saisie).
- **UI** : `ActionBar.tsx` réécrit (Annuler/Rétablir/Comparer), `ComparisonBar.tsx` (bannière mode actif), `ComparisonTab.tsx` (résumé + courbe + tableau annuel), `ComparisonSummary.tsx` (3 cartes A/B/écart avec préfixe `+`), `ComparisonChart.tsx`, `SnapshotPanel.tsx` (sidebar, boutons sauvegarder/charger/supprimer), `Sidebar.tsx` (badge « Scénario B »).
- **`src/App.tsx`** : câblage complet (état `comparing`/`frozenA`/`inputsB`, handlers undo/redo/snapshots, `applyPatch`), refs (`inputsRef`, `inputsBRef`, `comparingRef`) contre la stale closure, `toggleComparing` pur (StrictMode-safe).
- **Hygiène** : `.freebuff/` ajouté aux ignores ESLint + `.gitignore` (provoquait 108 erreurs lint) ; variable morte `impactPct` supprimée dans `FeeImpact.tsx` ; préfixe `+` sur l'écart positif dans `ComparisonSummary.tsx`.
- **Tests** : +27 tests (history/snapshots/comparison/scénario) → 65/65.

### Vérifications

- Gate complet : typecheck ✓ lint ✓ **65/65 tests** ✓ build ✓ (dist 872 kB / 261 kB gzip).
- Playwright : **28/28 PASS** (undo/redo boutons + raccourcis ⌘Z/⌘⇧Z, mode comparaison complet, écarts, snapshots créer/persister/charger/supprimer, zéro erreur console), rendu visuel validé par describe_image.
- Piège identifié : format monétaire fr-FR utilise l'espace fine insécable `\u202F` → normaliser dans les assertions (« 2 000 » ≠ `"2\u202F000"`).

### Notes

- Les 3 features et la refonte pédagogique (session parallèle) ont été committés ensemble : `faa5af79` v5.1.0.
- Vercel : projet `v4` (prj_J8bvSime5dm7oNJsUZBhjyTrBe8T), déploiement `v4-three-beige.vercel.app`.

---

## SESSION — 2026-07-31 (Restauration stats grid en haut)

### Résumé

La stats grid 4 cartes (présente dans le monolithe v4.1, supprimée par la migration v5) a été restaurée en haut de l'app.

### Modifications

- **`src/components/Simulation/SummaryStats.tsx` (nouveau)** — 4 cartes glass (grid-cols-2 lg:grid-cols-4) : Effort d'épargne, Gains générés, Net fiscal (`shortLabel` de l'enveloppe + sous-texte impôts ou "Aucune fiscalité"), Patrimoine final (sous-texte nominal/réel). Semantique identique à l'ancien App.tsx : `displayInvested = showReal ? investedReal : investedNom`, `displayInterests = max(0, final − investi)`, `taxAmount = max(0, nominal − taxNet)`. Format `fr-FR` entier + " €". Couleurs : `var(--color-*)` adaptatives light/dark.
- **`src/App.tsx`** — `<SummaryStats rows={rows} inputs={inputs} />` entre ActionBar et TabBar → visible sur les 4 onglets (placement d'origine).

### Vérifications

- Gate : typecheck ✓ lint ✓ 38 tests ✓ build ✓ (dist 839 kB / 252 kB gzip)
- Playwright : 4 cartes rendues (160 000 € / +362 980 € / 414 086 € / 522 980 € sur défauts), zéro débordement horizontal à 1440px et 320px. Rendu confirmé via describe_image.

---

## SESSION — 2026-07-31 (Responsive mobile)

### Résumé

Passage responsive mobile vérifié sur la nouvelle architecture composants (Tailwind).

### Important — contexte

- La **migration composants** (App.tsx refactorisé, `src/components/`) s'est faite **pendant** cette session, en parallèle de l'agent. Le commit `e35b4717` est la baseline avant migration ; le worktree contient la migration non commitée.
- L'architecture actuelle était déjà responsive (grid `grid-cols-1 lg:grid-cols-[380px_1fr]`, `min-w-0`). Corrections appliquées dessus.

### Corrections appliquées

- **TabBar** (`src/components/Layout/TabBar.tsx`) : `flex-wrap` + `min-w-[110px]` → 2×2 sur écrans étroits (320px), 4 colonnes sur desktop.
- **SmartInput** (`src/components/shared/SmartInput.tsx`) : `min-w-0` — les inputs faisaient 228px de large intrinsèque et débordaient le layout à 320px (onglet Objectif).
- **SliderInput** (`src/components/shared/SliderInput.tsx`) : `min-w-0` sur le wrapper label+input.
- **index.css** : `@media (max-width: 640px)` → font-size 16px sur `input[type="text"]`, `input[type="number"]`, `select` (évite le zoom automatique iOS au focus).
- **Graphiques** (`EquityChart`, `MonteCarloChart`, `DrawdownChart`) : `interval="preserveEnd"` + `minTickGap={28}` à la place des `interval` numériques → ticks d'axes jamais superposés sur mobile, desktop inchangé.

### Vérifications

- Playwright (headless) : 4 viewports (320/375/768/1440) × 4 onglets = **16/16 OK, zéro débordement horizontal**.
- `npm run typecheck` ✓, `npm run lint` ✓, `npm run test` (38/38) ✓, `npm run build` ✓ (835 kB, 251 kB gzippé).

### Notes

- Les edits de ma 1ʳᵉ passe (bloc `<style>` inline sur l'ancien App.tsx) ont été abandonnés au profit de la nouvelle architecture (Tailwind natif) — les corrections finales sont dans `src/components/`.
- `lang="fr"` déjà en place dans index.html.
- Le sidebar garde `overflow-y-auto` : son contenu scroll en interne si besoin.

---

## SESSION — 2026-06-28 (Audit + Corrections majeures)

### Résumé

Audit complet de Snowball Pro v5.0 avec correction de ~40 bugs, problèmes de performance, et dettes techniques.

### Corrections effectuées

#### 1. Build / Infrastructure

- **lucide-react** : mise à jour de ^1.16.0 vers 1.21.0 (package corrompu, fichiers manquants dans dist/)
- **.gitignore** : ajout de `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`
- **package.json** : renommé de `react-vite-tailwind` vers `snowball-pro`

#### 2. Store (Zustand) — Bugs critiques

- **Undo/Redo** : réécriture complète — utilise désormais `applyInputs()` avec `recordHistory: false` pour ne pas corrompre l'historique
- **Mode comparaison** : `toggleComparing()` utilise désormais `state.scenarios.B.inputs` au lieu de `state.scenarios.A.inputs` pour construire le scénario B
- **localStorage** : `saveToStorage()` sauvegarde désormais les deux scénarios (A et B) ; `loadFromStorage()` restaure les deux
- **buildScenario()** : utilise `sanitizeInputs()` en interne ; invalide les résultats MC/décumulation périmés quand les entrées changent
- **runMC()** : ajout d'un hash d'entrées pour éviter d'écrire des résultats périmés
- **Persistence des UI** : `toggleDarkMode()` sauvegarde désormais immédiatement

#### 3. Engine — Corrections

- **INFLATION_SERIES** : dédoublonné — défini une seule fois dans `historical.ts`, importé par `simulation.ts`
- **crisis amplitude** : `||` → `??` pour permettre amplitude=0
- **sanitizeInputs** : ajout de `peaYearsHeld` et `avYearsHeld` clampés
- **investedReal/interestsReal** : correction — n'étaient plus calculés (toujours 0)

#### 4. App.tsx — Corrections fonctionnelles

- **GoalProgress** : remplacement du target hardcodé (1 000 000) par `inputs.goalTarget`
- **FiscalPanel** : utilisation de `peaYearsHeld + projectionYear` / `avYearsHeld + projectionYear` pour matcher la simulation
- **FiscalPanel PFU** : masquage de la ligne PFU pour CTO (où PFU = PS + IR, doublon d'affichage)
- **Graphique comparaison** : format d'année cohérent (`"An 0"`, `"An 1"` au lieu de `0, 1, 2`)
- **Bouton Comparer** : texte distinct pour les états actif/inactif (`"Comparer"` / `"Quitter"`)
- **CSV export** : nom de fichier mis à jour (v4.1 → v5.0)

#### 5. Performance

- **useShallow** : sélecteurs Zustand individuels au lieu du store complet (évite les re-rendus inutiles)
- **useEffect darkMode** : dépendance corrigée sur la valeur `darkMode` au lieu du store
- **Fichiers morts supprimés** : `useSimulation.ts`, `useUndoRedo.ts`, `useValidation.ts`, `utils/pwa.ts`

#### 6. UX / Labels

- **Raccourcis clavier** : les champs input/textarea/select ne déclenchent plus les raccourcis globaux (Ctrl+Z natif restauré)
- **Traductions françaises** : Gold→Or, Flash Crash→Krach éclair, Bear Market→Marché baissier, Ultra-Safe→Très prudent, KPIs→Indicateurs, Drawdown Max→Repli Max, Best Case→Meilleur scénario, Worst Case→Pire scénario, AI Insights→Analyse, N/A→N/D, Seed→Graine

#### 7. Données historiques

- Dates de début par indice : Bitcoin (2011), Gold (2000) — suppression des années à rendement nul avant l'existence de l'actif

### Déploiement

- Build vérifié : typecheck, lint, test (25/25), build production (860kB, 258kB gzippé)

### Décisions clés

- App.tsx conserve ses composants inline (~1490 lignes) — les fichiers `src/components/` existent mais ne sont pas utilisés par l'application. Pas de migration vers les composants externes pour éviter une régression

### Tests

- 25 tests unitaires passent
- Commande : `npm run test`

### URLs

- Production : https://v4-three-beige.vercel.app

---

## Instructions pour les futures sessions

1. **Avant toute modification majeure** : lancer `npm run test && npx tsc --noEmit`
2. **Avant déploiement** : lancer `npm run build`
3. **Déploiement** : `vercel --prod` (depuis la racine du projet)
4. **Ajouter un test** pour toute nouvelle fonction dans `engine/`
5. **Ne jamais** remettre de logique métier dans `App.tsx` — utiliser les hooks
6. **Mettre à jour** ce fichier MEMORY.md à la fin de chaque session

---

## SESSION — 2026-07-31 (Migration v5 : App monolithe → coquille + composants)

### Résumé

Migration du monolithe App.tsx (1906 lignes, moteur inline, Chart.js) vers la pile v5 (engine 13 modules + 26 composants prop-based). Application des skills ultrathink + fable-mode + apex (-a -x -v) + oneshot, gate de vérification après chaque stage.

### Modifications

- **`src/engine/migration.ts` (nouveau)** — `DEFAULT_INPUTS`, `V4_SETTINGS_KEY`/`SETTINGS_KEY`, `v4SettingsToInputs`, `parseStoredInputs` + clamps
- **8 composants écrits** : EquityChart, MonteCarloChart, Sidebar, ActionBar, TabBar, SimulatorTab, MonteCarloPanel, GoalTab
- **`src/App.tsx` réécrit** — 1906 → ~170 lignes : state local, runSimulation mémoïsé, 4 onglets, export CSV
- **Suppressions (code mort)** : store.ts (Zustand), hooks/ (useStorage, useKeyboardShortcuts), components/ui/* (Radix, 9 fichiers), ComparisonBar, Card/StatCard/CurrencyValue, `index 2.css` (CSS legacy)
- **package.json** : 4.1.0 → 5.0.0 ; retirés chart.js + 5 deps @radix-ui
- **index.html** : titre « Snowball Pro v5 », fonts Inter/Outfit/JetBrains Mono
- **AGENTS.md / CHANGELOG.md** : mis à jour (architecture réelle, 38 tests)
- **Vérification graphe d'imports** : 47/47 fichiers atteignables, 0 mort

### Décisions

- Résultats numériques légèrement différents du moteur legacy (modèle fiscal v5 plus précis) — assumé
- Krach legacy → `crisisEnabled=false` par défaut (toggle non persisté en v4)
- Clé localStorage v4 conservée en lecture seule (rétrocompatibilité), écriture sur `snowball_v5_settings`
- `@/utils/cn` : alias non vérifié → imports relatifs dans les nouveaux composants
- Dark mode : prop `darkMode` (pas de toggle classe)

### État

- Gate final : typecheck ✓ lint ✓ 38 tests ✓ build ✓ (dist/index.html 835 kB / 251 kB gzip)
- Version 5.0.0 prête, build singlefile OK

### Commandes

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```
