# Refonte du header — « Moins de boutons, Nouvelle simulation ultra-visible, avertissement actionnable »

> **Pour les agents :** REQUIRED SUB-SKILL : implémentation par tâches (executing-plans ou mode inline avec auto-revue adverse après chaque tâche). Cases à cocher `- [ ]` pour le suivi.

**Goal :** Réduire le header de 9 contrôles à 5 max, faire de « Nouvelle simulation » l'unique bouton doré (donc le seul qui attire l'œil), et remplacer le badge « 1 avertissement » (inutile : on ne sait pas où est le problème) par une icône ⚠ discrète avec infobulle explicative + bouton « Corriger l'erreur » qui amène directement au champ fautif.

**Architecture :** Pas de nouveau state global — un signal `focusRequest` remonte d'ActionBar vers App, qui le relaie à Sidebar (révéler la section + focus l'input). Les actions secondaires (Exporter, Partager, Langue, Thème, Comparer, Mode, Réinitialiser) migrent dans le menu « ⋯ » existant, converti en panneaux (pattern déjà utilisé par AccountMenu : niveau 1 → sous-panneaux « Exporter » / « Partager » avec ← Retour). ExportMenu/ShareMenu deviennent des panneaux présentiels sans trigger. Aucune logique moteur ne change.

**Tech Stack :** React 19 + TypeScript strict + Tailwind 4 + lucide-react + framer-motion (existants). Aucune nouvelle dépendance.

