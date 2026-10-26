import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { motion } from "framer-motion"
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Coins,
  HelpCircle,
  Landmark,
  Lightbulb,
  Percent,
  Settings2,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
} from "lucide-react"
import { HelpTip } from "../shared/HelpTip"
import { SectionHeader } from "../shared/SectionHeader"
import { EnvelopeSelector } from "../Forms/EnvelopeSelector"
import { ExpenseForm } from "../Forms/ExpenseForm"
import { ScenarioSelector } from "../Simulation/ScenarioSelector"
import { SnapshotPanel } from "./SnapshotPanel"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { SegmentedControl } from "../shared/SegmentedControl"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { cn } from "../../utils/cn"
import { FIELD_INPUT_ID, FIELD_SECTION } from "../../utils/validationTargets"
import { getHistoricalDataset, getTaxRules, pfuRate, validateInputs } from "../../engine"
import { useLang } from "../../i18n"
import type { ValidationError } from "../../engine"
import type { SavedSnapshot, SimulationInputs, YearRow } from "../../types"
import type { UiMode } from "../../utils/uiMode"

// Perte maximale acceptée associée à chaque profil de risque (audit) : le
// choix du profil modifie RÉELLEMENT le verdict « plan trop risqué » de
// l'onglet Rente (au lieu de n'être qu'une étiquette).
const RISK_TOLERANCE_DEFAULTS: Record<SimulationInputs["riskTolerance"], number> = {
  prudent: 0.2,
  equilibre: 0.35,
  audacieux: 0.5,
}

// Sections de réglages : UNE source de vérité pour le rail replié (icônes +
// libellés) et les titres des accordéons dépliés — impossible qu'ils
// divergent.
const SECTIONS = [
  { id: "epargne", label: "Votre épargne", icon: Coins },
  { id: "pourquoi", label: "Pourquoi ces chiffres ?", icon: HelpCircle },
  { id: "avance", label: "Paramètres avancés", icon: SlidersHorizontal },
  { id: "compte", label: "Compte d'investissement", icon: Landmark },
  { id: "frais", label: "Frais", icon: Percent },
  { id: "profil", label: "Votre profil", icon: UserRound },
] as const
type SectionId = (typeof SECTIONS)[number]["id"]

// Ouverture par défaut : « Votre épargne » ouvert, le reste replié (mêmes
// défauts qu'avant). L'état vit dans Sidebar (et non dans chaque
// CollapsibleSection) pour que le rail puisse ouvrir une section « à
// distance » quand on clique son icône.
const DEFAULT_OPEN: Record<SectionId, boolean> = {
  epargne: true,
  pourquoi: false,
  avance: false,
  compte: false,
  frais: false,
  profil: false,
}

interface SidebarProps {
  inputs: SimulationInputs
  rows: YearRow[]
  scenarioLabel?: string
  snapshots: SavedSnapshot[]
  onSaveSnapshot: () => void
  onLoadSnapshot: (id: string) => void
  onRemoveSnapshot: (id: string) => void
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  /** Mode Débutant / Avancé (audit) : masque PFU, TMI et la formule de Fisher. */
  uiMode?: UiMode
  /**
   * Repli du panneau (v6.2) : l'état vit dans App — c'est App qui resserre la
   * grille (380 px → rail 76 px) pour rendre la largeur au contenu.
   */
  collapsed: boolean
  onToggleCollapsed: () => void
  /**
   * « Corriger l'erreur » (refonte header) : quand App le pose, la sidebar
   * ouvre la section du champ, déplie le rail si besoin, scrolle jusqu'au
   * champ et le met au focus. `nonce` force la réaction même pour un même
   * champ demandé deux fois de suite.
   */
  focusRequest?: { field: keyof SimulationInputs; nonce: number } | null
}

