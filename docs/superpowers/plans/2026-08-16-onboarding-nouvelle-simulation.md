# Onboarding « Nouvelle simulation » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (mode inline, pas de sous-agents dans ce harness). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guider le nouveau visiteur du premier écran au « nombre magique » : tutoriel non-skippable (1re visite uniquement) → questionnaire 8 questions → résultat, puis remplacer la prééminence des réglages par un système « Nouvelle simulation » avec bibliothèque « Mes simulations ».

**Architecture:** Fonctions pures dans `src/engine/onboarding.ts` (recommandations + mapping réponses → `SimulationInputs`), deux overlays plein écran (`Tutorial.tsx`, `SimulationWizard.tsx`), un nouvel onglet bibliothèque (`SimulationsTab.tsx`) adossé au système de snapshots existant (bibliothèque = snapshots, limite relevée 8 → 30), sidebar réglages repliée par défaut (« Réglages avancés » au second plan). Tout reste 100 % local (localStorage), i18n FR/EN.

**Tech Stack:** React 19, TypeScript strict, Tailwind 4, framer-motion, lucide-react. Chaîne de vérif : `typecheck → lint → test → build` (+ `node scripts/i18n-check.mjs`).

**Spec:** voir la discussion (design figé avec l'utilisateur) — ce document est la source d'exécution.

## Global Constraints

- App 100 % locale, aucune donnée ne quitte l'appareil (localStorage).
- i18n : toute chaîne française affichée via `tr()` DOIT avoir son entrée EN dans `src/engine/i18n.ts` (sinon `i18n-check` échoue).
- Le français reste la langue par défaut ; clés = texte français exact.
- Ne pas toucher au chantier iOS/Capacitor non commité (`ios/`, `capacitor.config.ts`, `App.tsx` modifications existantes de l'autre thread — on édite App.tsx par-dessus, prudemment, sans casser ses changements : `AccountMenu`, `fields.tsx`… sont hors périmètre).
- Chaque nouvelle fonction moteur a son test (node). Composants testés en jsdom.
- `SNAPSHOT_LIMIT` 8 → 30 (la bibliothèque « Mes simulations » remplace la limite de captures manuelles).
- Le tutoriel est non-skippable UNIQUEMENT pour le vrai nouveau visiteur : aucune clé `snowball_v5_settings` (scope), aucun lien partagé `#s=`, aucun snapshot, aucune clé globale `snowball_v5_tutorial_done`.

## File Structure

- **Créer** `src/engine/onboarding.ts` — pur : types `ProjectGoal`, `WizardAnswers` ; `recommendDuration`, `recommendEnvelope`, `buildSimulationFromAnswers`, `defaultSimulationName`, listes de choix (`AGE_CHOICES`, `CAPITAL_CHOICES`, `MONTHLY_CHOICES`, `DURATION_CHOICES`, `RETIREMENT_AGE_CHOICES`).
- **Créer** `src/utils/onboarding.ts` — persistance : `TUTORIAL_DONE_KEY`, `loadTutorialVisible(scope)`, `saveTutorialDone()`.
- **Créer** `src/components/Onboarding/Tutorial.tsx` — overlay 5 slides, non-skippable.
- **Créer** `src/components/Onboarding/SimulationWizard.tsx` — overlay wizard 9 écrans (8 questions + nom), ⭐ dynamiques, conditionnel retraite, renommage final.
- **Créer** `src/components/Tabs/SimulationsTab.tsx` — onglet bibliothèque (en cours + sauvegardées, ouvrir/renommer/supprimer).
- **Modifier** `src/engine/snapshots.ts` — `renameSnapshot(list, id, name)`, `SNAPSHOT_LIMIT = 30`.
- **Modifier** `src/engine/index.ts` — barrel : exporter onboarding + `renameSnapshot`.
- **Modifier** `src/engine/i18n.ts` — toutes les nouvelles clés EN.
- **Modifier** `src/utils/sidebar.ts` — défaut replié = `true`.
- **Modifier** `src/components/Layout/ActionBar.tsx` — bouton primaire « Nouvelle simulation » (`onNewSimulation`).
- **Modifier** `src/components/Layout/Sidebar.tsx` — libellés « Réglages avancés » (rail + replier).
- **Modifier** `src/App.tsx` — état tutoriel/wizard, dialogue sauvegarde avant nouvelle sim (dirty), onglet « Mes simulations », sidebar repliée par défaut, suppression du bandeau QuickStart (remplacé par le tutoriel ; `QUICKSTART_PROFILES` reste utilisé par la landing).
- **Modifier** `src/__tests__/engine.test.ts` — tests onboarding + renameSnapshot (+ ajustement SNAPSHOT_LIMIT).
- **Modifier** `src/__tests__/components.test.tsx` — setup des clés pour les tests App existants (tutoriel done + sidebar dépliée), bloc QuickStart remplacé par les tests tutoriel/wizard/simulations.

## Task 1 — Moteur pur : onboarding.ts (TDD)

**Files:**

- Create: `src/engine/onboarding.ts`
- Test: `src/__tests__/engine.test.ts` (nouveau describe)

- [ ] **Step 1: écrire les tests** — `recommendDuration` (projet → durée recommandée, `aucune` → 25), `recommendEnvelope` (durée ≥ 15 → `pea`, sinon `av`), `buildSimulationFromAnswers` (champs mappés : ageNow, capitalInitial, monthlyPayment, duration, envelope auto résolue, returnScenario/maxDrawdownTolerance selon risque, ageRetirement conditionnel, reste = DEFAULT_INPUTS), `defaultSimulationName` (libellé + durée).
- [ ] **Step 2: les voir échouer** — `npx vitest run src/__tests__/engine.test.ts -t onboarding` → FAIL (fonctions absentes).
- [ ] **Step 3: implémenter** — module pur, types + constantes + 4 fonctions.
- [ ] **Step 4: voir passer** + `renameSnapshot` (même cycle : test puis implémentation dans snapshots.ts).
- [ ] **Step 5: barrel** — `engine/index.ts` exporte le module onboarding + `renameSnapshot`.

## Task 2 — Tutoriel non-skippable

**Files:**

- Create: `src/components/Onboarding/Tutorial.tsx`, `src/utils/onboarding.ts`
- Modify: `src/App.tsx` (état + rendu overlay), `src/engine/i18n.ts`

- [ ] **Step 1: tests composants** — nouveau visiteur (localStorage vide) → overlay tutoriel visible, PAS de bouton fermer/skip (seulement « Suivant »), navigation 5 slides, dernier slide → « Lancer ma première simulation » → marque la clé `snowball_v5_tutorial_done`, ouvre le wizard. Visiteur connu (settings présents) ou lien `#s=` → pas de tutoriel.
- [ ] **Step 2: implémenter** — `utils/onboarding.ts` (clé globale + `loadTutorialVisible(scope)` : pas de done && pas de shared && pas de settings && pas de snapshots), `Tutorial.tsx` (5 slides, boutons Suivant/Commencer, pastilles de progression, `role="dialog"` `aria-modal`, aucune croix), branchement App (`showTutorial`, `finishTutorial` → `saveTutorialDone` + ouvre wizard).
- [ ] **Step 3: i18n** — toutes les chaînes du tutoriel FR → EN dans `i18n.ts`.

## Task 3 — Wizard questionnaire + « Nouvelle simulation »

**Files:**

- Create: `src/components/Onboarding/SimulationWizard.tsx`
- Modify: `src/App.tsx` (état wizard, bouton, dialogue dirty), `src/components/Layout/ActionBar.tsx`, `src/engine/i18n.ts`

- [ ] **Step 1: tests composants** — wizard : 9 écrans, « Suivant » désactivé tant que pas de réponse, Oui/Non capital (Oui → montant, Non → 0 € et étape suivante), ⭐ sur durée recommandée et enveloppe recommandée, question retraite conditionnelle (visible pour retraite/liberté, absente pour immobilier), renommage final pré-rempli, « Voir mon résultat » → snapshot ajouté (nom choisi) + inputs actifs mis à jour + wizard fermé.
- [ ] **Step 2: implémenter wizard** — état local `answers`, `step`, options cliquables, barre de progression, retour, X (annulation), résumé final.
- [ ] **Step 3: dialogue sauvegarde** — App : baseline des inputs (montage, load snapshot, fin wizard, reset), `dirty = inputs ≠ baseline` ; clic « Nouvelle simulation » (bouton primaire ActionBar) → si dirty : modale [Sauvegarder et créer / Créer sans sauvegarder / Annuler], sauvegarde via `createSnapshot(inputs, rows)` + `addSnapshot`, puis wizard (réponses vierges — pas de pré-remplissage, décision utilisateur).
- [ ] **Step 4: fin wizard** — `buildSimulationFromAnswers` → `setInputs`, baseline, snapshot nommé dans la bibliothèque, `setActiveTab("simulator")`.

## Task 4 — Onglet « Mes simulations » + réglages avancés au second plan

**Files:**

- Create: `src/components/Tabs/SimulationsTab.tsx`
- Modify: `src/App.tsx` (TABS + rendu), `src/utils/sidebar.ts`, `src/components/Layout/Sidebar.tsx`, `src/components/Layout/ActionBar.tsx` (props), `src/engine/i18n.ts`

- [ ] **Step 1: tests composants** — onglet liste « Simulation en cours » (capital calculé) + sauvegardées (nom, capital, actions Ouvrir/Renommer/Supprimer), renommage inline, chargement → inputs mis à jour, suppression confirmée. Sidebar repliée par défaut (rail visible, réglages masqués, libellé « Réglages avancés »).
- [ ] **Step 2: implémenter** — `SimulationsTab.tsx` (état de renommage inline, suppression 2-temps, empty state + CTA), TABS + rendu App, `loadSidebarCollapsed` défaut `true`, libellés Sidebar « Réglages avancés ».
- [ ] **Step 3: i18n** — clés du tab + sidebar.

## Task 5 — Vérification complète

- [ ] `bash .agents/skills/process/scripts/verify.sh` (typecheck → lint → test → build)
- [ ] `node scripts/i18n-check.mjs` → 0 clé manquante
- [ ] `npm run format:check` (ou format sur les fichiers touchés)
- [ ] Auto-revue adverse : relire le diff (sécurité, logique, cas limites, propreté), corriger
- [ ] Vérification navigateur (dev server + preview) : parcours nouveau visiteur (tutoriel → wizard → résultat), nouveau visiteur avec lien `#s=` (pas de tutoriel), « Nouvelle simulation » avec/sans dirty, onglet Mes simulations, réglages avancés repliés
