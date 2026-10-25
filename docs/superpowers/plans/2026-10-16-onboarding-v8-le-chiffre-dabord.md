# Onboarding v8 « Le chiffre d'abord » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (mode inline APEX `-axv` : étapes + auto-revue adverse + vérification). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte complète de l'onboarding : le vrai nouveau visiteur voit son chiffre projeté **en direct pendant qu'il répond** (moteur réel, courbe réelle), puis un moment « Révélation » plein écran met en scène le résultat, suivi d'une visite guidée de l'app sur **ses** chiffres. Le tutoriel passif 5 écrans disparaît.

**Architecture:** Le wizard devient le produit (aperçu vivant par réponse via `runSimulation(previewInputsFromAnswers(...))`), l'étape finale « Révélation » est un composant dédié (`Reveal.tsx`), la visite guidée est un overlay 3 bulles (`SpotlightTour.tsx`) ciblant des `data-tour` posés sur l'UI réelle. Gating inchangé (`utils/onboarding.ts`, clé `snowball_v5_tutorial_done` conservée — les utilisateurs existants ne revoient rien).

**Tech Stack:** React 19, TypeScript strict, Tailwind 4, framer-motion, lucide-react. Chaîne de vérif : `typecheck → lint → test → build` (+ `node scripts/i18n-check.mjs`, prettier).

**Spec:** discussion du 2026-10-16 — refonte complète validée par l'utilisateur (« Recommandé » ×3 : parcours obligatoire mais agréable, visite guidée 3 bulles incluse). Ce document est la source d'exécution.

## Suivi d'exécution (reprise après compaction — TENIR À JOUR)

