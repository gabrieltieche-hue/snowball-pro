# MÉMOIRE — Snowball Pro v5.0

> Fichier de mémoire persistante : capture chaque session et décision pour garantir une continuité parfaite.

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
