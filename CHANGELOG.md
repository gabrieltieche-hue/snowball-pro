# CHANGELOG — Snowball Pro v5.0

> Simulation patrimoniale haut de gamme

---

## Architecture & Stack Technique

- **Framework :** React 19.2 avec StrictMode + TypeScript 5.9 (strict)
- **Bundler :** Vite 7.2 + plugin `vite-plugin-singlefile` (tout inline dans un unique `index.html`)
- **CSS :** Tailwind CSS v4.1 via `@tailwindcss/vite` + CSS personnalisé avec variables CSS (thème dark/light)
- **State :** Zustand 5 (store unique, selecteurs `useShallow` pour optimisation)
- **Animations :** Framer Motion 12.38
- **Graphiques :** Recharts 3.8
- **Icônes :** Lucide React
- **Utilitaires :** `clsx` + `tailwind-merge` (`cn`), `class-variance-authority`

---

## Modules / Fichiers Sources

### `src/types.ts` — Modèle de données complet

### `src/engine/` — Moteur de calcul patrimonial modulaire (12 modules)

- `math.ts` — FV, PMT, percentiles, drawdown, average, stddev
- `taxes.ts` — fiscalité française (CTO, PEA, AV, PER)
- `formatting.ts` — formateurs monétaires (€, M€, Md€)
- `rng.ts` — générateur aléatoire (mulberry32, Box-Muller)
- `historical.ts` — données historiques par indice (1995-2025)
- `crisis.ts` — profils de crise financière
- `simulation.ts` — moteur de projection année par année
- `montecarlo.ts` — simulations stochastiques
- `decumulation.ts` — phase de décaissement
- `kpis.ts` — indicateurs de performance
- `validation.ts` — validation et sanitisation des entrées
- `index.ts` — point d'entrée unique ré-exportant tout

### `src/store.ts` — Store Zustand centralisé

- Scénarios A/B avec comparaison
- Undo/Redo (20 niveaux)
- Persistance localStorage (clé : `snowball_pro_v41_state`)
- Snapshots utilisateur (jusqu'à 8)
- Mode dark/light

### `src/App.tsx` — Composant principal (~1490 lignes, contient les composants inline)

### `src/hooks/` — Hooks React

- `useKeyboardShortcuts.ts` — Raccourcis clavier (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+D)
- `useStorage.ts` — Chargement localStorage au montage

### `src/utils/` — Utilitaires

- `cn.ts` — Fusion de classes Tailwind (clsx + tailwind-merge)

---

## Commandes

```bash
npm run dev         # Serveur de développement Vite
npm run build       # Build production (singlefile → dist/index.html)
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run test        # Vitest (25 tests)
npm run format      # Prettier
```