**État :** Task 1 en cours (tests moteur v8 à écrire, rouge → vert). Task 0 faite.
**Répertoire :** `/root/snowball-pro` — **npm** (PAS pnpm ici). Gate : `bash /root/.agents/skills/process/scripts/verify.sh --project /root/snowball-pro` (typecheck→lint→test→build) ; baseline verte confirmée le 2026-10-16 (`--fast` exit 0).
**Skills :** process + apex (inline `-axv`), onboarding (CRO), brainstorming+ultrathink (design validé), ui-ux (frontend-design + impeccable chargés ; ui-ux-pro-max/design-system/ui-styling/design/brand/… écartés — direction artistique déjà établie par la marque or/ivoire, décision assumée) ; Task 10 : visual-verify + webapp-testing.
**Contraintes locales à ne pas oublier :**
- Mock de test `framer-motion` : n'expose QUE `motion` et `AnimatePresence` → ne rien importer d'autre de framer-motion dans les composants.
- Reduced motion : `window.matchMedia("(prefers-reduced-motion: reduce)")` (pattern maison LandingPage) ; jsdom sans rAF → saut direct à la cible.
- `useCountUp` + `usePrefersReducedMotion` existent dans `LandingPage.tsx` (~l. 49-93) → extraire vers `src/hooks/useCountUp.ts` (Task 2), LandingPage les importera.
- jsdom : `getBoundingClientRect()` = zéros partout → `SpotlightTour` doit avoir un fallback sans cible.
- Z : overlays onboarding `z-[70]`, tour `z-[75]`. Libellés à conserver : « Suivant », « Retour », « Voir mon résultat », « Fermer le questionnaire », « Nouvelle simulation ».
- Clé onboarding conservée : `snowball_v5_tutorial_done` ; tests `beforeEach` posent cette clé + `snowball_v62_sidebar_collapsed=0` (les tests first-run la retirent).
- **Chantiers d'autres threads — NE PAS toucher/modifier/formatter/stager :** `package.json` + `package-lock.json` (bump capacitor ^8.5.3 non commité), `MEMORY.md` (modifs non commitées) ; untracked : `.agents/`, `skills-lock.json`, `scripts/render-mp4*.py`, `scripts/__pycache__/`, `public/notion-snowball.html`, `public/video-snowball.html`, `public/snowball-pro-75s.mp4`, `BACKUP-*.tgz`.
- Ancre de code : `App.tsx` (showTutorial/showWizard ~l.140-146 ; finishTutorial/openNewSimulation/handleWizardComplete ~l.355-411 ; rendu overlays ~l.840-851). Tests : `components.test.tsx` describe v7 ~l.1520 ; `engine.test.ts` describe v7 ~l.2442.
**Checklist de progression** (mirror des Tasks, cocher ici) :
- [x] T0 baseline verte (`verify.sh --fast` exit 0)
- [x] T1 moteur : `WIZARD_DEFAULT_ANSWERS` + `previewInputsFromAnswers` codés + tests v8 écrits — vert à confirmer
- [x] T2 hook partagé `src/hooks/useCountUp.ts` (LandingPage l'importe ; l'animation part désormais de la valeur affichée)
- [x] T3 `LivePreview` (compteur + sparkline + rôle status sr-only) codé
- [x] T4 wizard refondu (aperçu vivant, `CustomAmountInput` module-level + brouillon par étape, focus titres, Échap conditionnel, trap focus, mot d'accueil first-run) codé
- [x] T5 `Reveal` codé (compteur de cérémonie 1,6 s, barre épargne/croissance, note d'honnêteté, « Modifier mes réponses »)
- [x] T6 `SpotlightTour` + `data-tour` (hero/tabs/settings) + câblage App (`firstRun`/`showTour`/`handleWizardComplete`) + utils renommés (`loadOnboardingVisible`/`saveOnboardingDone`) codés
- [x] T7 Tutorial.tsx déplacé vers `/tmp/opencode/trash/Tutorial.v7.tsx` ; 17 clés EN v8 ajoutées — i18n-check à lancer
- [ ] T8 gate complet + prettier + git status propre — EN COURS : typecheck puis `vitest run engine.test.ts components.test.tsx`
- [ ] T9 auto-revue adverse (sous-agent à froid) + fixes
- [ ] T10 vérif navigateur (1440/390/320, reduced-motion) + VERDICT VISUEL
- [ ] T11 MEMORY.md (+ release sur GO utilisateur UNIQUEMENT : bump 6.23.0, CHANGELOG, changelog.html, sw.js, commit chirurgical, vercel --prod)

## Design figé (UX)

### Parcours vrai nouveau visiteur (dès le montage, aucun écran intermédiaire)
1. **Le questionnaire s'ouvre directement** (plus de tutoriel 5 écrans). En-tête de bienvenue intégré au 1er écran (« Bienvenue — créons votre première simulation. Chaque réponse met à jour votre projection. »). **Pas de croix, pas d'Échap** (obligatoire mais agréable — décision v6.16 conservée).
2. **Carte « projection en direct »** dans l'écran du questionnaire (en haut de la carte glass) :
   - chiffre principal (capital nominal, « sur le compte en {année} ») en compteur animé, secondaire « en euros d'aujourd'hui » ;
   - **mini-courbe réelle** (SVG ~120×40, tracé or + aire) redessinée à chaque réponse, krachs historiques visibles ;
   - note honnête courte (« Rendements réels 1926-2025, krachs inclus — une estimation, pas une promesse »).
   - Valeur finale dupliquée en `sr-only` + `aria-live="polite"` (a11y + déterminisme des tests).
3. **Mêmes questions qu'aujourd'hui** (contenu validé v6.16 conservé) : âge → capital o/n → montant → mensuel → projet → durée → enveloppe → âge retraite (conditionnel) → risque → récap + nom. Réponses vierges à chaque ouverture.
4. **« Voir mon résultat » → étape Révélation** (plein écran, mise en scène) : eyebrow (« Votre première simulation » / « Votre simulation est prête »), nom choisi, count-up grand format vers le chiffre final, les deux échelles, barre de décomposition « dont X épargnés + Y de croissance », **courbe qui se dessine** (pathLength ~1,4 s, krachs visibles), note d'honnêteté (rendements réels, pas un conseil — cohérente avec `DisclaimerBar`).
   - CTA primaire « Ouvrir ma simulation » (applique inputs + snapshot nommé, ferme) ; secondaire « Modifier mes réponses » (revient au questionnaire, **réponses conservées**).
5. **Visite guidée** (premier run uniquement, après « Ouvrir ma simulation ») : 3 bulles sur l'UI réelle —
   1. `data-tour="hero"` : « Votre chiffre — il se recalcule à chaque réglage. »
   2. `data-tour="tabs"` : « Robustesse : et si les krachs tombaient au mauvais moment ? Rente : vivre de son épargne. Objectif : combien investir. »
   3. `data-tour="settings"` : « Épargne, frais, fiscalité : tout est réglable ici — vos données restent sur votre appareil. »
   - « Passer » (ferme tout) + « Suivant »/« Terminé » ; pastille 1/3 ; Échap = passer ; focus sur la bulle ; **si la cible est absente/invisible (ex. rail réglages masqué en mobile)** → bulle centrée sans découpe, l'étape reste utile.
   - Sauté au reload : pas de clé dédiée (la visite vit dans la session du premier run — YAGNI).

### Visiteur connu (« Nouvelle simulation »)
Même wizard et même révélation (le résultat mérite sa mise en scène) ; croix de fermeture + Échap actifs ; pas de visite guidée. Le dialogue « Sauvegarder avant de créer » (dirty) est inchangé.

## Global Constraints

- 100 % local (aucune donnée ne sort), français par défaut, i18n FR→EN : toute chaîne affichée via `tr()` DOIT avoir son entrée EN dans `src/engine/i18n.ts` (`i18n-check` à 0).
- **Zéro changement au moteur de calcul** : seules ajouts dans `engine/onboarding.ts` (fonctions pures + tests node).
- Ne pas toucher aux chantiers non commités d'autres threads (`package.json`/lock modifs capacitor, `MEMORY.md` modifs, fichiers non commités `src/`) — en particulier **ne jamais stager** ces modifications lors d'un éventuel commit.
- Ordre gate : `typecheck → lint → test → build` (npm) ; + `node scripts/i18n-check.mjs` ; + prettier sur les fichiers touchés.
- Mobile d'abord : 320 / 390 px sans overflow ; `prefers-reduced-motion` respecté (pattern maison `window.matchMedia`, PAS d'import `useReducedMotion` de framer-motion — le mock de test ne l'expose pas).
- Le mock framer-motion des tests rend de vraies balises : toute nouvelle animation doit se dégrader proprement en jsdom.
- Z-index : overlays onboarding `z-[70]` (existant), visite `z-[75]`.
- Pas de nouvelle dépendance npm.

## File Structure

- **Modifier** `src/engine/onboarding.ts` — `WIZARD_DEFAULT_ANSWERS` (défauts uniques : âge 30, sans capital, 250 €/mois, aucune, 25 ans, auto, équilibre), `previewInputsFromAnswers(partial)` ; `buildSimulationFromAnswers` réutilise les mêmes défauts (source unique — pas de saut de chiffre entre aperçu et résultat).
- **Créer** `src/hooks/useCountUp.ts` — extraction de `usePrefersReducedMotion` + `useCountUp` depuis `LandingPage.tsx` (réutilisé landing + onboarding ; comportement identique, rAF absent → saut direct à la cible).
- **Créer** `src/components/Onboarding/LivePreview.tsx` — carte projection en direct (compteur + sparkline + note).
- **Créer** `src/components/Onboarding/Reveal.tsx` — moment de révélation (count-up, décomposition, courbe animée, CTAs).
- **Créer** `src/components/Onboarding/SpotlightTour.tsx` — visite guidée 3 bulles.
- **Refonte** `src/components/Onboarding/SimulationWizard.tsx` — aperçu vivant, étape reveal, corrections (voir Task 4).
- **Supprimer** `src/components/Onboarding/Tutorial.tsx`.
- **Modifier** `src/App.tsx` — first-run → wizard direct (flag `firstRun` figé au montage), tour après complétion si first-run, suppression du tutoriel.
- **Modifier** `src/utils/onboarding.ts` — `loadOnboardingVisible` (même logique, même clé), `saveOnboardingDone`.
- **Modifier** `src/components/Layout/TabBar.tsx` (`data-tour="tabs"`), `src/components/Tabs/SimulatorTab.tsx` (`data-tour="hero"` autour de `HeroResult`), `src/components/Layout/Sidebar.tsx` (`data-tour="settings"` sur l'`aside`).
- **Modifier** `src/engine/i18n.ts` — toutes les chaînes EN nouvelles.
- **Modifier** `src/components/Landing/LandingPage.tsx` — importe le hook extrait (déduplication, rendu inchangé).
- **Modifier** `src/__tests__/engine.test.ts`, `src/__tests__/components.test.tsx` — TDD onboarding.

## Task 1 — Moteur pur : défauts + aperçu (TDD)

**Files:** Modify `src/engine/onboarding.ts` · Test `src/__tests__/engine.test.ts`

- [ ] **Step 1: tests rouges** — `WIZARD_DEFAULT_ANSWERS` : âge 30, `hasCapital: false`, capital 0, mensuel 250, projet `null`, durée 25, enveloppe `auto`, retraite `null`, risque `equilibre` ; `previewInputsFromAnswers({})` ≡ `buildSimulationFromAnswers(WIZARD_DEFAULT_ANSWERS)` ; réponses partielles (ex. `{ monthly: 1000 }`) → seuls les champs mappés changent, le reste = défauts ; `previewInputsFromAnswers(WIZARD_DEFAULT_ANSWERS)` ≡ `buildSimulationFromAnswers(WIZARD_DEFAULT_ANSWERS)` (aucun saut aperçu → résultat) ; `hasCapital: false` + `capital: 5000` → capitalInitial 0.
- [ ] **Step 2:** `npx vitest run src/__tests__/engine.test.ts -t onboarding` → FAIL.
- [ ] **Step 3:** implémenter (`previewInputsFromAnswers = (p) => buildSimulationFromAnswers({ ...WIZARD_DEFAULT_ANSWERS, ...p })` avec le mapping capital conditionnel déjà en place).
- [ ] **Step 4:** verts + barrel vérifié (`engine/index.ts` exporte déjà `* from "./onboarding"`).

## Task 2 — Hook partagé `useCountUp`

**Files:** Create `src/hooks/useCountUp.ts` · Modify `src/components/Landing/LandingPage.tsx`

- [ ] **Step 1:** déplacer `usePrefersReducedMotion` + `useCountUp` (verbatim, commentaires compris) vers `src/hooks/useCountUp.ts` (exports nommés).
- [ ] **Step 2:** LandingPage les importe (supprimer les définitions locales ; `AnimatedAmount`/`CountUpStat` inchangés).
- [ ] **Step 3:** `npm run test` (les tests landing existants restent verts — zéro changement de comportement).

## Task 3 — `LivePreview` (compteur + sparkline)

**Files:** Create `src/components/Onboarding/LivePreview.tsx`

- [ ] **Step 1:** composant présentation : props `{ rows: YearRow[], inputs: SimulationInputs, compact?: boolean }` ; chiffre principal = même choix que `HeroResult` (`showReal ? real : nominal`), année de fin depuis `lastRow.date` ; secondaire = l'autre échelle ; `useCountUp` sur une valeur stable (pas de redémarrage à 0 entre deux réponses **du même run** : animer depuis la valeur précédente — compteur « delta » maison réutilisant `useCountUp` sur la nouvelle cible avec départ doux).
- [ ] **Step 2:** sparkline SVG : `rows.map(r => r.nominal)` normalisé, tracé `pathLength` animé (key = durée/params clés), aire dégradée or, point final ; `aria-hidden` décoratif.
- [ ] **Step 3:** note honnêteté + `sr-only aria-live="polite"` avec la valeur finale formatée (déterminisme des tests).
- [ ] **Step 4:** i18n des libellés (clés FR → EN).

## Task 4 — Refonte du wizard (aperçu vivant + corrections)

**Files:** Modify `src/components/Onboarding/SimulationWizard.tsx`

- [ ] **Step 1: tests rouges (components.test.tsx)** — vrai nouveau visiteur : le wizard s'ouvre directement (plus de tutoriel), **sans** bouton fermer ; la carte « projection en direct » affiche un montant ; répondre (ex. mensuel 1 000 €) **change le montant** (valeur sr-only comparée à celle calculée par le moteur) ; parcours complet → étape Révélation ; « Modifier mes réponses » revient au questionnaire avec réponses conservées ; « Ouvrir ma simulation » ferme tout et applique (assertions v7 existantes conservées : sliders, snapshot, onglet bibliothèque) ; visiteur connu : croix présente, Échap ferme, pas de tour.
- [ ] **Step 2:** intégrer `LivePreview` dans la carte (défauts via `WIZARD_DEFAULT_ANSWERS`), calcul `rows` local `useMemo(runSimulation(previewInputsFromAnswers(answers)))`.
- [ ] **Step 3: corrections** — `CustomAmountInput` sorti du corps du composant (module-level, props `initial`, `onCommit`) → **focus stable** ; `customAmount` remis à zéro à chaque changement d'étape (`customStep=null`) ; focus auto sur le titre de l'étape au changement (h2 `tabIndex={-1}` + ref) ; Échap câblé seulement si annulable (`firstRun=false`) ; piège de focus léger (Tab cycle) ; en-tête de bienvenue si `firstRun`.
- [ ] **Step 4:** étape « reveal » : `step === "reveal"` rend `<Reveal …/>` (nom, answers complètes, `onOpen`, `onBack`) ; « Voir mon résultat » n'appelle plus `onComplete` directement.
- [ ] **Step 5:** barre de progression + libellés conservés (« Question {current} sur {total} », « Retour », « Suivant », « Voir mon résultat », « Fermer le questionnaire » — libellés stables pour limiter le churn des tests).

## Task 5 — `Reveal` (le moment)

**Files:** Create `src/components/Onboarding/Reveal.tsx`

- [ ] **Step 1: tests rouges** — l'étape affiche l'eyebrow, le nom, le chiffre final (sr-only déterministe), la ligne décomposition, 2 CTA ; « Modifier mes réponses » notifie le parent ; « Ouvrir ma simulation » notifie le parent.
- [ ] **Step 2:** implémenter : count-up (durée ~1,6 s), halo doré, barre épargné/croissance (calculs locaux depuis `lastRow`), courbe `pathLength` (réutilise le pattern `CrashChart`), stagger framer-motion via `motion.div variants`, reduced-motion → tout statique.
- [ ] **Step 3:** i18n.

## Task 6 — `SpotlightTour` + cibles `data-tour` + câblage App

**Files:** Create `src/components/Onboarding/SpotlightTour.tsx` · Modify `TabBar.tsx`, `SimulatorTab.tsx`, `Sidebar.tsx`, `App.tsx`, `utils/onboarding.ts`

- [ ] **Step 1: tests rouges** — après complétion du premier run : les 3 bulles s'enchaînent (Suivant → 2/3 → 3/3 → Terminé), « Passer » à n'importe quelle étape ferme ; rôle dialog + label ; visiteur connu : jamais de bulles.
- [ ] **Step 2:** implémenter : mesure `getBoundingClientRect` du `[data-tour]`, découpe par `box-shadow: 0 0 0 9999px` sur un rect absolu, bulle positionnée dessous/dessus (flip), scroll `slideIntoView({block:"center"})` avant mesure, cible absente → bulle centrée ; mobile : carte en bas ; boutons « Passer / Suivant / Terminé », pastille 1/3 ; Échap = passer ; focus bulle au changement.
- [ ] **Step 3:** poser les attributs `data-tour` (hero, tabs, settings) — modifier le moins possible : wrapper dans `SimulatorTab` autour de `HeroResult`, racine `TabBar`, `aside` Sidebar.
- [ ] **Step 4:** `App.tsx` : `firstRun` figé au montage (`loadOnboardingVisible`), `showWizard` initialisé à `firstRun` ; `handleWizardComplete` → `saveOnboardingDone()` + tour si firstRun ; supprimer état/compétence tutoriel.
- [ ] **Step 5:** `utils/onboarding.ts` : renommer `loadTutorialVisible`→`loadOnboardingVisible`, `saveTutorialDone`→`saveOnboardingDone` (même clé `snowball_v5_tutorial_done`, commentaires mis à jour).

## Task 7 — Retrait du tutoriel + i18n complet

- [ ] **Step 1:** supprimer `src/components/Onboarding/Tutorial.tsx` + imports/états ; nettoyer les entrées EN du tutoriel **non réutilisées** (garder celles réutilisées par le wizard/landing).
- [ ] **Step 2:** `node scripts/i18n-check.mjs` → 0 manquante ; corriger le dictionnaire.

## Task 8 — Gate + fichiers

- [ ] `bash /root/.agents/skills/process/scripts/verify.sh --project /root/snowball-pro` (complet, avec build).
- [ ] `node scripts/i18n-check.mjs` ✓ ; `npm run format` sur les fichiers touchés (ou format:check).
- [ ] Relire `git status` : **aucun** autre chantier touché/stagé.

## Task 9 — Auto-revue adverse (apex `-x`)

- [ ] Sous-agent reviewer à froid (session neuve) sur le diff complet : logique (aperçu ≡ résultat, cas limites réponses partielles, échappement imbriqué Échap/Tab), sécurité (aucun localStorage sensible), a11y (focus, rôles, aria-live), propreté, perf (re-render par frappe : `useMemo` rows keyé sur réponses), i18n.
- [ ] Corriger chaque finding (ou le motiver dans le plan coché).

## Task 10 — Vérification navigateur réelle (apex `-v` / visual-verify)

- [ ] Dev server + Playwright (skill webapp-testing) : parcours first-run complet **desktop 1440** — chiffre qui bouge, reveal, tour ; **mobile 390 + 320** — 0 overflow, bulles lisibles ; visiteur connu : « Nouvelle simulation » (croix, Échap) ; reduced-motion coché dans Chromium → pas d'animations bloquantes.
- [ ] `VERDICT VISUEL: PASS` écrit avec captures relues ; corriger tout écart.

## Task 11 — Documentation + release (sur GO utilisateur)

- [ ] Entrée MEMORY.md (session, décisions, vérifs) ; plan coché (ce fichier).
- [ ] Sur demande explicite : cérémonie (bump v6.23.0, CHANGELOG, changelog.html, « Dernières éditions » + footer FR/EN si applicable, `sw.js` `CACHE_VERSION`, commit chirurgical **sans** les fichiers d'autres threads, `vercel --prod`).
