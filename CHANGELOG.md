# CHANGELOG — Snowball Pro v5.1

> Simulation patrimoniale haut de gamme

---

## v5.2.3 — Audit profond v3 : la Rente applique enfin le krach + unités verrouillées partout

Audit moteur et UI en profondeur (lecture des 13 modules engine + composants, croisement des unités, revue adverse) : 1 bug moteur qui faussait la Rente, 1 KPI déconnecté de la simulation, et 3 écrans qui mélangeaient encore les unités.

### ⚙️ Moteur

- **C1 — La Rente ignorait le krach** : `decumulation.ts` n'appliquait que le `volMultiplier` de la crise — la bourse « tremblait » mais ne s'effondrait jamais (incohérent avec le Simulateur et Monte Carlo). Le `returnShock` est désormais appliqué mois par mois (neutralisé en mode historique, règle identique à `runSimulation`).
- **C2 — KPI « Après inflation » déconnecté de la simulation** : `realReturn` utilisait `(1+annualReturn)/(1+inflation)−1` (les inputs), faux dès que le mode était historique ou aléatoire. Il est maintenant calculé sur le **XIRR réellement simulé** déflaté par l'inflation RÉELLEMENT appliquée (dérivée du rapport nominal/réel cumulé de la projection).
- **C3 — Camembert ≠ carte** : `CapitalAllocation` affichait `totalTax` (dividendes inclus) quand les cartes et le graphique affichent l'**exit tax** (nominal − taxNet). Aligné sur la même base.

### 📏 Unités