export function Sidebar({
  inputs,
  rows,
  scenarioLabel,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onRemoveSnapshot,
  updateInput,
  uiMode = "debutant",
  collapsed,
  onToggleCollapsed,
  focusRequest,
}: SidebarProps) {
  const { tr, fmtCurrency, fmtDecimal, fmtTaxPercent } = useLang()
  const lastRow = rows[rows.length - 1]
  // Les deux échelles sont TOUJOURS affichées côte à côte : le montant qui
  // sera sur le compte (euros courants) et son pouvoir d'achat en euros
  // d'aujourd'hui. Le toggle ne fait plus que choisir laquelle est mise en
  // avant — il ne cache plus jamais la valeur du compte (demande utilisateur).
  const displayNominal = lastRow ? lastRow.nominal : 0
  const displayReal = lastRow ? lastRow.real : 0
  const historical = getHistoricalDataset(inputs.historicalIndex)
  // Règles fiscales de l'année des inputs (défaut : année courante) — tous les
  // taux affichés ici en dérivent, aucun chiffre codé en dur (v6, taxRules.ts).
  const rules = getTaxRules(inputs.taxYear)

  const validationErrors = validateInputs(inputs)
  const fieldError = (field: keyof SimulationInputs): ValidationError | undefined =>
    validationErrors.find(e => e.field === field && e.severity === "error")
  const fieldWarning = (field: keyof SimulationInputs): ValidationError | undefined =>
    validationErrors.find(e => e.field === field && e.severity === "warning")
  // Messages localisés : le moteur reste en français (tests intacts), la
  // traduction a lieu à l'affichage (i18n v6.12.0).
  const fieldErrorMsg = (field: keyof SimulationInputs): string | undefined => {
    const e = fieldError(field)
    return e ? tr(e.message) : undefined
  }
  const fieldWarningMsg = (field: keyof SimulationInputs): string | undefined => {
    const w = fieldWarning(field)
    return w ? tr(w.message) : undefined
  }

  // Ouverture des sections, pilotée par Sidebar (cf. DEFAULT_OPEN).
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(DEFAULT_OPEN)
  const toggleSection = (id: SectionId) => setOpenSections(s => ({ ...s, [id]: !s[id] }))

  // « Corriger l'erreur » : la demande vient du header (icône ⚠) ou du bandeau
  // d'erreur. On réutilise le geste de revealSection (ouvrir + déplier +
  // scroller) en ciblant l'input du champ lui-même quand il en a un.
  useEffect(() => {
    if (!focusRequest) return
    const { field } = focusRequest
    const section = FIELD_SECTION[field]
    if (!section) return
    setOpenSections(s => ({ ...s, [section]: true }))
    if (collapsed) onToggleCollapsed()
    // double rAF : laisser l'ouverture de section se rendre avant de mesurer
    // la position ; try/catch : jsdom n'implémente pas scrollIntoView.
    const raf: (cb: () => void) => void =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (cb: () => void) => window.setTimeout(cb, 16)
    raf(() => {
      raf(() => {
        const inputId = FIELD_INPUT_ID[field]
        const target = inputId
          ? document.getElementById(inputId)
          : document.getElementById(`sidebar-section-${section}`)
        if (!target) return
        if (typeof target.scrollIntoView === "function") {
          try {
            const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" })
          } catch {
            /* jsdom : scrollIntoView non implémenté */
          }
        }
        if (typeof target.focus === "function") target.focus({ preventScroll: true })
      })
    })
  }, [focusRequest, collapsed, onToggleCollapsed])

  // Rail replié : cliquer l'icône d'une catégorie déplie la sidebar ET ouvre
  // la section, puis l'amène dans la vue (même geste qu'une navigation
  // ChatGPT : clic dans le rail → le contenu ciblé apparaît).
  const revealSection = (id: SectionId) => {
    setOpenSections(s => ({ ...s, [id]: true }))
    if (collapsed) onToggleCollapsed()
    // double rAF : laisser le fondu d'entrée démarrer avant de mesurer la
    // position ; try/catch : jsdom n'implémente pas scrollIntoView.
    const raf: (cb: () => void) => void =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (cb: () => void) => window.setTimeout(cb, 16)
    raf(() => {
      raf(() => {
        const el = document.getElementById(`sidebar-section-${id}`)
        if (el) {
          if (typeof el.scrollIntoView === "function") {
            try {
              const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
              el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
            } catch {
              /* jsdom : scrollIntoView non implémenté */
            }
          }
          // Clavier : le focus suit la navigation (sinon il tombe sur <body>
          // après le remontage du rail) — preventScroll, le scroll est déjà fait.
          el.querySelector<HTMLElement>("button")?.focus({ preventScroll: true })
        }
      })
    })
  }

  return (
    <aside
      className={cn(
        "glass rounded-3xl shadow-premium",
        // Rail replié : pas de overflow-hidden (les tooltips débordent à
        // droite) ni de fond à rogner ; sticky sur desktop pour que le rail
        // reste visible pendant le scroll (comme ChatGPT), z-30 pour
        // passer au-dessus du contenu principal.
        collapsed
          ? "p-3 z-30 lg:sticky lg:top-24"
          : // Déplié : overflow-hidden rogne le contenu sur les coins arrondis.
            "p-5 sm:p-6 overflow-hidden",
      )}
    >
      {/* Le contenu bascule par remontage (pas d'AnimatePresence) : robuste
          sous prefers-reduced-motion, où une sortie bloquée laisserait le
          panneau vide. Le rail glisse depuis la gauche, le panneau déplié
          s'ouvre en fondu. */}
      {collapsed ? (
        <motion.div
          key="collapsed"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex lg:flex-col items-center gap-1 lg:gap-2 overflow-x-auto lg:overflow-visible"
        >
          {/* Marque — clic = déplier (même affordance que le logo ChatGPT). */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={tr("Déplier les réglages avancés")}
            className="group/rail hidden lg:flex relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-light via-primary to-primary-dark items-center justify-center shadow-gold shrink-0 hover:brightness-110 transition-[filter] mb-1"
          >
            <Settings2 size={18} className="btn-gold-text" aria-hidden />
            <RailTip>{tr("Déplier les réglages avancés")}</RailTip>
          </button>

          {/* Séparateur après la marque (desktop uniquement). */}
          <div className="hidden lg:block w-9 h-px bg-border/70" aria-hidden />

          <nav
            aria-label={tr("Sections de réglages")}
            data-tour="settings"
            className="flex lg:flex-col items-center gap-1 lg:gap-2"
          >
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = openSections[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => revealSection(id)}
                  aria-label={tr(label)}
                  title={tr(label)}
                  className={cn(
                    "group/rail relative w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary shadow-gold ring-1 ring-primary/40"
                      : "text-text-dim hover:text-text hover:bg-glass-hover",
                  )}
                >
                  <Icon size={17} className="lg:hidden" aria-hidden />
                  <Icon size={18} className="hidden lg:block" aria-hidden />
                  <RailTip>{tr(label)}</RailTip>
                </button>
              )
            })}
          </nav>

          <div className="flex-1" aria-hidden />

          {/* Séparateur vertical (mobile uniquement) avant les utilitaires. */}
          <div className="lg:hidden w-px h-7 bg-border/70" aria-hidden />

          {/* Snapshot — action utile même repliée, compteur en badge. */}
          <button
            type="button"
            onClick={onSaveSnapshot}
            aria-label={tr("Sauvegarder un snapshot")}
            title={tr("Sauvegarder un snapshot")}
            className="group/rail relative w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 text-text-dim hover:text-primary hover:bg-primary/10 transition-all duration-200"
          >
            <Camera size={17} className="lg:hidden" aria-hidden />
            <Camera size={18} className="hidden lg:block" aria-hidden />
            {snapshots.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary btn-gold-text text-[9px] font-bold flex items-center justify-center border border-surface"
                aria-hidden
              >
                {snapshots.length}
              </span>
            )}
            <RailTip>{tr("Snapshot")}</RailTip>
          </button>

          {/* Déplier (chevron) — contrôles utilitaires en bas, comme ChatGPT. */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={tr("Déplier les réglages avancés")}
            className="group/rail relative w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 border border-border text-text-dim hover:text-text hover:border-primary/40 transition-all duration-200"
          >
            <ChevronRight size={17} className="lg:hidden" aria-hidden />
            <ChevronRight size={18} className="hidden lg:block" aria-hidden />
            <RailTip>{tr("Déplier les réglages avancés")}</RailTip>
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          id="sidebar-settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* I1 — plus de lg:sticky : la sidebar (2 200 px dépliée) dépassait la
              hauteur d'écran et épinglait ses sections basses sous le pli pendant
              tout le scroll. Elle suit désormais le document. */}
          {/* La marque vit dans l'en-tête global — ici, un repère de section dans
              l'anatomie SectionHeader uniforme (v5.6.4) + le badge de scénario en
              mode comparaison. */}
          <SectionHeader
            level="card"
            icon={Settings2}
            title={tr("Réglages avancés")}
            className="mb-6 items-center"
            trailing={
              <div className="flex items-center gap-2 shrink-0">
                {scenarioLabel && (
                  <span className="text-[10px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    {scenarioLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-expanded={!collapsed}
                  aria-controls="sidebar-settings"
                  aria-label={collapsed ? tr("Déplier les réglages avancés") : tr("Replier les réglages avancés")}
                  title={collapsed ? tr("Déplier les réglages avancés") : tr("Replier les réglages avancés")}
                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-dim hover:text-text hover:border-primary/40 transition-colors"
                >
                  {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
              </div>
            }
          />

          {/* Bases */}
          <RailSection
            id="epargne"
            title={tr("Votre épargne")}
            icon={<Coins size={12} />}
            open={openSections.epargne}
            onOpenChange={() => toggleSection("epargne")}
          >
            <SliderInput
              label={tr("Capital de départ (€)")}
              id="capital-initial"
              value={inputs.capitalInitial}
              min={0}
              max={200000}
              step={1000}
              hardMin={0}
              hardMax={100000000}
              error={fieldErrorMsg("capitalInitial")}
              warning={fieldWarningMsg("capitalInitial")}
              onChange={v => updateInput("capitalInitial", v)}
            />
            <SliderInput
              label={tr("Épargne mensuelle (€)")}
              id="monthly-payment"
              value={inputs.monthlyPayment}
              min={0}
              max={10000}
              step={50}
              hardMin={0}
              hardMax={200000}
              error={fieldErrorMsg("monthlyPayment")}
              warning={fieldWarningMsg("monthlyPayment")}
              onChange={v => updateInput("monthlyPayment", v)}
            />
            {/* La carte « Rendement de la bourse » (échelle 10,07 → 8,22 → 5,99 et
            Fisher) a rejoint le panneau « Pourquoi ces chiffres ? » en bas de
            la sidebar (v6) : c'est un contenu pédagogique de qualité, mais il
            n'appartient plus au chemin de réglages — il s'ouvre à la demande. */}
            <SliderInput
              label={tr("Durée (années)")}
              id="duration"
              value={inputs.duration}
              min={1}
              max={50}
              step={1}
              hardMin={1}
              hardMax={80}
              error={fieldErrorMsg("duration")}
              warning={fieldWarningMsg("duration")}
              onChange={v => updateInput("duration", v)}
            />
            {/* Scénario de rendement (v6.4.1) : le choix prudent / central /
            optimiste a quitté le haut de l'onglet Projection — il vit ici,
            dans les réglages, et le résultat s'affiche directement à
            l'ouverture. Même updateInput : la courbe lissée suit le choix. */}
            <ScenarioSelector inputs={inputs} updateInput={updateInput} />
          </RailSection>

          {/* Pourquoi ces chiffres ? — le contenu pédagogique (rendements,
          volatilité, Fisher) vit ici, replié par défaut (v6). Contenu intégral
          conservé depuis la carte « Rendement de la bourse » de la v5.7. */}
          <RailSection
            id="pourquoi"
            title={tr("Pourquoi ces chiffres ?")}
            icon={<HelpCircle size={12} />}
            open={openSections.pourquoi}
            onOpenChange={() => toggleSection("pourquoi")}
          >
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-3 relative overflow-hidden">
              <div
                className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(212,175,55,0.14),transparent_60%)] pointer-events-none"
                aria-hidden
              />
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-primary shrink-0" />
                <span className="text-[11px] font-bold text-text leading-tight">
                  {tr("Rendement de la bourse (MSCI World)")}
                </span>
              </div>
              {/* Les trois étages de l'échelle : chaque ligne déduit UNE chose. */}
              <dl className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-[10px] text-text-muted">{tr("Brut (moyenne des années)")}</dt>
                  <dd className="mono text-[11px] font-bold text-text">
                    {fmtDecimal(historical.avgReturn * 100, 2)}
                    {tr(" %/an")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-[10px] text-text-muted">{tr("Composé (krachs inclus)")}</dt>
                  <dd className="mono text-[11px] font-bold text-text">
                    {fmtDecimal(historical.compoundedReturn * 100, 2)}
                    {tr(" %/an")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-t border-primary/15 pt-1.5">
                  <dt className="text-[10px] text-text-muted">{tr("Réel (après inflation 2,1 %)")}</dt>
                  <dd className="mono text-[11px] font-extrabold text-primary">
                    {fmtDecimal(historical.netReturn * 100, 2)}
                    {tr(" %/an")}
                  </dd>
                </div>
              </dl>
              <p className="text-[9.5px] text-text-dim mt-1.5 leading-relaxed">
                {tr("Hypothèse d'inflation : ")}
                <strong className="text-text">{tr("2,1 %/an (cible BCE)")}</strong>
                {tr(", vs 4,0 % en moyenne réelle 1970-2025 — la médiane de la période est justement 2,1 %.")}
              </p>
              <p className="text-[9.5px] text-text-muted mt-2 leading-relaxed">
                {tr("Pourquoi 10,07 % → 5,99 % ? Chaque ligne retire")}{" "}
                <strong className="text-text">{tr("une seule")}</strong> {tr("chose :")}{" "}
                <strong className="text-text">{tr("la volatilité")}</strong>{" "}
                {tr("(les mauvaises années -37 %, -33 %… réduisent le gain composé) puis")}{" "}
                <strong className="text-text">{tr("l'inflation")}</strong>{" "}
                {tr("(2,1 %/an). Le Simulateur applique le scénario choisi dans « Votre épargne » (défaut :")}{" "}
                <strong className="text-text">{tr("Central")}</strong> ={" "}
                {tr("ligne composée) chaque année — courbe lissée, sans krachs.")}
              </p>
              {/* Formule de Fisher : réservée au mode Avancé (audit). */}
              {uiMode === "avance" && (
                <p className="text-[9px] text-text-dim mt-1.5 leading-relaxed border-t border-primary/10 pt-1.5">
                  {tr("Pourquoi pas 6,12 % (8,22 − 2,1) ? C'est une approximation : la formule exacte (Fisher) est")}{" "}
                  <span className="mono">(1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %</span>
                  {tr(" — l'inflation rogne aussi vos gains, pas seulement votre capital de départ.")}
                </p>
              )}
            </div>
          </RailSection>

          {/* Paramètres avancés — replié par défaut (audit) : seuls les réglages
              essentiels s'imposent à la lecture. */}
          <RailSection
            id="avance"
            title={tr("Paramètres avancés")}
            icon={<Settings2 size={12} />}
            open={openSections.avance}
            onOpenChange={() => toggleSection("avance")}
          >
            <SliderInput
              label={tr("Augmentation de votre épargne (%/an)")}
              id="indexation"
              value={inputs.indexation * 100}
              min={0}
              max={10}
              step={0.1}
              hardMin={0}
              hardMax={50}
              suffix={tr("Votre épargne mensuelle augmente chaque année")}
              error={fieldErrorMsg("indexation")}
              warning={fieldWarningMsg("indexation")}
              onChange={v => updateInput("indexation", v / 100)}
            />
            {/* Les 3 modes d'inflation (Personnalisée/Historique/Cyclique) ont été
            supprimés : l'inflation est toujours le taux personnalisé du
            curseur (défaut 2,1 %/an), librement modifiable. */}
            <SliderInput
              label={tr("Inflation annuelle (%)")}
              id="inflation"
              value={inputs.inflation * 100}
              min={0}
              max={10}
              step={0.1}
              hardMin={-10}
              hardMax={100}
              allowNegative
              suffix={tr("défaut 2,1 %/an — taux personnalisé")}
              error={fieldErrorMsg("inflation")}
              warning={fieldWarningMsg("inflation")}
              onChange={v => updateInput("inflation", v / 100)}
            />
            <SliderInput
              label={tr("Simulations Monte Carlo")}
              id="mc-runs"
              value={inputs.mcRuns}
              min={100}
              max={10000}
              step={100}
              hardMin={100}
              hardMax={10000}
              suffix={tr("nombre de scénarios testés (Monte Carlo & Rente)")}
              error={fieldErrorMsg("mcRuns")}
              warning={fieldWarningMsg("mcRuns")}
              onChange={v => updateInput("mcRuns", Math.round(v))}
            />
            <Toggle
              checked={inputs.showReal}
              onChange={v => updateInput("showReal", v)}
              label={tr("Euros d'aujourd'hui")}
              sub={tr("Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout")}
            />
          </RailSection>

          {/* Enveloppe fiscale — repliée par défaut (audit) : le compte reste
              visible dans le résumé replié et « Votre épargne ». */}
          <RailSection
            id="compte"
            title={tr("Compte d'investissement")}
            icon={<Landmark size={12} />}
            open={openSections.compte}
            onOpenChange={() => toggleSection("compte")}
          >
            <EnvelopeSelector value={inputs.envelope} onChange={v => updateInput("envelope", v)} />
            {inputs.envelope === "pea" && (
              <div className="mt-3 animate-fade-in">
                <SliderInput
                  label={tr("Années de détention du PEA")}
                  id="pea-years"
                  value={inputs.peaYearsHeld}
                  min={0}
                  max={30}
                  step={1}
                  hardMin={0}
                  hardMax={50}
                  suffix={
                    inputs.peaYearsHeld < 5
                      ? tr("moins de 5 ans : PFU {rate}", { rate: fmtTaxPercent(pfuRate(rules)) })
                      : tr("au-delà de 5 ans : taux réduit ({rate})", { rate: fmtTaxPercent(rules.socialRate) })
                  }
                  onChange={v => updateInput("peaYearsHeld", v)}
                />
              </div>
            )}
            {inputs.envelope === "av" && (
              <div className="mt-3 animate-fade-in">
                <SliderInput
                  label={tr("Années de détention de l'AV")}
                  id="av-years"
                  value={inputs.avYearsHeld}
                  min={0}
                  max={30}
                  step={1}
                  hardMin={0}
                  hardMax={50}
                  suffix={tr("au-delà de 8 ans : abattement annuel")}
                  onChange={v => updateInput("avYearsHeld", v)}
                />
              </div>
            )}
            {inputs.envelope === "cto" && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {/* PFU : le sélecteur est réservé au mode Avancé (audit) ; en
                    Débutant on affiche une ligne simple — l'impôt unique reste
                    le défaut et le calcul ne change pas. */}
                {uiMode === "avance" ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                        {tr("Fiscalité du CTO")}
                      </span>
                      <HelpTip
                        text={tr(
                          "PFU : Prélèvement Forfaitaire Unique — {pfu} sur les gains ({social} de prélèvements sociaux + {ir} d'impôt sur le revenu), sans barème.",
                          {
                            pfu: fmtTaxPercent(pfuRate(rules)),
                            social: fmtTaxPercent(rules.socialRate),
                            ir: fmtTaxPercent(rules.pfuIncomeRate),
                          },
                        )}
                      />
                    </div>
                    <SegmentedControl
                      value={inputs.ctoTaxMode}
                      onChange={v => updateInput("ctoTaxMode", v)}
                      ariaLabel={tr("Fiscalité du CTO")}
                      options={[
                        { id: "pfu", label: `PFU ${fmtTaxPercent(pfuRate(rules))}`, sub: tr("impôt unique") },
                        {
                          id: "bareme",
                          label: tr("Barème"),
                          sub: tr("{social} + impôt à votre TMI", { social: fmtTaxPercent(rules.socialRate) }),
                        },
                      ]}
                    />
                  </>
                ) : inputs.ctoTaxMode === "bareme" ? (
                  <p className="text-[10px] text-text-muted leading-relaxed rounded-lg bg-glass px-3 py-2">
                    {tr("Barème progressif :")} <strong className="text-text">{fmtTaxPercent(rules.socialRate)}</strong>{" "}
                    {tr("de prélèvements sociaux + impôt sur le revenu à votre TMI de")}{" "}
                    <strong className="text-text">{fmtDecimal(inputs.tmi * 100, 0)} %</strong>{" "}
                    {tr("(réglage hérité du mode Avancé).")}
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted leading-relaxed rounded-lg bg-glass px-3 py-2">
                    {tr("Impôt unique de")} <strong className="text-text">{fmtTaxPercent(pfuRate(rules))}</strong>{" "}
                    {tr("sur vos gains (prélèvement forfaitaire) — pour le barème progressif, passez en mode Avancé.")}
                  </p>
                )}
              </div>
            )}
            {/* TMI : toujours visible pour le PER (la déduction d'entrée en
                dépend) ; pour le CTO en barème, réservée au mode Avancé (audit). */}
            {(inputs.envelope === "per" ||
              (uiMode === "avance" && inputs.envelope === "cto" && inputs.ctoTaxMode === "bareme")) && (
              <div className="mt-3 animate-fade-in">
                <SliderInput
                  label={tr("Tranche marginale d'imposition (%)")}
                  id="tmi"
                  value={inputs.tmi * 100}
                  min={0}
                  max={45}
                  step={1}
                  hardMin={0}
                  hardMax={45}
                  suffix={
                    inputs.envelope === "per"
                      ? tr(
                          "Versements déduits à ce taux ; sortie : versements imposés à votre TMI (sans abattement de 10 %), gains au PFU",
                        )
                      : tr("Impôt appliqué à vos gains CTO (barème)")
                  }
                  error={fieldErrorMsg("tmi")}
                  warning={fieldWarningMsg("tmi")}
                  onChange={v => updateInput("tmi", v / 100)}
                />
              </div>
            )}
            {/* La fiscalité en couple (plafond PEA doublé) ne concerne QUE le PEA :
            elle n'apparaît plus sur les autres comptes (CTO, AV, PER, BRUT). */}
            {inputs.envelope === "pea" && (
              <div className="mt-3">
                <Toggle
                  checked={inputs.taxCouple}
                  onChange={v => updateInput("taxCouple", v)}
                  label={tr("Fiscalité en couple")}
                  sub={tr("Plafond de versements PEA doublé (300 000 €)")}
                />
              </div>
            )}
          </RailSection>

          {/* La crise synthétique a été supprimée (Option A) : les krachs réels
          (2000, 2008, 2022…) sont déjà dans les rendements rejoués par toutes
          les simulations — en simuler un les compterait deux fois. */}

          {/* Frais — repliés par défaut (audit). */}
          <RailSection
            id="frais"
            title={tr("Frais")}
            icon={<Percent size={12} />}
            open={openSections.frais}
            onOpenChange={() => toggleSection("frais")}
          >
            <ExpenseForm inputs={inputs} updateInput={updateInput} />
          </RailSection>

          {/* Profil (paquet 3) — le contexte de retraite et de risque : nourrit
              la couverture des dépenses et l'alerte « plan trop risqué » de
              l'onglet Rente. Replié par défaut (réglages secondaires). */}
          <RailSection
            id="profil"
            title={tr("Votre profil")}
            icon={<UserRound size={12} />}
            open={openSections.profil}
            onOpenChange={() => toggleSection("profil")}
          >
            <SliderInput
              label={tr("Âge actuel")}
              id="age-now"
              value={inputs.ageNow}
              min={16}
              max={100}
              step={1}
              hardMin={16}
              hardMax={100}
              suffix={tr("utilisé pour situer votre retraite")}
              onChange={v => updateInput("ageNow", Math.round(v))}
            />
            <SliderInput
              label={tr("Âge de départ à la retraite")}
              id="age-retirement"
              value={inputs.ageRetirement}
              min={16}
              max={100}
              step={1}
              hardMin={16}
              hardMax={100}
              suffix={tr("votre rente démarre à cet âge")}
              onChange={v => updateInput("ageRetirement", Math.round(v))}
            />
            <SliderInput
              label={tr("Dépenses à la retraite (€/mois)")}
              id="retirement-expenses"
              value={inputs.retirementExpenses}
              min={0}
              max={10000}
              step={50}
              hardMin={0}
              hardMax={1000000}
              suffix={tr("ce dont vous aurez besoin chaque mois (profil)")}
              onChange={v => updateInput("retirementExpenses", v)}
            />
            <SliderInput
              label={tr("Autres revenus à la retraite (€/mois)")}
              id="other-pensions"
              value={inputs.otherPensions}
              min={0}
              max={10000}
              step={50}
              hardMin={0}
              hardMax={1000000}
              suffix={tr("pensions publiques, immobilier… s'ajoutent à votre rente")}
              onChange={v => updateInput("otherPensions", v)}
            />
            <div className="mt-1 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                  {tr("Tolérance au risque")}
                </span>
                <HelpTip
                  text={tr(
                    "Votre profil de risque sert à l'alerte « plan trop risqué » de l'onglet Rente (pire repli historique vs perte acceptée) et recalibre la perte maximale acceptée (Prudent 20 %, Équilibré 35 %, Audacieux 50 %).",
                  )}
                />
              </div>
              <SegmentedControl
                value={inputs.riskTolerance}
                onChange={v => {
                  // Le profil modifie RÉELLEMENT le verdict de risque : changer
                  // de profil recalibre la perte maximale acceptée (audit).
                  updateInput("riskTolerance", v)
                  updateInput("maxDrawdownTolerance", RISK_TOLERANCE_DEFAULTS[v])
                }}
                ariaLabel={tr("Tolérance au risque")}
                options={[
                  { id: "prudent", label: tr("Prudent"), sub: tr("repli faible") },
                  { id: "equilibre", label: tr("Équilibré"), sub: tr("compromis") },
                  { id: "audacieux", label: tr("Audacieux"), sub: tr("repli fort") },
                ]}
              />
            </div>
            <SliderInput
              label={tr("Perte maximale acceptée (%)")}
              id="max-drawdown-tolerance"
              value={Math.round(inputs.maxDrawdownTolerance * 100)}
              min={5}
              max={60}
              step={5}
              hardMin={5}
              hardMax={60}
              suffix={tr("le pire repli de bourse que vous acceptez de traverser")}
              onChange={v => updateInput("maxDrawdownTolerance", v / 100)}
            />
            {/* Cohérence âge / durée / retraite (audit) : la projection doit
                atteindre l'âge de retraite — sinon le capital à décumuler ne
                correspond pas au départ en retraite. */}
            {inputs.ageRetirement >= inputs.ageNow && inputs.ageNow + inputs.duration !== inputs.ageRetirement && (
              <p className="text-[9px] text-warning leading-snug rounded-lg bg-warning/8 border border-warning/20 px-2.5 py-2">
                {tr("Âge actuel ({ageNow}) + durée ({duration} ans) =", {
                  ageNow: inputs.ageNow,
                  duration: inputs.duration,
                })}{" "}
                <strong>{tr("{n} ans", { n: inputs.ageNow + inputs.duration })}</strong>
                {tr(", mais retraite prévue à")} <strong>{tr("{n} ans", { n: inputs.ageRetirement })}</strong>
                {tr(" — le capital de l'onglet Rente ne correspond pas à votre départ en retraite.")}
              </p>
            )}
          </RailSection>

          {/* Insight */}
          <div className="mb-5 glass-gold rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={13} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                {tr("Votre projet")}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-text-muted">
              {tr("Projection sur")} <strong className="text-text">{tr("{n} ans", { n: inputs.duration })}</strong>
              {tr(". Capital final :")} <strong className="text-primary">{fmtCurrency(displayNominal)}</strong>{" "}
              {tr("sur le compte (fin de projet) ·")}{" "}
              <strong className="text-primary">{fmtCurrency(displayReal)}</strong> {tr("en euros d'aujourd'hui.")}
              {inputs.indexation > 0 && (
                <>
                  {" "}
                  {tr("Votre épargne augmente de {pct} %/an.", {
                    pct: fmtDecimal(inputs.indexation * 100, 0),
                  })}
                </>
              )}{" "}
              {tr("Les rendements rejoués sont ceux du MSCI World (1970–2025).")}
            </p>
          </div>

          {/* Snapshots */}
          <SnapshotPanel
            snapshots={snapshots}
            onSave={onSaveSnapshot}
            onLoad={onLoadSnapshot}
            onRemove={onRemoveSnapshot}
          />
        </motion.div>
      )}
    </aside>
  )
}

