# MÉMOIRE — Snowball Pro v5.0

> Fichier de mémoire persistante : captures chaque session et décision pour garantir une continuité parfaite.

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