- **`FiscalPanel`** : « Total des impôts » = exit tax (social + IR) — plus de double comptage des dividendes déjà prélevés chaque mois ; nouvelle ligne « Impôts sur dividendes (déjà prélevés) » ; taux effectif recalculé sur la base affichée.
- **`CashflowCalendar`** : colonne « Impôts » alignée sur l'exit tax (comme les cartes) et respect de `showReal` (déflation par année).
- **`FeeImpact`** : les frais affichés suivent `showReal` (déflatés en euros d'aujourd'hui).
- **`AIInsightCard`** : montant des gains déflaté quand `showReal` (et suppression d'une branche logiquement morte détectée en revue).

### Tests

- **+5 tests de non-régression** (krach sur la Rente, realReturn simulé, identité brut − impôts = net, interestsReal, déflation FeeImpact). **153 tests au total.**
- Revue adverse (code-reviewer) : 2 points intégrés (branche morte AIInsightCard, colonne Impôts du calendrier) + test tautologique nettoyé.

---

## v5.2.2 — Audit moteur v2 : 10 bugs corrigés, Rente asynchrone, a11y des graphiques

Deuxième passe d'audit en profondeur (test moteur + runtime Playwright + revue adverse) : corrections moteur, performance, accessibilité — et un fix bloquant de chaîne de build.

### 🚨 Critique — typecheck cassé (lucide-react)

- `lucide-react@^1.25.0` montait vers 1.28.0 qui **ne fournit plus `dist/lucide-react.d.ts`** → 20 erreurs TS7016, CI rouge. **Épinglé à `1.25.0` exact** (vérifié : types présents dans le tarball). `package.json` + `package-lock.json`.

### ⚙️ Moteur

- **B1 — Monte Carlo lent (130 s à 10k runs)** : `toLocaleDateString("fr-FR")` appelé dans la boucle chaude (`simulation.ts`) → **mémoïsé** via un cache module-level clé `(startYear, month)` (10 000×26 appels réduits à ~26).
- **B2 — Gel main-thread de la Rente (5,4 s à 10k)** : `decumulation.ts` réécrit — cœur partagé `runDecumulationRange` + **`runDecumulationAsync` chunké (150) avec `AbortController`** et `onProgress`, résultats bit-à-bit identiques au synchrone. `App.tsx` câblé en async avec garde anti-race ; `RenteRetraiteTab` : bouton « Calcul… X% » + barre de progression.
- **B3 — Crise doublée en mode historique** : `runSimulation` n'applique plus le choc synthétique quand `returnMode === "historical"` (les krachs réels sont déjà rejoués). UI alignée : Sidebar, recap Monte-Carlo, AIInsightCard, composante inflation stagflation neutralisée. Vérifié runtime : capital final inchangé à l'activation.
- **B4 — XIRR dégénéré (4 700 %/an)** : garde `finalValue <= 0 → 0` dans `computeXIRR`.
- **B5 — Onglet Objectif contradictoire** : `totalGains` clampé à 0 (plus de -400 k€) ; `achievable` cohérent avec `difficulty` (un objectif « impossible » n'est plus « atteignable »).
- **B6 — Retraits fantômes** : on ne retient que `min(retrait, capital disponible)` — la courbe de retraits ne grimpe plus après l'épuisement (+ retrait partiel exact au mois de ruine).
- **B7 — Rendement < -100 %** : `yearlyReturn`/`netYield` bornés à -1 (ratio).
- **B8 — Cache MC incomplet** : `inflationMode` ajouté à `inputsHash` → l'avertissement « relancez » se déclenche à la bascule custom/historique/cyclique.
- **B9 — Conventions drawdownPct** : signe/unité documentés dans `types.ts`.

### ♿ Accessibilité

- **`useChartA11y` corrigé** : Recharts ré-applique `role="application"` à chaque re-render après le montage — un simple `useEffect` ne tenait pas. Le hook utilise désormais un **`MutationObserver`** (converge, `aria-label` stable, observer nettoyé au démontage). Vérifié runtime : `role=img` stable au chargement ET après re-render.

### Tests

- **+9 tests de non-régression** (B2–B7 : async chunké + abort, crise historique, XIRR, solveGoal, retraits, clamps). **148 tests au total** (engine node + composants jsdom).
- Vérification runtime Playwright : **16/16 checks** (Rente historique, partage URL roundtrip, raccourcis ⌘Z/⌘⇧Z, stale warning, exports, snapshots 2-clics, dark mode, reduced-motion, console propre).

---

## v5.2.1 — Exports groupés + échelle « euros d'aujourd'hui » cohérente partout

Audit utilisateur : les 4 écrans qui affichaient des montants ne racontaient pas la même histoire selon le toggle « euros d'aujourd'hui ». Aucun changement de logique moteur — uniquement la couche d'affichage.

### 🗂 Exports regroupés dans un menu

- **Un seul bouton « Exporter »** (doré, avec chevron) remplace les trois boutons CSV / JSON / PDF de l'ActionBar. Au clic, un popup propose **Export CSV**, **Export JSON** et **Rapport PDF** (icône + description). Fermeture au clic extérieur ou à Échap ; `role=menu`/`menuitem` + `aria-expanded` (accessibilité). Nouveau composant `src/components/Layout/ExportMenu.tsx`.

### 📏 Échelle « euros d'aujourd'hui » cohérente sur tous les écrans

Le toggle `showReal` (euros d'aujourd'hui vs euros courants) était appliqué de façon inégale : la carte « Valeur brute » basculait, mais « Net fiscal » restait en euros courants → net (1 176 k€) affiché PLUS ÉLEVÉ que le brut (862 k€), absurde. Même incohérence entre la carte « Impôts » (176 k€) et le tooltip du graphique (303 k€).

- **`SummaryStats`** : libellé « Valeur brute » → **« Valeur réelle »** quand l'affichage est en euros d'aujourd'hui (plus de contradiction brut/inflation). Toutes les cartes suivent désormais la même échelle (`Net fiscal`, nouvelle carte **« Impôts »** qui remplace « Pouvoir d'achat » — doublon du Net fiscal dès que showReal est actif). Sous-texte « Impôts estimés (règles en vigueur) : -x € » supprimé (hérité du millésime fiscal retiré en v5.1.3).
- **`FiscalPanel`** : déflate ses montants quand showReal est actif (badge « € d'aujourd'hui ») et ajoute la ligne de synthèse **« Capital net (impôts déduits) »** — exactement la valeur de la carte « Net fiscal » : le panneau et les cartes racontent la même histoire. Paragraphe « règles fiscales en vigueur » simplifié.
- **`EquityChart`** : la courbe/tooltip « Impôts payés » est déflatée comme l'épargne et les gains (`buildEquitySeries`, fonction pure). Plus de tooltip à 303 458 € à côté d'une carte à 176 778 €.
- **`CapitalAllocation`** (camembert « D'où vient votre argent ? ») : la légende déflate aussi quand showReal est actif (prop `showReal`).
- **Helper partagé `deflationFactor(row)`** dans `engine/math.ts` : une seule source de vérité pour convertir euros courants → euros d'aujourd'hui (avant : facteur recalculé à l'identique dans 4 composants, source de dérive).

### Tests

- `buildEquitySeries` : 3 tests (déflation des impôts en showReal, euros courants sinon, zéro sans enveloppe fiscale).
- Menu Export : 2 tests composants (popup CSV/JSON/PDF, fermeture au clic extérieur).
- 148 tests au total (engine node + composants jsdom).

---

## v5.2.0 — Audit UI/UX : contraste WCAG AA, accessibilité, lisibilité, mobile

Correction intégrale du rapport d'audit UI/UX (2 critiques, 8 importants, 10 moyens) — aucun changement de logique moteur, uniquement la couche visuelle et l'accessibilité.

### 🟥 Critiques

- **C1 — Contraste or/sombre (WCAG AA)** : le texte blanc sur l'or `#d4af37` ne faisait que **2.1:1** en mode sombre. Nouvelle classe `.btn-gold-text` (texte sombre sur or en sombre → 8.6:1, blanc en clair) appliquée à « Rapport PDF », onglet actif, « Comparer » actif, « Lancer » (Monte Carlo & Rente), « Recharger ». Rail de toggle `.toggle-on` assombri (`#8a6d1f`) pour le point blanc (3:1 non-textuel).
- **C2 — Champs numériques sans nom accessible** : `SliderInput` — le `<input type=range>` porte désormais `id` (le `label htmlFor` fonctionne, le clic focus le slider) et la saisie directe `SmartInput` reçoit un `aria-label` (les 6 textboxes sont maintenant nommées).

### 🟧 Importants

- **I1 — Sidebar sticky supprimée** : haute de 2 225 px dépliée, elle épinglait ses sections basses (Frais, Snapshots) sous le pli pendant tout le scroll — elle suit désormais le document.
- **I2 — Crise au-delà de la durée** : `validateInputs` signale un warning `crisisYear > duration` (« elle ne sera pas appliquée »), le curseur « Année de la chute » est borné à la durée, et l'encart sidebar n'annonce plus un krach non simulé.
- **I3 — Contraste `text-dim`** : `#7a7265` → `#a39a8c` (sombre, 4.0→6.8:1) et `#8a847a` → `#6f6a5f` (clair, 3.3→4.9:1). Ticks Recharts alignés.
- **I4 — Tailles de police** : tous les textes à 8/9 px passent à 10 px (badges fiscal, en-têtes de table, chips), labels de sliders à 11 px, ticks de graphiques à 11 px — plus aucun élément à 8/9 px.
- **I5 — « Rapport PDF » en mode sombre** : le CSS `@media print` force désormais ticks/grille/courbes Recharts en encres sombres sur papier blanc.
- **I6 — Hiérarchie de titres** : `h1` sr-only en tête de page + graphiques principaux en `h2` (Projection, Baisses, Répartition, Comparaison).
- **I7 — Focus visible** : outline `#60a5fa` (clair) / `#1e40af` (sombre) — plus jamais or-sur-or invisible ; anneau de focus bleu sur les sliders (`:focus-visible`).
- **I8 — Surcharge de l'onglet Simulateur** : la table « Détail année par année » (26 lignes) est repliée par défaut.

### 🟨 Moyens

- **M1** — Tooltips tactiles : sur pointeur coarse (mobile), les tooltips Recharts passent en déclenchement au clic (`useIsCoarsePointer`).
- **M2** — Suppression de snapshot en deux temps : 1ᵉʳ clic arme la confirmation (3,5 s), le 2ᵉ supprime — plus de destruction par un simple tap.
- **M3** — `aria-label` sur la saisie du montant fixe de la Rente.
- **M4** — `prefers-reduced-motion` : coupe animations CSS + `<MotionConfig reducedMotion="user">` (framer-motion) dans `main.tsx`.
- **M5** — `title` sur les valeurs tronquées de `SummaryStats` (montant toujours lisible en survol).
- **M6** — ActionBar : retour à la ligne gauche-alignée sur mobile (`max-sm:justify-start`), espacement resserré.
- **M7** — Recharts `role="application"` remplacé par `role="img"` + `aria-label` non focusable (`useChartA11y`) — tabulation clavier nettoyée.
- **M8** — `backdrop-filter` 28/32 px → 16/20 px + fallback `@supports` (moins de jank au scroll).
- **M9** — Animations Recharts désactivées sur les graphes en direct (Épargne, Baisses) : plus de lag pendant le drag des sliders.
- **M10** — Bordures du mode clair renforcées (0.06 → 0.12/0.14/0.16) — fini le rendu délavé.

### Bruit

- Bornes min/max affichées sous chaque slider (cohérence avec l'onglet Rente).
- `SegmentedControl` : roving tabindex + flèches ←/→/Home/End (pattern radiogroup ARIA).
- Meta description + `theme-color` (clair/sombre) dans `index.html`.

### Divers

- Tests : +1 test moteur (crise > durée), test snapshot adapté à la confirmation 2 temps. Version 5.1.3 → 5.2.0 (package.json, sw.js `CACHE_VERSION`).

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