/**
 * Section pliable pilotée par Sidebar (rail) : enveloppe la section d'un
 * ancrage de scroll (`sidebar-section-<id>`) — quand on déplie depuis le
 * rail, revealSection amène la section dans la vue (scroll-mt : sous
 * l'en-tête sticky).
 */
function RailSection({
  id,
  title,
  icon,
  open,
  onOpenChange,
  children,
}: {
  id: SectionId
  title: ReactNode
  icon?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <div id={`sidebar-section-${id}`} className="scroll-mt-24">
      <CollapsibleSection title={title} icon={icon} open={open} onOpenChange={onOpenChange}>
        {children}
      </CollapsibleSection>
    </div>
  )
}

/**
 * Infobulle du rail replié (desktop uniquement) : le rail est vertical sur
 * lg, la bulle s'ouvre à droite de l'icône — comme ChatGPT. Masquée sur
 * mobile (rail horizontal) où le `title` natif du bouton prend le relais.
 */
function RailTip({ children }: { children: ReactNode }) {
  return (
    <span
      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden lg:block whitespace-nowrap rounded-lg bg-[#211f1b]/95 text-[#f5f0e8] text-[11px] font-semibold px-2.5 py-1.5 border border-white/10 opacity-0 translate-x-1 group-hover/rail:opacity-100 group-hover/rail:translate-x-0 transition-all duration-150 z-50 shadow-lg"
      role="tooltip"
    >
      {children}
    </span>
  )
}
