import { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  HelpCircle,
  Landmark,
  Lightbulb,
  Percent,
  Settings2,
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
import {
  ENVELOPE_CONFIGS,
  fmtCurrency,
  fmtTaxPercent,
  getHistoricalDataset,
  getTaxRules,
  pfuRate,
  validateInputs,
} from "../../engine"
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

// Préférence UI (v6.2) : l'état replié/déplié de la sidebar persiste d'une
// visite à l'autre — comme le thème, c'est une préférence d'affichage, pas
// une donnée de scénario (donc clé globale, non scopée par compte).
const SIDEBAR_COLLAPSED_KEY = "snowball_v62_sidebar_collapsed"

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
  } catch {
    return false
  }
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
}: SidebarProps) {
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

  // Repliable (v6.2) : un clic sur le chevron plie/déplie TOUTE la sidebar.
  // L'état persiste en localStorage — sur les onglets où l'on ne touche pas
  // aux réglages, le panneau se réduit à un résumé compact + un bouton de
  // réouverture, et rend la largeur au contenu.
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const toggleCollapsed = () =>
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0")
      } catch {
        /* localStorage indisponible */
      }
      return next
    })
  const envelopeLabel = ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)?.shortLabel ?? "BRUT"

  return (
    <aside className="glass rounded-3xl p-5 sm:p-6 shadow-premium overflow-hidden">
      {/* I1 — plus de lg:sticky : la sidebar (2 200 px dépliée) dépassait la
          hauteur d'écran et épinglait ses sections basses sous le pli pendant
          tout le scroll. Elle suit désormais le document. */}
      {/* La marque vit dans l'en-tête global — ici, un repère de section dans
          l'anatomie SectionHeader uniforme (v5.6.4) + le badge de scénario en
          mode comparaison. */}
      <SectionHeader
        level="card"
        icon={Settings2}
        title="Réglages"
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
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-controls="sidebar-settings"
              aria-label={collapsed ? "Déplier les réglages" : "Replier les réglages"}
              title={collapsed ? "Déplier les réglages" : "Replier les réglages"}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-dim hover:text-text hover:border-primary/40 transition-colors"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        }
      />

      {/* Le contenu bascule par remontage (pas d'AnimatePresence) : robuste
          sous prefers-reduced-motion, où une sortie bloquée laisserait le
          panneau vide. Un simple fondu d'entrée suffit. */}
      {collapsed ? (
        <motion.div
          key="collapsed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <CollapsedSummary inputs={inputs} envelopeLabel={envelopeLabel} onExpand={toggleCollapsed} />
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          id="sidebar-settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Bases */}
          <CollapsibleSection title="Votre épargne" icon={<Coins size={12} />}>
            <SliderInput
              label="Capital de départ (€)"
              id="capital-initial"
              value={inputs.capitalInitial}
              min={0}
              max={200000}
              step={1000}
              hardMin={0}
              hardMax={100000000}
              error={fieldError("capitalInitial")?.message}
              warning={fieldWarning("capitalInitial")?.message}
              onChange={v => updateInput("capitalInitial", v)}
            />
            <SliderInput
              label="Épargne mensuelle (€)"
              id="monthly-payment"
              value={inputs.monthlyPayment}
              min={0}
              max={10000}
              step={50}
              hardMin={0}
              hardMax={200000}
              error={fieldError("monthlyPayment")?.message}
              warning={fieldWarning("monthlyPayment")?.message}
              onChange={v => updateInput("monthlyPayment", v)}
            />
            {/* La carte « Rendement de la bourse » (échelle 10,07 → 8,22 → 5,99 et
            Fisher) a rejoint le panneau « Pourquoi ces chiffres ? » en bas de
            la sidebar (v6) : c'est un contenu pédagogique de qualité, mais il
            n'appartient plus au chemin de réglages — il s'ouvre à la demande. */}
            <SliderInput
              label="Durée (années)"
              id="duration"
              value={inputs.duration}
              min={1}
              max={50}
              step={1}
              hardMin={1}
              hardMax={80}
              error={fieldError("duration")?.message}
              warning={fieldWarning("duration")?.message}
              onChange={v => updateInput("duration", v)}
            />
            {/* Scénario de rendement (v6.4.1) : le choix prudent / central /
            optimiste a quitté le haut de l'onglet Projection — il vit ici,
            dans les réglages, et le résultat s'affiche directement à
            l'ouverture. Même updateInput : la courbe lissée suit le choix. */}
            <ScenarioSelector inputs={inputs} updateInput={updateInput} />
          </CollapsibleSection>

          {/* Pourquoi ces chiffres ? — le contenu pédagogique (rendements,
          volatilité, Fisher) vit ici, replié par défaut (v6). Contenu intégral
          conservé depuis la carte « Rendement de la bourse » de la v5.7. */}
          <CollapsibleSection title="Pourquoi ces chiffres ?" icon={<HelpCircle size={12} />} defaultOpen={false}>
            <div className="rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-3 relative overflow-hidden">
              <div
                className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(212,175,55,0.14),transparent_60%)] pointer-events-none"
                aria-hidden
              />
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-primary shrink-0" />
                <span className="text-[11px] font-bold text-text leading-tight">
                  Rendement de la bourse (MSCI World)
                </span>
              </div>
              {/* Les trois étages de l'échelle : chaque ligne déduit UNE chose. */}
              <dl className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-[10px] text-text-muted">Brut (moyenne des années)</dt>
                  <dd className="mono text-[11px] font-bold text-text">
                    {(historical.avgReturn * 100).toFixed(2).replace(".", ",")} %/an
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-[10px] text-text-muted">Composé (krachs inclus)</dt>
                  <dd className="mono text-[11px] font-bold text-text">
                    {(historical.compoundedReturn * 100).toFixed(2).replace(".", ",")} %/an
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-t border-primary/15 pt-1.5">
                  <dt className="text-[10px] text-text-muted">Réel (après inflation 2,1 %)</dt>
                  <dd className="mono text-[11px] font-extrabold text-primary">
                    {(historical.netReturn * 100).toFixed(2).replace(".", ",")} %/an
                  </dd>
                </div>
              </dl>
              <p className="text-[9.5px] text-text-muted mt-2 leading-relaxed">
                Pourquoi 10,07 % → 5,99 % ? Chaque ligne retire <strong className="text-text">une seule</strong> chose :{" "}
                <strong className="text-text">la volatilité</strong> (les mauvaises années -37 %, -33 %… réduisent le
                gain composé) puis <strong className="text-text">l'inflation</strong> (2,1 %/an). Le Simulateur applique
                le scénario choisi dans « Votre épargne » (défaut : <strong className="text-text">Central</strong> =
                ligne composée) chaque année — courbe lissée, sans krachs.
              </p>
              {/* Formule de Fisher : réservée au mode Avancé (audit). */}
              {uiMode === "avance" && (
                <p className="text-[9px] text-text-dim mt-1.5 leading-relaxed border-t border-primary/10 pt-1.5">
                  Pourquoi pas 6,12 % (8,22 − 2,1) ? C'est une approximation : la formule exacte (Fisher) est{" "}
                  <span className="mono">(1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %</span> — l'inflation rogne aussi vos
                  gains, pas seulement votre capital de départ.
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Paramètres avancés — replié par défaut (audit) : seuls les réglages
              essentiels s'imposent à la lecture. */}
          <CollapsibleSection title="Paramètres avancés" icon={<Settings2 size={12} />} defaultOpen={false}>
            <SliderInput
              label="Augmentation de votre épargne (%/an)"
              id="indexation"
              value={inputs.indexation * 100}
              min={0}
              max={10}
              step={0.1}
              hardMin={0}
              hardMax={50}
              suffix="Votre épargne mensuelle augmente chaque année"
              error={fieldError("indexation")?.message}
              warning={fieldWarning("indexation")?.message}
              onChange={v => updateInput("indexation", v / 100)}
            />
            {/* Les 3 modes d'inflation (Personnalisée/Historique/Cyclique) ont été
            supprimés : l'inflation est toujours le taux personnalisé du
            curseur (défaut 2,1 %/an), librement modifiable. */}
            <SliderInput
              label="Inflation annuelle (%)"
              id="inflation"
              value={inputs.inflation * 100}
              min={0}
              max={10}
              step={0.1}
              hardMin={-10}
              hardMax={100}
              allowNegative
              suffix="défaut 2,1 %/an — taux personnalisé"
              error={fieldError("inflation")?.message}
              warning={fieldWarning("inflation")?.message}
              onChange={v => updateInput("inflation", v / 100)}
            />
            <SliderInput
              label="Simulations Monte Carlo"
              id="mc-runs"
              value={inputs.mcRuns}
              min={100}
              max={10000}
              step={100}
              hardMin={100}
              hardMax={10000}
              suffix="nombre de scénarios testés (Monte Carlo & Rente)"
              error={fieldError("mcRuns")?.message}
              warning={fieldWarning("mcRuns")?.message}
              onChange={v => updateInput("mcRuns", Math.round(v))}
            />
            <Toggle
              checked={inputs.showReal}
              onChange={v => updateInput("showReal", v)}
              label="Euros d'aujourd'hui"
              sub="Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout"
            />
          </CollapsibleSection>

          {/* Enveloppe fiscale — repliée par défaut (audit) : le compte reste
              visible dans le résumé replié et « Votre épargne ». */}
          <CollapsibleSection title="Compte d'investissement" icon={<Landmark size={12} />} defaultOpen={false}>
            <EnvelopeSelector value={inputs.envelope} onChange={v => updateInput("envelope", v)} />
            {inputs.envelope === "pea" && (
              <div className="mt-3 animate-fade-in">
                <SliderInput
                  label="Années de détention du PEA"
                  id="pea-years"
                  value={inputs.peaYearsHeld}
                  min={0}
                  max={30}
                  step={1}
                  hardMin={0}
                  hardMax={50}
                  suffix={
                    inputs.peaYearsHeld < 5
                      ? `moins de 5 ans : PFU ${fmtTaxPercent(pfuRate(rules))}`
                      : `au-delà de 5 ans : taux réduit (${fmtTaxPercent(rules.socialRate)})`
                  }
                  onChange={v => updateInput("peaYearsHeld", v)}
                />
              </div>
            )}
            {inputs.envelope === "av" && (
              <div className="mt-3 animate-fade-in">
                <SliderInput
                  label="Années de détention de l'AV"
                  id="av-years"
                  value={inputs.avYearsHeld}
                  min={0}
                  max={30}
                  step={1}
                  hardMin={0}
                  hardMax={50}
                  suffix="au-delà de 8 ans : abattement annuel"
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
                        Fiscalité du CTO
                      </span>
                      <HelpTip
                        text={`PFU : Prélèvement Forfaitaire Unique — ${fmtTaxPercent(pfuRate(rules))} sur les gains (${fmtTaxPercent(
                          rules.socialRate,
                        )} de prélèvements sociaux + ${fmtTaxPercent(rules.pfuIncomeRate)} d'impôt sur le revenu), sans barème.`}
                      />
                    </div>
                    <SegmentedControl
                      value={inputs.ctoTaxMode}
                      onChange={v => updateInput("ctoTaxMode", v)}
                      ariaLabel="Fiscalité du CTO"
                      options={[
                        { id: "pfu", label: `PFU ${fmtTaxPercent(pfuRate(rules))}`, sub: "impôt unique" },
                        {
                          id: "bareme",
                          label: "Barème",
                          sub: `${fmtTaxPercent(rules.socialRate)} + impôt à votre TMI`,
                        },
                      ]}
                    />
                  </>
                ) : inputs.ctoTaxMode === "bareme" ? (
                  <p className="text-[10px] text-text-muted leading-relaxed rounded-lg bg-glass px-3 py-2">
                    Barème progressif : <strong className="text-text">{fmtTaxPercent(rules.socialRate)}</strong> de
                    prélèvements sociaux + impôt sur le revenu à votre TMI de{" "}
                    <strong className="text-text">{(inputs.tmi * 100).toFixed(0)} %</strong> (réglage hérité du mode
                    Avancé).
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted leading-relaxed rounded-lg bg-glass px-3 py-2">
                    Impôt unique de <strong className="text-text">{fmtTaxPercent(pfuRate(rules))}</strong> sur vos gains
                    (prélèvement forfaitaire) — pour le barème progressif, passez en mode Avancé.
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
                  label="Tranche marginale d'imposition (%)"
                  id="tmi"
                  value={inputs.tmi * 100}
                  min={0}
                  max={45}
                  step={1}
                  hardMin={0}
                  hardMax={45}
                  suffix={
                    inputs.envelope === "per"
                      ? "Versements déduits à ce taux ; sortie : versements imposés à votre TMI (sans abattement de 10 %), gains au PFU"
                      : "Impôt appliqué à vos gains CTO (barème)"
                  }
                  error={fieldError("tmi")?.message}
                  warning={fieldWarning("tmi")?.message}
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
                  label="Fiscalité en couple"
                  sub="Plafond de versements PEA doublé (300 000 €)"
                />
              </div>
            )}
          </CollapsibleSection>

          {/* La crise synthétique a été supprimée (Option A) : les krachs réels
          (2000, 2008, 2022…) sont déjà dans les rendements rejoués par toutes
          les simulations — en simuler un les compterait deux fois. */}

          {/* Frais — repliés par défaut (audit). */}
          <CollapsibleSection title="Frais" icon={<Percent size={12} />} defaultOpen={false}>
            <ExpenseForm inputs={inputs} updateInput={updateInput} />
          </CollapsibleSection>

          {/* Profil (paquet 3) — le contexte de retraite et de risque : nourrit
              la couverture des dépenses et l'alerte « plan trop risqué » de
              l'onglet Rente. Replié par défaut (réglages secondaires). */}
          <CollapsibleSection title="Votre profil" icon={<UserRound size={12} />} defaultOpen={false}>
            <SliderInput
              label="Âge actuel"
              id="age-now"
              value={inputs.ageNow}
              min={16}
              max={100}
              step={1}
              hardMin={16}
              hardMax={100}
              suffix="utilisé pour situer votre retraite"
              onChange={v => updateInput("ageNow", Math.round(v))}
            />
            <SliderInput
              label="Âge de départ à la retraite"
              id="age-retirement"
              value={inputs.ageRetirement}
              min={16}
              max={100}
              step={1}
              hardMin={16}
              hardMax={100}
              suffix="votre rente démarre à cet âge"
              onChange={v => updateInput("ageRetirement", Math.round(v))}
            />
            <SliderInput
              label="Dépenses à la retraite (€/mois)"
              id="retirement-expenses"
              value={inputs.retirementExpenses}
              min={0}
              max={10000}
              step={50}
              hardMin={0}
              hardMax={1000000}
              suffix="ce dont vous aurez besoin chaque mois (profil)"
              onChange={v => updateInput("retirementExpenses", v)}
            />
            <SliderInput
              label="Autres revenus à la retraite (€/mois)"
              id="other-pensions"
              value={inputs.otherPensions}
              min={0}
              max={10000}
              step={50}
              hardMin={0}
              hardMax={1000000}
              suffix="pensions publiques, immobilier… s'ajoutent à votre rente"
              onChange={v => updateInput("otherPensions", v)}
            />
            <div className="mt-1 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                  Tolérance au risque
                </span>
                <HelpTip text="Votre profil de risque sert à l'alerte « plan trop risqué » de l'onglet Rente (pire repli historique vs perte acceptée) et recalibre la perte maximale acceptée (Prudent 20 %, Équilibré 35 %, Audacieux 50 %)." />
              </div>
              <SegmentedControl
                value={inputs.riskTolerance}
                onChange={v => {
                  // Le profil modifie RÉELLEMENT le verdict de risque : changer
                  // de profil recalibre la perte maximale acceptée (audit).
                  updateInput("riskTolerance", v)
                  updateInput("maxDrawdownTolerance", RISK_TOLERANCE_DEFAULTS[v])
                }}
                ariaLabel="Tolérance au risque"
                options={[
                  { id: "prudent", label: "Prudent", sub: "repli faible" },
                  { id: "equilibre", label: "Équilibré", sub: "compromis" },
                  { id: "audacieux", label: "Audacieux", sub: "repli fort" },
                ]}
              />
            </div>
            <SliderInput
              label="Perte maximale acceptée (%)"
              id="max-drawdown-tolerance"
              value={Math.round(inputs.maxDrawdownTolerance * 100)}
              min={5}
              max={60}
              step={5}
              hardMin={5}
              hardMax={60}
              suffix="le pire repli de bourse que vous acceptez de traverser"
              onChange={v => updateInput("maxDrawdownTolerance", v / 100)}
            />
            {/* Cohérence âge / durée / retraite (audit) : la projection doit
                atteindre l'âge de retraite — sinon le capital à décumuler ne
                correspond pas au départ en retraite. */}
            {inputs.ageRetirement >= inputs.ageNow && inputs.ageNow + inputs.duration !== inputs.ageRetirement && (
              <p className="text-[9px] text-warning leading-snug rounded-lg bg-warning/8 border border-warning/20 px-2.5 py-2">
                Âge actuel ({inputs.ageNow}) + durée ({inputs.duration} ans) ={" "}
                <strong>{inputs.ageNow + inputs.duration} ans</strong>, mais retraite prévue à{" "}
                <strong>{inputs.ageRetirement} ans</strong> — le capital de l'onglet Rente ne correspond pas à votre
                départ en retraite.
              </p>
            )}
          </CollapsibleSection>

          {/* Insight */}
          <div className="mb-5 glass-gold rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={13} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Votre projet</span>
            </div>
            <p className="text-xs leading-relaxed text-text-muted">
              Projection sur <strong className="text-text">{inputs.duration} ans</strong>. Capital final :{" "}
              <strong className="text-primary">{fmtCurrency(displayNominal)}</strong> sur le compte (fin de projet) ·{" "}
              <strong className="text-primary">{fmtCurrency(displayReal)}</strong> en euros d'aujourd'hui.
              {inputs.indexation > 0 && (
                <> Votre épargne augmente de {(inputs.indexation * 100).toFixed(0)} %/an.</>
              )}{" "}
              Les rendements rejoués sont ceux du MSCI World (1970–2025).
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
 * Vue repliée : un résumé compact des paramètres clés + la réouverture.
 * Sans elle, replier la sidebar laisserait un trou mort de 380 px — avec,
 * le panneau reste utile (et cliquable) sur les onglets où l'on ne règle
 * rien.
 */
function CollapsedSummary({
  inputs,
  envelopeLabel,
  onExpand,
}: {
  inputs: SimulationInputs
  envelopeLabel: string
  onExpand: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-surface-50/60 border border-border px-3.5 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Coins size={12} className="text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Vos paramètres</span>
        </div>
        <dl className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] text-text-dim">Capital</dt>
            <dd className="mono text-[11px] font-bold text-text">{fmtCurrency(inputs.capitalInitial)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] text-text-dim">Épargne / mois</dt>
            <dd className="mono text-[11px] font-bold text-text">{fmtCurrency(inputs.monthlyPayment)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] text-text-dim">Durée</dt>
            <dd className="mono text-[11px] font-bold text-text">{inputs.duration} ans</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] text-text-dim">Compte</dt>
            <dd className="text-[11px] font-bold text-text">{envelopeLabel}</dd>
          </div>
        </dl>
      </div>
      <button
        type="button"
        onClick={onExpand}
        className="w-full rounded-xl py-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
      >
        <ChevronRight size={13} />
        Rouvrir les réglages
      </button>
    </div>
  )
}