**Spec :** Brief utilisateur (session 2026-08-17) + `PRODUCT.md` (promesse « résultat d'abord », style or/ivoire). Voir aussi `src/components/Layout/ActionBar.tsx` (état actuel du header) et `src/engine/validation.ts` (ValidationError avec `field`/`severity`/`message`).

## Contraintes globales

- Chaîne de vérification (dans l'ordre) : `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build`, puis `npm run format:check`. Script agrégeant : `bash .agents/skills/process/scripts/verify.sh`.
- App 100 % française : tout nouveau libellé doit être ajouté **FR + EN** dans `src/engine/i18n.ts` (objet `FR`-clé → `EN`-valeur).
- Les tests composants tournent en jsdom (pragma `@vitest-environment jsdom` dans `components.test.tsx`), le moteur en node. Pas de `scrollIntoView` fiable en jsdom → garder le pattern try/catch + fallback rAF déjà utilisé dans `Sidebar.revealSection`.
- Ne PAS supprimer les messages inline sous les champs (`SliderInput error/warning`) : la guideline UX exige de garder l'erreur inline + le résumé cliquable (on conserve les deux).
- Ne pas toucher au moteur (`src/engine/`), aux onglets, ni aux clés localStorage. Backward-compat des liens partagés et snapshots intacte (aucune donnée touchée).
- i18n : clés de nombre avec pluriel explicite (le code choisit déjà `{n} erreur` vs `{n} erreurs` selon le compte — reproduire ce pattern pour les nouveaux libellés).

---

## État actuel (diagnostic)

Header = 9 contrôles visibles : `Se connecter` · `＋ Nouvelle simulation` (doré) · `1 avertissement` (badge) · `Annuler/Rétablir` (segmenté avec textes) · `Exporter` (**doré**, menu CSV/JSON/PDF) · `Partager` · `FR` · `Sombre` · `⋯`.

Problèmes identifiés :

1. **Deux boutons dorés** (Nouvelle simulation + Exporter) → le CTA principal perd sa prééminence.
2. Le badge « 1 avertissement » n'indique **pas où** est le problème (le `title` natif liste les messages, mais rien n'y mène).
3. Trop de contrôles au même niveau → bruit visuel, saturation sur petit écran.

État cible (5 contrôles max) :

```
[avatar / Se connecter] [⚠ (si pb)] [↶][↷ icônes]   …   [＋ Nouvelle simulation] [⋯]
```

- **Niveau 0 — ultra-visible :** « Nouvelle simulation », SEUL bouton doré (gradient or + texte blanc + Plus). Légèrement agrandi (px-4 py-2.5 sm:py-2.5, text-[11.5px]), `shadow-gold`, `hover:brightness-110` (déjà en place). L'unique suppression du doré d'Exporter lui rend sa dominance.
- **Niveau 1 — discrets, icônes seules :** Annuler/Rétablir (paire segmentée, icônes Undo2/Redo2, `aria-label` conservés — les tests existants query par aria-label), icône ⚠ conditionnelle.
- **Niveau 2 — menu « ⋯ » :** Comparer, Mode Débutant/Avancé, Exporter (sous-panneau), Partager (sous-panneau), Langue FR/EN, Thème Sombre/Clair, Tout réinitialiser (confirmation inline existante).

> **Décision D1 (Partager) :** le partage vit dans « ⋯ » (2 clics). Trade-off : la « boucle virale » (commentaire v6.13 dans ShareMenu) perd de la visibilité. Alternative si le user la refuse : garder Partager visible en icône seule (niveau 1). Par défaut on applique la version minimaliste ; on demande confirmation avant d'implémenter.

---

## Fichiers

- **Créer** `src/utils/validationTargets.ts` — mapping champ validé → destination (onglet ou section sidebar + id d'input).
- **Modifier** `src/engine/i18n.ts` — nouvelles clés FR/EN.
- **Modifier** `src/components/Layout/Sidebar.tsx` — prop `focusRequest`, effet de révélation/focus.
- **Modifier** `src/App.tsx` — state `focusRequest`, `handleFixError`, bouton « Corriger » du bandeau d'erreur.
- **Modifier** `src/components/Layout/ActionBar.tsx` — cœur de la refonte (header + ⚠ + panneau ⋯).
- **Modifier** `src/components/Layout/ExportMenu.tsx` → exporte `ExportPanel` (panneau présentiel, sans trigger).
- **Modifier** `src/components/Layout/ShareMenu.tsx` → exporte `SharePanel` (panneau présentiel, sans trigger).
- **Modifier** `src/__tests__/components.test.tsx` — adapter les tests Export/Partage, ajouter les tests ⚠.
- **Créer** `src/__tests__/validationTargets.test.ts` — test d'exhaustivité du mapping.

---

### Tâche 1 : Mapping champ → destination + clés i18n

**Fichiers :**

- Créer : `src/utils/validationTargets.ts`
- Modifier : `src/engine/i18n.ts`

**Interfaces :**

- Produit : `TAB_FIELD: Partial<Record<keyof SimulationInputs, "goal" | "rente">>`, `FIELD_SECTION: Partial<Record<keyof SimulationInputs, FieldSectionId>>`, `FIELD_INPUT_ID: Partial<Record<keyof SimulationInputs, string>>`, type `FieldSectionId = "epargne" | "avance" | "compte" | "frais" | "profil"`.

- [ ] **Étape 1 : créer `src/utils/validationTargets.ts`**

```ts
import type { SimulationInputs } from "../types"

/**
 * Cible de « Corriger l'erreur » pour chaque champ validé (validation.ts).
 * Un champ vit soit dans un onglet dédié (TAB_FIELD), soit dans une section
 * accordéon de la sidebar (FIELD_SECTION) avec éventuellement un input à
 * focus (FIELD_INPUT_ID, id du <input type="range"> de SliderInput).
 * Source de vérité unique — les ids doivent rester alignés sur Sidebar.tsx.
 */
export type FieldSectionId = "epargne" | "avance" | "compte" | "frais" | "profil"

export const TAB_FIELD: Partial<Record<keyof SimulationInputs, "goal" | "rente">> = {
  goalTarget: "goal",
  retirementYears: "rente",
}

export const FIELD_SECTION: Partial<Record<keyof SimulationInputs, FieldSectionId>> = {
  capitalInitial: "epargne",
  monthlyPayment: "epargne",
  duration: "epargne",
  indexation: "avance",
  inflation: "avance",
  mcRuns: "avance",
  etfFees: "frais",
  brokerageFees: "frais",
  managementFees: "frais",
  tmi: "compte",
  ctoTaxMode: "compte",
  peaYearsHeld: "compte",
  avYearsHeld: "compte",
  ageNow: "profil",
  ageRetirement: "profil",
  retirementExpenses: "profil",
  otherPensions: "profil",
  riskTolerance: "profil",
  maxDrawdownTolerance: "profil",
}

export const FIELD_INPUT_ID: Partial<Record<keyof SimulationInputs, string>> = {
  capitalInitial: "capital-initial",
  monthlyPayment: "monthly-payment",
  duration: "duration",
  indexation: "indexation",
  inflation: "inflation",
  mcRuns: "mc-runs",
  tmi: "tmi",
  peaYearsHeld: "pea-years",
  avYearsHeld: "av-years",
  ageNow: "age-now",
  ageRetirement: "age-retirement",
  retirementExpenses: "retirement-expenses",
  otherPensions: "other-pensions",
}
```

- [ ] **Étape 2 : ajouter les clés i18n (FR → EN) dans `src/engine/i18n.ts`**, à côté des clés « avertissement » / « avertissements » :

```ts
// ─── Correction d'erreurs (refonte header) ───────────────────────────────────
"Corriger l'erreur": "Fix the error",
"Corriger les erreurs": "Fix the errors",
"Corriger": "Fix",
"{n} erreur à corriger": "{n} error to fix",
"{n} erreurs à corriger": "{n} errors to fix",
"{n} avertissement à corriger": "{n} warning to fix",
"{n} avertissements à corriger": "{n} warnings to fix",
"Problèmes à corriger": "Issues to fix",
```

- [ ] **Étape 3 : créer `src/__tests__/validationTargets.test.ts`** (environnement node par défaut) — test d'exhaustivité : tout champ qui peut produire une `ValidationError` (liste issue de `validation.ts` : capitalInitial, monthlyPayment, duration, inflation, etfFees, brokerageFees, managementFees, tmi, ctoTaxMode, goalTarget, mcRuns, retirementYears, ageRetirement) doit avoir une cible (`TAB_FIELD` ou `FIELD_SECTION`), et les ids d'inputs doivent pointer sur un élément présent dans la sidebar (vérification par liste attendue).

```ts
import { describe, expect, it } from "vitest"
import { TAB_FIELD, FIELD_SECTION, FIELD_INPUT_ID } from "../utils/validationTargets"

const VALIDATED_FIELDS = [
  "capitalInitial",
  "monthlyPayment",
  "duration",
  "inflation",
  "etfFees",
  "brokerageFees",
  "managementFees",
  "tmi",
  "ctoTaxMode",
  "goalTarget",
  "mcRuns",
  "retirementYears",
  "ageRetirement",
] as const

describe("validationTargets — chaque champ validé a une destination", () => {
  it("tous les champs de validateInputs sont couverts", () => {
    for (const field of VALIDATED_FIELDS) {
      expect(TAB_FIELD[field] ?? FIELD_SECTION[field], `champ sans cible : ${field}`).toBeDefined()
    }
  })

  it("les champs d'onglet ne sont pas aussi dans la sidebar", () => {
    expect(FIELD_SECTION.goalTarget).toBeUndefined()
    expect(FIELD_SECTION.retirementYears).toBeUndefined()
  })

  it("les ids d'inputs correspondent aux ids SliderInput de la sidebar", () => {
    const EXPECTED_IDS = {
      capitalInitial: "capital-initial",
      monthlyPayment: "monthly-payment",
      duration: "duration",
      indexation: "indexation",
      inflation: "inflation",
      mcRuns: "mc-runs",
      tmi: "tmi",
      peaYearsHeld: "pea-years",
      avYearsHeld: "av-years",
      ageNow: "age-now",
      ageRetirement: "age-retirement",
      retirementExpenses: "retirement-expenses",
      otherPensions: "other-pensions",
    }
    expect(FIELD_INPUT_ID).toEqual(EXPECTED_IDS)
  })
})
```

- [ ] **Étape 4 : vérifier** — `npm run test -- src/__tests__/validationTargets.test.ts` (PASS).
- [ ] **Étape 5 : commit** — `feat(validation): mapping champ → destination pour « Corriger l'erreur »`.

---

### Tâche 2 : Sidebar — révéler et focus un champ à distance

**Fichiers :**

- Modifier : `src/components/Layout/Sidebar.tsx`

**Interfaces :**

- Consomme : `FIELD_SECTION`, `FIELD_INPUT_ID`, `FieldSectionId` (tâche 1).
- Produit : prop `focusRequest?: { field: keyof SimulationInputs; nonce: number } | null` sur `Sidebar`. `SECTIONS` typé sur `FieldSectionId`.

- [ ] **Étape 1 : typer SECTIONS avec `FieldSectionId`** — remplacer le type local `SectionId` par l'import, garder `const SECTIONS: ReadonlyArray<{ id: FieldSectionId; label: string; icon: ... }>`.

- [ ] **Étape 2 : ajouter la prop et l'effet de révélation.** S'inspirer de `revealSection` (pattern jsdom-safe existant) :

```tsx
interface SidebarProps {
  // ...props existantes
  focusRequest?: { field: keyof SimulationInputs; nonce: number } | null
}

// Dans le corps du composant :
useEffect(() => {
  if (!focusRequest) return
  const { field } = focusRequest
  const section = FIELD_SECTION[field]
  if (!section) return
  setOpenSections(s => ({ ...s, [section]: true }))
  if (collapsed) onToggleCollapsed()
  const raf: (cb: () => void) => void =
    typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (cb: () => void) => window.setTimeout(cb, 16)
  raf(() => {
    raf(() => {
      const target = FIELD_INPUT_ID[field]
        ? document.getElementById(FIELD_INPUT_ID[field] as string)
        : document.getElementById(`sidebar-section-${section}`)
      if (!target) return
      if (typeof target.scrollIntoView === "function") {
        try {
          const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" })
        } catch {
          /* jsdom */
        }
      }
      if (typeof target.focus === "function") target.focus({ preventScroll: true })
    })
  })
}, [focusRequest, collapsed, onToggleCollapsed])
```

Attention : ajouter `useEffect` à l'import React existant (déjà importé `useState`).

- [ ] **Étape 3 : vérifier** — `npm run typecheck` (PASS), `npm run lint` (PASS).
- [ ] **Étape 4 : commit** — `feat(sidebar): révéler et focus un champ à distance (focusRequest)`.

---

### Tâche 3 : App — câblage `onFixError` + bouton « Corriger » du bandeau d'erreur

**Fichiers :**

- Modifier : `src/App.tsx`

**Interfaces :**

- Consomme : `TAB_FIELD` (tâche 1).
- Produit : `handleFixError(field: ValidationError["field"])`, `focusRequest`, prop `onFixError` passée à `ActionBar`, prop `focusRequest` passée à `Sidebar`.

- [ ] **Étape 1 : state + handler** (à côté des autres `useState` d'AppShell) :

```tsx
const [focusRequest, setFocusRequest] = useState<{ field: keyof SimulationInputs; nonce: number } | null>(null)

const handleFixError = useCallback((field: ValidationError["field"]) => {
  const tab = TAB_FIELD[field]
  if (tab) {
    setActiveTab(tab)
    return
  }
  setFocusRequest({ field, nonce: Date.now() })
}, [])
```

- [ ] **Étape 2 : passer les props** — `ActionBar` reçoit `onFixError={handleFixError}` ; `Sidebar` reçoit `focusRequest={focusRequest}`.

- [ ] **Étape 3 : bandeau d'erreur actionnable** — dans le `role="alert"` existant (sous le header), ajouter un bouton qui mène à la première erreur :

```tsx
<button
  type="button"
  onClick={() => handleFixError(validationErrors.find(e => e.severity === "error")!.field)}
  className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold bg-danger/15 border border-danger/40 text-danger hover:bg-danger/25 transition-colors"
>
  {tr("Corriger")}
</button>
```

(replier le texte du bandeau si besoin : il reste le résumé global, le bouton mène au champ — guideline « error summary + liens vers les champs »).

- [ ] **Étape 4 : vérifier** — `npm run typecheck` + `npm run lint` (PASS).
- [ ] **Étape 5 : commit** — `feat(app): « Corriger l'erreur » câblé depuis le header et le bandeau`.

---

### Tâche 4 : ActionBar — header minimal, icône ⚠ actionnable, menu ⋯ en panneaux

**Fichiers :**

- Modifier : `src/components/Layout/ActionBar.tsx`
- Consomme : `ExportPanel` (tâche 5), `SharePanel` (tâche 5), `LanguageToggle`, `onFixError`.

**Interfaces :**

- Consomme : prop `onFixError: (field: ValidationError["field"]) => void` (tâche 3).
- Produit : le nouveau header. Aucun contrat externe ne change (props ActionBar conservées).

- [ ] **Étape 1 : Annuler/Rétablir en icônes seules.** Retirer les textes `{tr("Annuler")}` / `{tr("Rétablir")}` ; garder `aria-label`, `title`, `disabled`, icônes `aria-hidden`, conteneur segmenté.

- [ ] **Étape 2 : icône ⚠ + popover.** Remplacer le `<span title=…>` par un bouton icône + popover (pattern fermeture clic extérieur/Échap identique aux autres menus) :

```tsx
{
  ;(errorCount > 0 || warningCount > 0) && (
    <div ref={warnRef} className="relative">
      <button
        type="button"
        onClick={() => setWarnOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={warnOpen}
        aria-label={
          errorCount > 0
            ? tr(errorCount > 1 ? "{n} erreurs à corriger" : "{n} erreur à corriger", { n: errorCount })
            : tr(warningCount > 1 ? "{n} avertissements à corriger" : "{n} avertissement à corriger", {
                n: warningCount,
              })
        }
        title={validationErrors.map(e => tr(e.message)).join(" · ")}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
          errorCount > 0
            ? "text-danger bg-danger/15 hover:bg-danger/25"
            : "text-warning bg-warning/15 hover:bg-warning/25"
        }`}
      >
        <AlertTriangle size={14} aria-hidden />
      </button>
      {warnOpen && (
        <div
          role="dialog"
          aria-label={tr("Problèmes à corriger")}
          className="absolute right-0 top-[calc(100%+8px)] w-80 max-w-[calc(100vw-2rem)] glass-strong rounded-2xl shadow-premium-lg p-2 z-50 animate-scale-in"
        >
          <p className="px-3 pt-1.5 pb-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-text">
            {errorCount > 0
              ? tr(errorCount > 1 ? "{n} erreurs à corriger" : "{n} erreur à corriger", { n: errorCount })
              : tr(warningCount > 1 ? "{n} avertissements à corriger" : "{n} avertissement à corriger", {
                  n: warningCount,
                })}
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {validationErrors.map((e, i) => (
              <button
                key={`${e.field}-${i}`}
                type="button"
                onClick={() => {
                  setWarnOpen(false)
                  onFixError(e.field)
                }}
                className="w-full text-left inline-flex items-start gap-2 px-3 py-2 rounded-lg text-[10.5px] font-semibold leading-snug hover:bg-glass-hover transition-colors"
              >
                <AlertTriangle
                  size={12}
                  className={`shrink-0 mt-px ${e.severity === "error" ? "text-danger" : "text-warning"}`}
                  aria-hidden
                />
                {tr(e.message)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setWarnOpen(false)
              onFixError(validationErrors[0].field)
            }}
            className="mt-2 w-full rounded-xl px-3 py-2.5 text-[11px] font-extrabold transition-all active:scale-[0.98] text-white bg-danger hover:brightness-110"
          >
            {errorCount > 0
              ? tr(errorCount > 1 ? "Corriger les erreurs" : "Corriger l'erreur")
              : tr("Corriger l'erreur")}
          </button>
        </div>
      )}
    </div>
  )
}
```

Ordre de `validationErrors` : la validation pousse d'abord les erreurs puis les warnings ; `validationErrors[0]` est donc la première erreur (sinon premier warning) — comportement voulu. Prioriser explicitement : `validationErrors.find(e => e.severity === "error") ?? validationErrors[0]`.

- [ ] **Étape 3 : menu ⋯ en panneaux.** Supprimer les boutons `ExportMenu`, `ShareMenu`, `LanguageToggle`, thème du niveau 1. Dans le menu ⋯ (pattern AccountMenu `panel: "menu" | "export" | "share"`), niveau 1 :

```
[GitCompareArrows] Comparer deux scénarios (ou « Quitter la comparaison »)
[GraduationCap] Mode Avancé / Débutant (+ sous-libellé existant)
─────
[Download] Exporter ▸          → panel "export" (← Retour + 3 lignes ExportPanel)
[Share2] Partager ▸            → panel "share" (← Retour + 4 canaux SharePanel)
─────
[Languages] FR / EN            → <LanguageToggle className="w-full justify-start" /> (clic = toggle immédiat)
[Moon/Sun] Sombre / Clair      → bouton onToggleDarkMode immédiat
─────
[Eraser] Tout réinitialiser    → confirmation inline existante
```

Langue et thème restent **1 clic** (pas de sous-panneau) — seule leur visibilité descend d'un niveau. Fermer le panneau au clic extérieur et à Échap (effets existants), remettre `panel` à `"menu"` à la fermeture.

- [ ] **Étape 4 : « Nouvelle simulation » reste la seule dorée.** Vérifier qu'aucun autre élément du header n'utilise `bg-gradient-to-*` / `btn-gold-text` (Exporter quitte le header). Agrandir légèrement : `px-4 py-2.5 sm:py-2.5` et `text-[11.5px]`.

- [ ] **Étape 5 : vérifier** — `npm run typecheck` + `npm run lint` (PASS).
- [ ] **Étape 6 : commit** — `refactor(header): 9 → 5 contrôles, ⚠ actionnable, actions secondaires en panneaux ⋯`.

---

### Tâche 5 : ExportMenu / ShareMenu → panneaux présentiels

**Fichiers :**

- Modifier : `src/components/Layout/ExportMenu.tsx`
- Modifier : `src/components/Layout/ShareMenu.tsx`

**Interfaces :**

- Produit : `ExportPanel({ onExportCSV, onExportJSON, onPrint, onDone }: {...})` — les 3 lignes (CSV/JSON/PDF) sans trigger ni dropdown ; `SharePanel({ inputs, onDone }: {...})` — les 4 canaux + copie, sans trigger ni dropdown. `onDone` ferme le panneau ⋯ après action.

- [ ] **Étape 1 : `ExportMenu.tsx`** — retirer le trigger/useEffect de fermeture ; exporter `ExportPanel` : mêmes lignes d'actions (`actions` array conservé, `a.onClick` → `{ a.onClick(); onDone() }`), style de lignes identique.

- [ ] **Étape 2 : `ShareMenu.tsx`** — retirer le trigger/useEffect ; exporter `SharePanel({ inputs, onDone })` : conserver TOUTE la logique `withUtm`, `shareText`, `handleCopy`, `copied` (state local au panneau). Chaque action → `onDone()` après.

- [ ] **Étape 3 : vérifier** — `npm run typecheck` + `npm run lint` + `npm run test` (PASS).
- [ ] **Étape 4 : commit** — `refactor(export,share): ExportMenu/ShareMenu → panneaux réutilisables`.

---

### Tâche 6 : Tests composants + vérification complète

**Fichiers :**

- Modifier : `src/__tests__/components.test.tsx`

- [ ] **Étape 1 : adapter les 2 tests Export** (describe « menu Export ») — ouvrir le menu ⋯ d'abord, puis « Exporter » :

```tsx
const openMore = () => fireEvent.click(screen.getByRole("button", { name: /autres actions/i }))
// « Un seul bouton Exporter » devient : rien avant d'ouvrir ⋯ puis Exporter.
openMore()
expect(screen.getByRole("menuitem", { name: /exporter/i })).toBeInTheDocument()
expect(screen.queryByRole("menuitem", { name: /export json/i })).not.toBeInTheDocument()
fireEvent.click(screen.getByRole("menuitem", { name: /exporter/i }))
expect(screen.getByRole("menuitem", { name: /export csv/i })).toBeInTheDocument()
// ... etc.
```

Le test « se ferme au clic extérieur » devient : le panneau ⋯ se ferme au `mousedown` hors menu ; le sous-panneau « export » revient au niveau 1 via le bouton « ← Retour ».

- [ ] **Étape 2 : adapter les tests Partager** (describe « v6.13 ») — préfixer chaque ouverture par `openMore()` + clic « Partager » (les assertions UTM / `#s=` / clipboard restent identiques).

- [ ] **Étape 3 : nouveaux tests ⚠** (dans `components.test.tsx`, après le bloc undo/redo) :

```tsx
describe("avertissement du header — icône + « Corriger l'erreur »", () => {
  it("le badge texte a disparu ; l'icône ⚠ apparaît quand un champ sort des bornes", () => {
    render(<App />)
    // Défaut : aucune erreur → pas d'icône, pas de texte.
    expect(screen.queryByRole("button", { name: /à corriger/i })).not.toBeInTheDocument()
    // Saisie directe hors borne (durée > 80) via le SmartInput de la sidebar.
    const input = screen.getByLabelText("Durée (années) (saisie directe)")
    fireEvent.change(input, { target: { value: "85" } })
    expect(screen.getByRole("button", { name: /1 erreur à corriger/i })).toBeInTheDocument()
    expect(screen.queryByText(/1 avertissement/i)).not.toBeInTheDocument()
  })

  it("le popover liste le problème et « Corriger l'erreur » ouvre la section et focus le champ", () => {
    render(<App />)
    const input = screen.getByLabelText("Durée (années) (saisie directe)")
    fireEvent.change(input, { target: { value: "85" } })
    fireEvent.click(screen.getByRole("button", { name: /1 erreur à corriger/i }))
    // Le popover explique ce que c'est…
    expect(screen.getByText(/La durée maximale est de 80 ans/i)).toBeInTheDocument()
    // … et propose de corriger.
    fireEvent.click(screen.getByRole("button", { name: /Corriger l'erreur/i }))
    // La section « Votre épargne » est ouverte et le slider a le focus.
    expect(document.getElementById("duration")).toHaveFocus()
  })
})
```

Vérifier que `SmartInput` expose bien `aria-label="Durée (années) (saisie directe)"` (voir `SliderInput.tsx`) et que `fireEvent.change` sur la textbox déclenche la validation (le state remonte via `updateInput` → `validateInputs` dans App). Si le nom accessible diffère, adapter la requête.

- [ ] **Étape 4 : vérification complète** — `bash .agents/skills/process/scripts/verify.sh` (typecheck → lint → test → build), puis `npm run format:check` (et `npm run format` si échec). Aussi : `npm run test -- src/__tests__/validationTargets.test.ts`.
- [ ] **Étape 5 : commit** — `test(header): icône ⚠, popover, « Corriger l'erreur », panneaux ⋯`.

---

## Auto-revue (à faire après implémentation)

1. **Coverage spec :** 9 → ≤ 5 contrôles ✓ · Nouvelle simulation seul doré ✓ · ⚠ icône + tooltip + « Corriger l'erreur » ✓ · bandeau d'erreur actionnable ✓ · erreurs inline conservées ✓.
2. **Coherence des ids :** les `FIELD_INPUT_ID` correspondent aux ids passés aux `SliderInput` de `Sidebar.tsx` (le test d'exhaustivité les fige).
3. **Casse des tests existants :** undo/redo query par aria-label (conservés) ; les tests Export/Partage sont adaptés en Tâche 6 ; `LanguageToggle` reste testé en isolation.
4. **a11y :** popover `role="dialog"` avec `aria-label`, lignes cliquables, focus renvoyé au déclencheur à la fermeture (pattern des autres menus) ; messages inline sous les champs intacts.
5. **Mobile :** le header ne wrappe plus (5 contrôles) ; le popover ⚠ est borné à `max-w-[calc(100vw-2rem)]`.
