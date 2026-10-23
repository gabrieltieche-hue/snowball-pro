import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Coins,
  HelpCircle,
  Landmark,
  Lightbulb,
  PiggyBank,
  Play,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

import { ENVELOPE_CONFIGS, fmtDecimal, getHistoricalPool, runStressTest, STRESS_TEST_SCENARIOS } from "../../engine"
import type { Lang } from "../../engine"
import { useLang } from "../../i18n"
import { chartTheme } from "../../utils/chartTheme"
import { cn } from "@/utils/cn"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import { Toggle } from "../shared/Toggle"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { SectionHeader } from "../shared/SectionHeader"
import { TerminalHistogram } from "../Simulation/TerminalHistogram"

import type { DecumulationResult, SimulationInputs, StressTestResult, WithdrawalModel, YearRow } from "../../types"
import type { UiMode } from "../../utils/uiMode"

const WITHDRAWAL_MODELS: {
  id: WithdrawalModel
  label: string
  desc: string
  rate: number
  icon: typeof Shield
  tone: string
}[] = [
  {
    id: "rule-4",
    label: "Règle des 4 %",
    desc: "Retrait prudent de 4 %/an (Bengen)",
    rate: 0.04,
    icon: Shield,
    tone: "var(--color-success)",
  },
  {
    id: "ultra-safe",
    label: "Très prudent",
    desc: "Retrait conservateur de 2,5 %/an",
    rate: 0.025,
    icon: PiggyBank,
    tone: "var(--color-accent)",
  },
  {
    id: "optimistic",
    label: "Optimiste",
    desc: "Retrait dynamique de 5,5 %/an",
    rate: 0.055,
    icon: Sparkles,
    tone: "var(--color-primary)",
  },
  {
    id: "custom",
    label: "Personnalisé",
    desc: "Montant fixe mensuel choisi",
    rate: 0,
    icon: Wallet,
    tone: "var(--color-primary-dark)",
  },
]

interface RenteRetraiteTabProps {
  inputs: SimulationInputs
  decumResult: DecumulationResult | null
  lastRow: YearRow | undefined
  darkMode: boolean
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  updateInputs: (partial: Partial<SimulationInputs>) => void
  runDecum: () => void
  isStale?: boolean
  running?: boolean
  progress?: number
  /** Mode Débutant / Avancé (audit) : masque les notions techniques (Guyton–Klinger…). */
  uiMode?: UiMode
}

export function RenteRetraiteTab({
  inputs,
  decumResult,
  lastRow,
  darkMode,
  updateInput,
  updateInputs,
  runDecum,
  isStale = false,
  running = false,
  progress = 0,
  uiMode = "debutant",
}: RenteRetraiteTabProps) {
  const theme = chartTheme(darkMode)
  const startingCapital = lastRow?.nominal && lastRow.nominal > 0 ? lastRow.nominal : inputs.capitalInitial
  const selectedModel = WITHDRAWAL_MODELS.find(m => m.id === inputs.withdrawalModel) ?? WITHDRAWAL_MODELS[0]
  const envelopeLabel = ENVELOPE_CONFIGS.find(e => e.id === inputs.envelope)?.shortLabel ?? "BRUT"
  const { tr, lang, fmtCurrency } = useLang()
  // Profil (paquet 3) : un repère d'âge dans l'en-tête quand le profil est
  // renseigné — « retraite à X ans, fin de rente à Y ans ».
  const retirementAgeInfo =
    inputs.ageRetirement > inputs.ageNow
      ? `${tr("{n} ans au départ de la retraite", { n: inputs.ageRetirement })} · ${tr("{n} ans à la fin de la rente", {
          n: inputs.ageRetirement + inputs.retirementYears,
        })}`
      : null
  // Le pire repli pic→creux du vivier réellement rejoué (56 ou 100 ans selon
  // l'option), comparé à la tolérance du profil : le verdict « trop risqué »
  // ne dépend que des inputs → il s'affiche en BANDEAU EN HAUT de l'onglet,
  // pas seulement au bas des résultats (audit).
  const worstDrawdown = useMemo(() => {
    const pool = getHistoricalPool(inputs.historicalIndex, inputs.extendedHistory)
    let cap = 1
    let peak = 1
    let worst = 0
    for (const r of pool.returns) {
      cap *= 1 + r
      peak = Math.max(peak, cap)
      worst = Math.max(worst, peak > 0 ? (peak - cap) / peak : 0)
    }
    return worst
  }, [inputs.historicalIndex, inputs.extendedHistory])
  const exceedsRisk = worstDrawdown > inputs.maxDrawdownTolerance

  // Rente mensuelle estimée (avant simulation Monte-Carlo) — affichage instantané
  const estimatedMonthly = useMemo(() => {
    if (inputs.withdrawalModel === "custom") {
      return Math.max(0, inputs.withdrawalFixed)
    }
    return (startingCapital * selectedModel.rate) / 12
  }, [inputs.withdrawalModel, inputs.withdrawalFixed, startingCapital, selectedModel.rate])

  // Note de transparence sur le krach paramétrable, affichée avec les résultats
  const crisisNote = inputs.crisisScenario
    ? tr("Un krach de −{pct} % frappe chaque scénario en année {year} de la retraite (partir en période difficile).", {
        pct: Math.round(inputs.crisisIntensity * 100),
        year: inputs.crisisStartOffset + 1,
      })
    : null

  // Les stress tests historiques sont repliés par défaut : ils ne s'imposent
  // plus à chaque visite, on les ouvre à la demande (v5.6.0).
  const [stressOpen, setStressOpen] = useState(false)

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* ──────────────────────────────────────────────────────────
          En-tête + capital à décumuler
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-3 sm:p-6">
        <div className="flex items-start justify-between mb-4 sm:mb-5 gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <SectionHeader
              as="h2"
              level="page"
              icon={TrendingUp}
              title={tr("Simulation de décaissement & rente")}
              className="mb-2"
            />
            <p className="text-[11px] text-text-dim leading-relaxed max-w-xl">
              {tr("Analysez la soutenabilité de vos retraits sur")}{" "}
              <strong className="text-text">
                {inputs.retirementYears} {tr("ans")}
              </strong>{" "}
              {tr("via une simulation Monte-Carlo.")}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-dim">
              <AlertTriangle size={11} className="text-primary" />
              <span>
                {tr("La rente n'est pas garantie — les performances passées ne préjugent pas des résultats futurs.")}
              </span>
            </div>
            {retirementAgeInfo && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-text-muted">
                <Coins size={11} className="text-text-dim shrink-0" />
                <span>
                  {tr("Profil :")} <strong className="text-text">{retirementAgeInfo}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl px-4 py-3 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins size={11} className="text-text-dim" />
              <span className="text-[10px] text-text-dim uppercase tracking-wider">{tr("Capital à décumuler")}</span>
            </div>
            {/* La simulation démarre du montant BRUT (ce qui est sur le compte
                en fin d'accumulation) : les impôts ne sont prélevés qu'AU
                MOMENT de chaque retrait, proportionnellement à la part de
                gains (audit). Le net après liquidation (tout vendre d'un
                coup) est affiché en repère — il n'est PAS le point de départ. */}
            <div className="mono text-lg sm:text-xl font-bold text-primary leading-tight">
              {fmtCurrency(startingCapital)}
            </div>
            <div className="text-[10px] text-text-dim mt-1">
              {lastRow?.nominal && lastRow.nominal > 0 ? (
                <>
                  {tr("Brut en fin d'accumulation — après impôts de sortie :")}{" "}
                  <strong className="mono text-text">{fmtCurrency(lastRow.taxNet)}</strong>
                </>
              ) : (
                tr("Capital initial (aucune simulation)")
              )}
            </div>
            <div className="text-[9px] text-text-dim mt-1 leading-snug">
              {tr("La rente est calculée sur le brut ; chaque retrait n'est imposé que sur sa part de gains.")}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            Modèle + paramètres (2 colonnes)
           ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Sélecteur de modèle */}
          <div className="lg:col-span-3">
            <SectionHeader level="label">{tr("Modèle de retrait")}</SectionHeader>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {WITHDRAWAL_MODELS.map(model => {
                const isActive = inputs.withdrawalModel === model.id
                const Icon = model.icon
                return (
                  <motion.button
                    key={model.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateInputs({ withdrawalModel: model.id })}
                    className={cn(
                      "relative rounded-xl p-2.5 sm:p-3.5 border text-left transition-all",
                      isActive
                        ? "border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--color-primary-rgb),0.25)]"
                        : "glass border-border hover:bg-glass-hover",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `color-mix(in srgb, ${model.tone} 18%, transparent)`, color: model.tone }}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{tr(model.label)}</span>
                          {isActive && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-text-dim mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
                          {tr(model.desc)}
                        </div>
                        {model.rate > 0 && (
                          <div className="text-[10px] mono text-text-dim mt-1.5">
                            ≈ {fmtCurrency((startingCapital * model.rate) / 12)} / {tr("mois")}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Paramètres */}
          <div className="lg:col-span-2 space-y-3">
            <SectionHeader level="label">{tr("Paramètres")}</SectionHeader>

            {/* Aperçu rente */}
            <div className="card-subtle rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-text-dim uppercase tracking-wider">
                  {tr("Rente mensuelle initiale")}
                </span>
                <span
                  className="text-[10px] mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: `color-mix(in srgb, ${selectedModel.tone} 20%, transparent)`,
                    color: selectedModel.tone,
                  }}
                >
                  {inputs.withdrawalModel === "custom"
                    ? tr("Montant fixe")
                    : fmtPercent(selectedModel.rate * 100, lang)}
                </span>
              </div>

              {inputs.withdrawalModel === "custom" ? (
                <div className="flex items-baseline gap-2 mt-2">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={inputs.withdrawalFixed}
                    onChange={e => updateInput("withdrawalFixed", Math.max(0, Number(e.target.value) || 0))}
                    aria-label={tr("Montant de la rente fixe en euros par mois")}
                    className="mono text-base font-bold bg-glass border border-border rounded-lg px-2 py-1 outline-none focus:border-primary/50 transition-colors w-32"
                  />
                  <span className="text-xs text-text-dim">€ / {tr("mois")}</span>
                </div>
              ) : (
                <div className="mt-1">
                  <div className="mono text-2xl font-bold text-primary leading-none">
                    {fmtCurrency(estimatedMonthly)}
                  </div>
                  <div className="text-[10px] text-text-dim mt-1.5">
                    {tr("soit")} <span className="mono">{fmtCurrency(estimatedMonthly * 12)}</span> / {tr("an")}
                    {inputs.withdrawalInflation && ` · ${tr("indexée sur l'inflation")}`}
                  </div>
                </div>
              )}
            </div>

            {/* Durée de la retraite */}
            <div className="card-subtle rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-text-dim uppercase tracking-wider">{tr("Durée de la rente")}</span>
                <span className="text-xs mono font-bold text-text">
                  {inputs.retirementYears} {tr("ans")}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={inputs.retirementYears}
                onChange={e => updateInput("retirementYears", Number(e.target.value))}
                className="w-full mt-2"
                aria-label={tr("Durée de la rente en années")}
                style={rangeFill(inputs.retirementYears, 5, 60, "var(--color-primary)")}
              />
              <div className="flex justify-between text-[10px] text-text-dim mt-1">
                <span>5 ans</span>
                <span>60 ans</span>
              </div>
            </div>

            {/* Indexation */}
            <button
              type="button"
              onClick={() => updateInput("withdrawalInflation", !inputs.withdrawalInflation)}
              className={cn(
                "w-full flex items-center justify-between glass rounded-xl px-4 py-3 cursor-pointer hover:bg-glass-hover transition-colors text-left",
                inputs.withdrawalInflation && "border border-primary/40",
              )}
              role="switch"
              aria-checked={inputs.withdrawalInflation}
            >
              <div>
                <div className="text-xs font-semibold">{tr("Indexer sur l'inflation")}</div>
                <div className="text-[10px] text-text-dim mt-0.5">
                  {tr("Préserve le pouvoir d'achat")} ({fmtPercent(inputs.inflation, lang)})
                </div>
              </div>
              <div
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-300 flex-shrink-0",
                  inputs.withdrawalInflation ? "toggle-on" : "bg-text-dim/30",
                )}
              >
                <motion.div
                  animate={{ x: inputs.withdrawalInflation ? 18 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute w-4 h-4 bg-white rounded-full top-0.5 shadow-sm"
                />
              </div>{" "}
            </button>

            {/* Partir en période difficile : un krach déterministe choisi par
                l'utilisateur, appliqué à CHAQUE scénario Monte-Carlo. */}
            <div className="glass rounded-xl p-4 border border-warning/20">
              <Toggle
                checked={inputs.crisisScenario}
                onChange={v => updateInput("crisisScenario", v)}
                label={tr("Partir en période difficile")}
                sub={tr("Simule un krach au moment et à l'intensité de votre choix")}
              />
              {inputs.crisisScenario && (
                <div className="mt-3 space-y-3 animate-fade-in border-t border-border/50 pt-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-text-dim uppercase tracking-wider">
                        {tr("Le krach frappe après")}
                      </span>
                      <span className="text-xs mono font-bold text-text">
                        {inputs.crisisStartOffset === 0
                          ? tr("dès le début")
                          : `${inputs.crisisStartOffset} ${tr(inputs.crisisStartOffset > 1 ? "ans" : "an")}`}
                      </span>
                    </div>
                    {/* Le krach doit pouvoir frapper pendant la rente : le
                        curseur est borné par la durée (jamais au-delà de la
                        dernière année). */}
                    {(() => {
                      const maxOffset = Math.max(0, Math.min(10, inputs.retirementYears - 1))
                      return (
                        <>
                          <input
                            type="range"
                            min={0}
                            max={maxOffset}
                            step={1}
                            value={Math.min(inputs.crisisStartOffset, maxOffset)}
                            onChange={e => updateInput("crisisStartOffset", Number(e.target.value))}
                            className="w-full"
                            aria-label={tr("Années avant le krach")}
                            style={rangeFill(
                              Math.min(inputs.crisisStartOffset, maxOffset),
                              0,
                              maxOffset,
                              "var(--color-warning)",
                            )}
                          />
                          <div className="flex justify-between text-[10px] text-text-dim mt-1">
                            <span>{tr("Année 1")}</span>
                            <span>{maxOffset === 0 ? tr("Année 1") : `+${maxOffset} ${tr("ans")}`}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-text-dim uppercase tracking-wider">
                        {tr("Intensité du krach")}
                      </span>
                      <span className="text-xs mono font-bold text-warning">
                        −{Math.round(inputs.crisisIntensity * 100)} %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={5}
                      value={Math.round(inputs.crisisIntensity * 100)}
                      onChange={e => updateInput("crisisIntensity", Number(e.target.value) / 100)}
                      className="w-full"
                      aria-label={tr("Intensité du krach en pourcentage")}
                      style={rangeFill(Math.round(inputs.crisisIntensity * 100), 10, 60, "var(--color-warning)")}
                    />
                    <div className="flex justify-between text-[10px] text-text-dim mt-1">
                      <span>−10 %</span>
                      <span>−60 %</span>
                    </div>
                  </div>
                  <p className="hidden sm:flex text-[9px] text-text-dim leading-snug items-start gap-1">
                    <AlertTriangle size={10} className="shrink-0 mt-0.5 text-warning" />
                    {tr(
                      "Chaque scénario subit cette chute la même année — le « et si le départ tombait en pleine crise ? » appliqué à 100 % des cas, pas seulement au cas pessimiste.",
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Lancer la simulation */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={runDecum}
              disabled={!lastRow || lastRow.nominal <= 0 || running}
              className={cn(
                "w-full rounded-xl py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors",
                lastRow && lastRow.nominal > 0 && !running
                  ? "btn-shine bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary"
                  : "bg-text-dim/20 text-text-dim cursor-not-allowed",
              )}
            >
              <Play size={13} fill="currentColor" />{" "}
              {running ? tr("Calcul... {progress}%", { progress }) : tr("Lancer la simulation Monte-Carlo")}
              {!running && decumResult && <RefreshCw size={11} className="opacity-70" />}
            </motion.button>

            {/* Barre de progression : le calcul est découpé en chunks pour ne
                pas geler l'interface (comme l'onglet Monte Carlo) */}
            {running && (
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-text-dim/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-dim text-right mono">
                  {tr("{progress}% — interface fluide pendant le calcul", { progress })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerte « plan trop risqué » en BANDEAU (audit) : visible dès
          l'ouverture de l'onglet, sans avoir lancé la simulation. */}
      <div
        className={cn(
          "rounded-xl px-3.5 py-2.5 flex items-start gap-2 border",
          exceedsRisk
            ? "bg-warning/8 border-warning/25"
            : "bg-[var(--color-success)]/8 border-[var(--color-success)]/25",
        )}
      >
        {exceedsRisk ? (
          <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck size={13} className="text-[var(--color-success)] shrink-0 mt-0.5" />
        )}
        <p className="text-[10px] leading-relaxed text-text-dim">
          {exceedsRisk ? (
            <>
              <strong className="text-warning">{tr("Tolérance au risque dépassée :")}</strong>{" "}
              {tr("le pire repli historique de votre indice est de")}{" "}
              <strong className="text-warning">−{Math.round(worstDrawdown * 100)} %</strong>
              {tr(", au-delà de votre tolérance de")} −{Math.round(inputs.maxDrawdownTolerance * 100)} %.{" "}
              {tr("Ce plan peut être")} <strong className="text-text">{tr("trop risqué pour vous")}</strong>{" "}
            </>
          ) : (
            <>
              <strong className="text-text">{tr("Risque maîtrisé :")}</strong>{" "}
              {tr("le pire repli historique de votre indice")} (−{Math.round(worstDrawdown * 100)} %)
              {tr("reste dans votre tolérance de")} −{Math.round(inputs.maxDrawdownTolerance * 100)} %.
            </>
          )}
        </p>
      </div>

      {/* Incohérence âge / durée / retraite (audit) : le capital projeté
          s'arrête avant la retraite prévue — l'utilisateur doit le savoir. */}
      {inputs.ageRetirement >= inputs.ageNow && inputs.ageNow + inputs.duration !== inputs.ageRetirement && (
        <div className="rounded-xl bg-primary/8 border border-primary/20 px-3.5 py-2.5 flex items-start gap-2">
          <Coins size={13} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-text-dim">
            {tr("Votre projection s'arrête à")}{" "}
            <strong className="text-text">
              {inputs.ageNow + inputs.duration} {tr("ans")}
            </strong>{" "}
            ({tr("âge actuel")} {inputs.ageNow} + {tr("durée")} {inputs.duration} {tr("ans")}){" "}
            {tr("et votre retraite est prévue à")}{" "}
            <strong className="text-text">
              {inputs.ageRetirement} {tr("ans")}
            </strong>
            . {tr("Le capital à décumuler correspond à")}{" "}
            {inputs.ageNow + inputs.duration < inputs.ageRetirement ? (
              <>
                {tr("un âge")} <strong className="text-warning">{tr("antérieur")}</strong>{" "}
                {tr(
                  "à votre départ — allongez la durée ou avancez la retraite pour que le capital projeté couvre la rente.",
                )}
              </>
            ) : (
              <>
                {tr("un âge")} <strong className="text-warning">{tr("postérieur")}</strong> {tr("à votre départ — les")}{" "}
                {tr("{n} dernières années de projection ne servent pas à la rente.", {
                  n: inputs.ageNow + inputs.duration - inputs.ageRetirement,
                })}
              </>
            )}
          </p>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          Fiabilité & sûreté du modèle (options désactivables).
          Repliée par défaut (v6, comme l'onglet Monte Carlo) : les 4
          options restent actives par défaut, mais elles ne s'imposent
          plus à chaque visite — on les ouvre à la demande.
         ────────────────────────────────────────────────────────── */}
      {uiMode === "avance" && (
        <div className="glass rounded-3xl p-4 sm:p-6">
          <CollapsibleSection
            title={tr("Fiabilité & sûreté des estimations")}
            icon={<ShieldCheck size={12} className="text-primary" />}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <Toggle
                checked={inputs.parameterUncertainty}
                onChange={v => updateInput("parameterUncertainty", v)}
                label={tr("Incertitude des paramètres")}
                sub={tr(
                  "La moyenne et la volatilité du marché sont des estimations, pas des vérités : chaque scénario tire les siennes. Élargit honnêtement le taux de survie.",
                )}
              />
              <Toggle
                checked={inputs.extendedHistory}
                onChange={v => updateInput("extendedHistory", v)}
                label={tr("Historique étendu (100 ans)")}
                sub={tr(
                  "Rejoue 100 ans de rendements réels (1929, 1931, 1933…) au lieu des 56 dernières années : plus de krachs testés.",
                )}
              />
              <Toggle
                checked={inputs.stochasticInflation}
                onChange={v => updateInput("stochasticInflation", v)}
                label={tr("Inflation stochastique")}
                sub={tr(
                  "L'indexation rejoue l'inflation française réelle 1970-2025 (pics à 13,7 % en 1974) au lieu d'un taux fixe.",
                )}
              />
              <Toggle
                checked={inputs.dynamicGuardrails}
                onChange={v => updateInput("dynamicGuardrails", v)}
                label={tr("Garde-fous dynamiques (Guyton–Klinger)")}
                sub={tr(
                  "Après une année boursière négative, la rente de l'année suivante est réduite de 10 % — sauve la majorité des cas de ruine.",
                )}
              />
            </div>
            <p className="text-[9px] text-text-dim mt-2.5">
              {tr(
                "Ces 4 options sont actives par défaut : elles rendent les estimations plus honnêtes (bandes plus larges, taux de survie plus crédibles). Désactivez-les pour comparer avec le comportement historique simple.",
              )}
            </p>
          </CollapsibleSection>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          Résultats de la simulation
         ────────────────────────────────────────────────────────── */}
      {decumResult ? (
        <div className="space-y-3">
          {isStale && (
            <p className="text-[10px] text-warning flex items-center gap-1">
              <AlertTriangle size={11} />{" "}
              {tr("Paramètres modifiés depuis le lancement — relancez la simulation pour mettre à jour les résultats.")}
            </p>
          )}
          <ResultsSection
            decumResult={decumResult}
            theme={theme}
            crisisNote={crisisNote}
            extendedHistory={inputs.extendedHistory}
            inputs={inputs}
            lastRow={lastRow}
            envelopeLabel={envelopeLabel}
          />
        </div>
      ) : (
        <EmptyState hasAccumulation={!!lastRow} />
      )}

      {/* ──────────────────────────────────────────────────────────
          Stress tests déterministes — repliés par défaut : ils ne
          s'affichent plus à chaque visite (demande utilisateur), on les
          ouvre à la demande pour détailler les scénarios réels.
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setStressOpen(v => !v)}
          aria-expanded={stressOpen}
          className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-glass-hover transition-colors text-left"
        >
          <SectionHeader
            bare
            level="card"
            icon={Activity}
            title={
              <>
                {tr("Et si vous partiez en pleine crise ?")}{" "}
                <span className="text-text-dim font-medium">{tr("(scénarios réels 1973 · 2000 · 2008)")}</span>
              </>
            }
            className="flex-1 min-w-0"
          />
          <span className="text-[10px] text-text-dim flex items-center gap-1 shrink-0">
            {stressOpen ? tr("Réduire") : tr("Voir le détail")}
            <ChevronDown size={12} className={cn("transition-transform", stressOpen && "rotate-180")} />
          </span>
        </button>
        {stressOpen && (
          <div className="px-4 sm:px-6 pb-5 animate-fade-in">
            <StressTestsSection
              inputs={inputs}
              startingCapital={startingCapital}
              startingBasis={lastRow?.investedNom && lastRow.investedNom > 0 ? lastRow.investedNom : startingCapital}
              darkMode={darkMode}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Sous-composants
// ───────────────────────────────────────────────────────────

function fmtPercent(v: number, lang: Lang = "fr"): string {
  return `${fmtDecimal(v * 100, 1, lang).replace(/,0$/, "")} %`
}

function fmtPct(v: number, locale = "fr-FR"): string {
  return `${v.toLocaleString(locale, { maximumFractionDigits: 1 })} %`
}

/** Rail de curseur « rempli » (même langage que SliderInput). */
function rangeFill(value: number, min: number, max: number, color: string) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100))
  return {
    background: `linear-gradient(to right, ${color} ${pct}%, color-mix(in srgb, ${color} 10%, transparent) ${pct}%)`,
  }
}

function ResultsSection({
  decumResult,
  theme,
  crisisNote,
  extendedHistory,
  inputs,
  lastRow,
  envelopeLabel,
}: {
  decumResult: DecumulationResult
  theme: ReturnType<typeof chartTheme>
  crisisNote?: string | null
  extendedHistory: boolean
  inputs: SimulationInputs
  lastRow: YearRow | undefined
  envelopeLabel: string
}) {
  const { tr, fmtCurrency, fmtCompact, locale } = useLang()
  const survival = decumResult.survivalProbability
  const survivalTone =
    survival >= 90 ? "var(--color-success)" : survival >= 75 ? "var(--color-primary)" : "var(--color-danger)"
  const survivalLabel = survival >= 90 ? "Excellente" : survival >= 75 ? "Correcte" : "Risquée"
  const ruinYear = decumResult.ruinYearMedian
  const finalMedian = decumResult.p50[decumResult.p50.length - 1] ?? 0
  const finalSurvival = finalMedian > 0
  const success = survival >= 85
  const [showGuide, setShowGuide] = useState(false)
  // Mobile (v6.23) : les explications secondaires sont repliées derrière un
  // bouton — le verdict, les KPI et le graphique restent visibles d'emblée.
  const [detailsOpen, setDetailsOpen] = useState(false)
  const chartRef = useChartA11y(tr("Votre capital pendant la retraite — P10, P50 et P90"))
  const coarse = useIsCoarsePointer()

  // Paquet 2 — rente nette : retraits nets moyens par mois sur toute la
  // retraite (moyenne des années 1..N, divisée par 12).
  const netMonthly =
    decumResult.withdrawalsNet.slice(1).reduce((s, v) => s + v, 0) /
      Math.max(1, decumResult.withdrawalsNet.length - 1) /
      12 || 0
  // Même moyenne sur l'échelle RÉELLE (euros du départ de la retraite) puis
  // ramenée en EUROS D'AUJOURD'HUI par le facteur de déflation de
  // l'accumulation (lastRow.real/nominal) : la comparaison avec des dépenses
  // exprimées en euros d'aujourd'hui devient cohérente (audit).
  const netMonthlyReal =
    decumResult.withdrawalsNetReal.slice(1).reduce((s, v) => s + v, 0) /
      Math.max(1, decumResult.withdrawalsNetReal.length - 1) /
      12 || 0
  const accumulationDeflation = lastRow && lastRow.nominal > 0 ? lastRow.real / lastRow.nominal : 1
  const netMonthlyToday = netMonthlyReal * accumulationDeflation
  // Couverture des dépenses de retraite : rente nette (en euros d'aujourd'hui)
  // + autres pensions vs dépenses prévues (paquet 3).
  const retirementIncome = netMonthlyToday + inputs.otherPensions
  const coverage =
    inputs.retirementExpenses > 0 ? Math.round((retirementIncome / inputs.retirementExpenses) * 100) : null
  const shortfall = inputs.retirementExpenses - retirementIncome

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-3 sm:p-6 space-y-3 sm:space-y-5"
    >
      {/* Verdict global — UNE seule boîte : le constat. Les détails (krach
          simulé, « en clair ») vivent en dessous, à plat — jamais imbriqués. */}
      <div
        className={cn(
          "rounded-2xl p-4 flex items-start gap-3 border",
          success
            ? "bg-[var(--color-success)]/8 border-[var(--color-success)]/30"
            : "bg-[var(--color-danger)]/8 border-[var(--color-danger)]/30",
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            success ? "bg-[var(--color-success)]/20" : "bg-[var(--color-danger)]/20",
          )}
        >
          {success ? (
            <CheckCircle2 size={18} className="text-[var(--color-success)]" />
          ) : (
            <XCircle size={18} className="text-[var(--color-danger)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold">
              {success ? tr("Votre rente est sûre") : tr("Votre rente est risquée")}
            </h3>
            <span
              className="text-[10px] mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: `color-mix(in srgb, ${survivalTone} 20%, transparent)`, color: survivalTone }}
            >
              {tr(survivalLabel)}
            </span>
          </div>
          <p className="text-[11px] text-text-dim mt-1 leading-relaxed">
            {tr("Nous avons rejoué votre plan")}{" "}
            <strong className="text-text">
              {decumResult.runs.toLocaleString(locale)} {tr("fois")}
            </strong>
            {tr(", avec des évolutions de bourse différentes à chaque fois. Résultat : votre rente de")}{" "}
            <strong className="text-text">
              {fmtCurrency(decumResult.initialWithdrawal)} / {tr("mois")}
            </strong>{" "}
            {tr("est payée jusqu'au bout dans")}{" "}
            <strong className={success ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
              {fmtPct(survival, locale)}
            </strong>{" "}
            {tr("des cas.")}
          </p>
        </div>
      </div>

      {/* Mobile : un seul bouton pour les explications secondaires. */}
      <button
        type="button"
        onClick={() => setDetailsOpen(v => !v)}
        aria-expanded={detailsOpen}
        className="lg:hidden w-full inline-flex items-center justify-between gap-2 rounded-xl bg-glass border border-border px-3 py-2.5 text-[11px] font-bold text-text"
      >
        <span className="inline-flex items-center gap-1.5">
          <Lightbulb size={12} className="text-primary" aria-hidden />
          {detailsOpen ? tr("Masquer les détails") : tr("Comprendre ce résultat")}
        </span>
        <ChevronDown size={13} className={cn("transition-transform", detailsOpen && "rotate-180")} aria-hidden />
      </button>

      <div className={cn("space-y-3 sm:space-y-4", detailsOpen ? "block" : "max-lg:hidden")}>
        {/* Krach simulé — à plat sous le verdict (le bloc vert ne contient plus
          de sous-boîtes). M18 — ambre, pas rouge : c'est un réglage CHOISI
          par l'utilisateur (scénario durci), pas une erreur ni un danger
          imprévu. */}
        {crisisNote && (
          <div className="rounded-xl bg-warning/8 border border-warning/20 px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-text-dim">
              <strong className="text-warning">{tr("Krach simulé :")}</strong> {crisisNote}
            </p>
          </div>
        )}

        {/* « En clair » — la version grand public. Ne re-cite PAS le taux de
          survie (déjà dans le verdict + la carte KPI) : il apporte l'info
          « quand l'argent manque » au lieu de répéter le chiffre. */}
        <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 flex items-start gap-2.5">
          <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-text-dim">
            <strong className="text-text">{tr("En clair :")}</strong>{" "}
            {ruinYear !== null ? (
              <>
                {tr("quand un plan échoue, l'argent manque généralement autour de l'année")}{" "}
                <strong className="text-text">{ruinYear}</strong>{" "}
                {tr("— les autres années, la rente est versée sans interruption pendant")}{" "}
                {decumResult.years.length - 1} {tr("ans.")}
              </>
            ) : (
              <>
                {tr("dans")} <strong className="text-text">{tr("100 % des simulations")}</strong>
                {tr(", votre rente est payée jusqu'au bout — et il reste toujours de l'argent à la fin.")}
              </>
            )}
          </p>
        </div>

        {/* Bandeau de fiabilité (v6) : un signal de confiance factuel, en une
          ligne — ce que le taux de survie repose réellement sur. */}
        {/* Bandeau de fiabilité (paquet 2) : la rente applique désormais la
          fiscalité des retraits ET les frais de gestion — on dit la vérité. */}
        <p className="text-[10px] text-text-dim flex items-center gap-1.5 flex-wrap">
          <ShieldCheck size={11} className="text-primary shrink-0" aria-hidden />
          {tr("Basé sur")}{" "}
          <strong className="text-text">
            {decumResult.runs.toLocaleString(locale)} {tr("scénarios")}
          </strong>{" "}
          · {tr(extendedHistory ? "100 ans" : "56 ans")}{" "}
          {tr("d'historique réel · fiscalité des retraits incluse (enveloppe")} {envelopeLabel})
        </p>

        {/* Paquet 2 — la fiscalité des retraits est désormais modélisée : on
          montre la rente NETTE réelle (retraits nets moyens par mois, impôts
          et frais de gestion déduits), au lieu de divulguer une absence. */}
        <div className="rounded-xl bg-glass border border-border px-3 py-2 flex items-start gap-2">
          <Landmark size={12} className="text-text-dim shrink-0 mt-0.5" aria-hidden />
          {inputs.envelope === "none" ? (
            <p className="text-[10px] leading-relaxed text-text-dim">
              <strong className="text-text">{tr("Sans fiscalité :")}</strong>{" "}
              {tr(
                "l'enveloppe choisie est « BRUT » — aucun impôt n'est prélevé sur les retraits. La rente affichée est donc la rente brute.",
              )}
            </p>
          ) : (
            <p className="text-[10px] leading-relaxed text-text-dim">
              <strong className="text-text">{tr("Rente nette :")}</strong>{" "}
              {tr("après impôt sur les retraits (enveloppe")} <strong className="text-text">{envelopeLabel}</strong>
              {tr("), vous recevez en moyenne")}{" "}
              <strong className="text-text">
                {fmtCurrency(Math.round(netMonthly))} / {tr("mois")}
              </strong>{" "}
              ({tr("euros courants")}) — {tr("soit")}{" "}
              <strong className="text-text">
                {fmtCurrency(Math.round(netMonthlyToday))} / {tr("mois")} {tr("en euros d'aujourd'hui")}
              </strong>
              . {tr("Au total :")} <strong className="text-text">{fmtCurrency(decumResult.totalTaxPaid)}</strong>{" "}
              {tr("d'impôts et")} <strong className="text-text">{fmtCurrency(decumResult.totalFeesPaid)}</strong>{" "}
              {tr("de frais de gestion payés pendant toute la retraite (la rente brute reste")}{" "}
              {fmtCurrency(decumResult.initialWithdrawal)}
              {tr("/mois).")}
            </p>
          )}
        </div>

        {/* Paquet 3 — vos revenus de retraite face à vos dépenses (profil).
          Comparaison en EUROS D'AUJOURD'HUI : la rente nette moyenne est
          déflatée (pouvoir d'achat) pour être comparable aux dépenses, que
          l'utilisateur pense dans sa monnaie actuelle (audit). */}
        {(inputs.retirementExpenses > 0 || inputs.otherPensions > 0) && coverage !== null && (
          <div
            className={cn(
              "rounded-xl px-3 py-2 flex items-start gap-2 border",
              coverage >= 100
                ? "bg-[var(--color-success)]/8 border-[var(--color-success)]/25"
                : "bg-warning/8 border-warning/25",
            )}
          >
            {coverage >= 100 ? (
              <CheckCircle2 size={12} className="text-[var(--color-success)] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
            )}
            <p className="text-[10px] leading-relaxed text-text-dim">
              {coverage >= 100 ? (
                <>
                  <strong className="text-text">{tr("Revenus couverts :")}</strong> {tr("votre rente nette")} ({" "}
                  <strong className="text-text">
                    {fmtCurrency(Math.round(netMonthlyToday))}/{tr("mois")}
                  </strong>{" "}
                  {tr("en euros d'aujourd'hui")}) {tr("plus vos autres revenus")} ({" "}
                  <strong className="text-text">
                    {fmtCurrency(inputs.otherPensions)}/{tr("mois")}
                  </strong>
                  ) {tr("couvrent")} <strong className="text-[var(--color-success)]">{coverage} %</strong>{" "}
                  {tr("de vos dépenses prévues")} ( {fmtCurrency(inputs.retirementExpenses)}
                  {tr("/mois).")}
                </>
              ) : (
                <>
                  <strong className="text-text">{tr("Manque à couvrir :")}</strong> {tr("rente nette")} ({" "}
                  <strong className="text-text">
                    {fmtCurrency(Math.round(netMonthlyToday))}/{tr("mois")}
                  </strong>{" "}
                  {tr("en euros d'aujourd'hui")}) + {tr("autres revenus")} ({" "}
                  <strong className="text-text">
                    {fmtCurrency(inputs.otherPensions)}/{tr("mois")}
                  </strong>
                  ) ={" "}
                  <strong className="text-text">
                    {fmtCurrency(Math.round(retirementIncome))}/{tr("mois")}
                  </strong>
                  , {tr("soit")} <strong className="text-text">{coverage} %</strong> {tr("de vos dépenses prévues")} ({" "}
                  {fmtCurrency(inputs.retirementExpenses)}
                  {tr("/mois) — il manque")}{" "}
                  <strong className="text-warning">
                    {fmtCurrency(Math.round(Math.max(0, shortfall)))}/{tr("mois")}
                  </strong>
                  .
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* 4 KPI cards */}
      <p className="text-[10px] text-text-dim italic">
        {tr("Montants en")} <strong className="text-text not-italic">{tr("euros courants")}</strong> (
        {tr("non corrigés de l'inflation")}) —{" "}
        {tr("l'accumulation affichait les deux échelles, le décaissement est projeté en valeur nominale du compte.")}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label={tr("Votre rente")}
          value={fmtCurrency(decumResult.initialWithdrawal)}
          sub={
            inputs.envelope === "none"
              ? tr("par mois, pendant {n} ans (brute, sans fiscalité)", { n: decumResult.years.length - 1 })
              : tr("par mois (brute) — net ≈ {n}/mois après impôt", { n: fmtCurrency(Math.round(netMonthly)) })
          }
          tone="var(--color-primary)"
        />
        <KpiCard
          label={tr("La rente dure-t-elle ?")}
          value={fmtPct(survival, locale)}
          sub={tr("≈ {n} cas sur 100", { n: Math.round(survival) })}
          tone={survivalTone}
          gauge={survival / 100}
        />
        <KpiCard
          label={tr("Capital épuisé (si échec)")}
          value={ruinYear !== null ? tr("Année {n}", { n: ruinYear }) : tr("Jamais")}
          sub={
            ruinYear !== null
              ? tr("l'argent manque vers l'année {n} dans les cas défavorables", { n: ruinYear })
              : tr("le capital résiste dans 100 % des cas")
          }
          tone={ruinYear !== null ? "var(--color-danger)" : "var(--color-success)"}
        />
        <KpiCard
          label={tr("Capital restant")}
          value={fmtCurrency(finalMedian)}
          sub={tr("reste à la fin dans le scénario moyen (sur {n} ans)", { n: decumResult.years.length - 1 })}
          tone={finalSurvival ? "var(--color-success)" : "var(--color-danger)"}
        />
      </div>

      {/* Précision du taux de survie : un point, pas une vérité */}
      <div className="rounded-xl bg-glass border border-border px-3 py-2 flex items-start gap-2">
        <HelpCircle size={12} className="text-text-dim shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-text-dim">
          {tr("Ce taux de survie n'est pas un point exact : sur")} {decumResult.runs.toLocaleString(locale)}{" "}
          {tr("simulations, il se situe en réalité entre")}{" "}
          <strong className="text-text">
            {fmtPct(decumResult.survivalRateCI.low, locale)} {tr("et")}{" "}
            {fmtPct(decumResult.survivalRateCI.high, locale)}
          </strong>{" "}
          ({tr("intervalle de confiance à 95 %")}). {tr("La moyenne des capitaux finaux")} ({" "}
          <strong className="text-text">{fmtCurrency(decumResult.mean)}</strong>){" "}
          {tr("est tirée par quelques cas très chanceux — planifiez sur la médiane.")}
        </p>
      </div>

      {/* Histogramme des issues terminales : la queue de chance visible */}
      {decumResult.terminalDistribution.length > 0 && (
        <div className="card-subtle rounded-2xl p-4">
          <SectionHeader
            as="h3"
            level="card"
            icon={BarChart3}
            title={tr("Distribution des capitaux finaux")}
            className="mb-3 px-1"
            trailing={<span className="text-[10px] text-text-dim">{tr("0 € = capital épuisé")}</span>}
          />
          <TerminalHistogram
            bins={decumResult.terminalDistribution}
            mean={decumResult.mean}
            median={finalMedian}
            format={fmtCurrency}
            highlightRuin
            leftNote={tr("0 € = rente stoppée")}
          />
        </div>
      )}

      {/* Graphique */}
      {decumResult.years.length > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-4">
          <SectionHeader
            as="h3"
            level="card"
            icon={TrendingUp}
            title={tr("Votre capital, année après année")}
            className="mb-2 px-1"
            trailing={
              <button
                type="button"
                onClick={() => setShowGuide(v => !v)}
                className={cn(
                  "text-[10px] text-text-dim hover:text-text inline-flex items-center gap-1 transition-colors",
                  showGuide && "text-primary",
                )}
              >
                <HelpCircle size={11} /> {tr("Comment lire ?")}
                <ChevronDown size={11} className={cn("transition-transform", showGuide && "rotate-180")} />
              </button>
            }
          />
          <p className="text-[10px] text-text-dim mb-2 px-1">
            {decumResult.runs.toLocaleString(locale)}{" "}
            {tr("évolutions de bourse différentes testées · chaque ligne est un cas possible")}
          </p>

          {showGuide && (
            <div className="mb-3 rounded-xl bg-glass border border-border p-3 sm:p-4 text-[11px] text-text-dim leading-relaxed space-y-2">
              <p>
                <strong className="text-text">{tr("Pourquoi ce graphique ?")}</strong>{" "}
                {tr("Personne ne peut prédire l'avenir de la bourse. Nous avons donc rejoué votre plan")}{" "}
                {decumResult.runs.toLocaleString(locale)}{" "}
                {tr("fois, avec des évolutions différentes, pour voir dans quels cas votre argent dure jusqu'au bout.")}
              </p>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>
                  <strong className="text-primary">{tr("Ligne dorée (scénario moyen)")}</strong> :{" "}
                  {tr(
                    "le cas le plus courant. Une fois sur deux, votre résultat est meilleur ; une fois sur deux, il est moins bon.",
                  )}
                </li>
                <li>
                  <strong className="text-text">{tr("Zone jaune pâle")}</strong> :{" "}
                  {tr(
                    "votre vrai résultat se situera probablement quelque part entre la ligne verte et la ligne rouge.",
                  )}
                </li>
                <li>
                  <strong className="text-[var(--color-success)]">{tr("Ligne verte (bonne période de bourse)")}</strong>{" "}
                  : {tr("la bourse vous sourit. Seul 1 cas sur 10 fait encore mieux.")}
                </li>
                <li>
                  <strong className="text-[var(--color-danger)]">{tr("Ligne rouge (période difficile)")}</strong> :{" "}
                  {tr("la bourse est décevante. Seul 1 cas sur 10 fait encore moins bien.")}
                </li>
                <li>
                  <strong className="text-text">{tr("Quand une ligne touche 0 €")}</strong> :{" "}
                  {tr("dans ce scénario, tout le capital a été dépensé avant la fin — la rente s'arrête.")}
                </li>
              </ul>
              <p className="italic text-[10px]">
                {tr(
                  "Astuce : regardez surtout si la ligne rouge tient jusqu'à la fin de votre retraite. Si oui, votre plan résiste même quand la bourse est mauvaise.",
                )}
              </p>
            </div>
          )}
          <div ref={chartRef} className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                margin={{ top: 10, right: 16, bottom: 8, left: 8 }}
                data={decumResult.years.map((y, i) => {
                  const p10 = decumResult.p10[i] ?? 0
                  const p50 = decumResult.p50[i] ?? 0
                  const p90 = decumResult.p90[i] ?? 0
                  return {
                    year: y === 0 ? tr("Aujourd'hui") : `+${y}`,
                    p10,
                    p90,
                    médian: p50,
                    bande: [p10, p90],
                  }
                })}
              >
                <defs>
                  <linearGradient id="bandGradientRente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: theme.tick, fontSize: 11 }}
                  interval={Math.max(0, Math.floor(decumResult.years.length / 10))}
                />
                <YAxis tick={{ fill: theme.tick, fontSize: 11 }} tickFormatter={(v: number) => fmtCompact(v)} />
                <Tooltip
                  trigger={coarse ? "click" : "hover"}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="glass-strong rounded-xl p-3 shadow-premium min-w-[200px]">
                        <div className="text-[10px] text-text-dim uppercase tracking-wider mb-2">
                          {label === tr("Aujourd'hui") ? tr("Aujourd'hui") : `${label} ${tr("ans")}`}
                        </div>
                        {payload
                          .filter(entry => entry.name !== tr("Fourchette (pire – meilleur cas)"))
                          .map((entry, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                              <span className="text-[11px] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                                {entry.name}
                              </span>
                              <span className="mono text-[11px] font-bold" style={{ color: entry.color }}>
                                {fmtCurrency(entry.value as number)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bande"
                  name={tr("Fourchette (pire – meilleur cas)")}
                  stroke="none"
                  fill="url(#bandGradientRente)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="p90"
                  name={tr("Bonne période de bourse (P90)")}
                  stroke="var(--color-success)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="médian"
                  name={tr("Scénario moyen (P50)")}
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p10"
                  name={tr("Période difficile (P10)")}
                  stroke="var(--color-danger)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <ReferenceLine y={0} stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="2 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Légende simplifiée — langage débutant */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] leading-snug">
            <LegendItem
              color="var(--color-success)"
              label={tr("Bonne période de bourse (P90)")}
              desc={tr("La bourse vous sourit — seul 1 cas sur 10 fait encore mieux")}
            />
            <LegendItem
              color="var(--color-primary)"
              label={tr("Scénario moyen (P50)")}
              desc={tr("Le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien")}
            />
            <LegendItem
              color="var(--color-danger)"
              label={tr("Période difficile (P10)")}
              desc={tr("La bourse est décevante — seul 1 cas sur 10 fait encore moins bien")}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  tone,
  gauge,
}: {
  label: string
  value: string
  sub?: string
  tone: string
  gauge?: number
}) {
  return (
    <div className="card-subtle rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <div className="mono text-lg sm:text-xl font-bold leading-tight" style={{ color: tone }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-text-dim mt-1.5">{sub}</div>}
      {gauge !== undefined && (
        <div className="mt-2 h-2 rounded-full bg-text-dim/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.round(gauge * 100)}%`, background: tone }}
          />
        </div>
      )}
    </div>
  )
}

function LegendItem({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 px-1">
      <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: color }} />
      <div>
        <div className="font-bold text-text">{label}</div>
        <div className="text-text-dim">{desc}</div>
      </div>
    </div>
  )
}

function EmptyState({ hasAccumulation }: { hasAccumulation: boolean }) {
  const { tr } = useLang()
  return (
    <div className="glass rounded-3xl p-8 sm:p-12 border border-dashed border-border">
      <div className="max-w-md mx-auto text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <TrendingUp size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold">{tr("Lancez la simulation Monte-Carlo")}</h3>
        <p className="text-[11px] text-text-dim leading-relaxed">
          {hasAccumulation
            ? tr(
                "Analysez sur des centaines de scénarios stochastiques la viabilité de votre stratégie de décaissement.",
              )
            : tr(
                "Commencez par simuler une phase d'accumulation dans l'onglet Simulateur pour disposer d'un capital à décumuler.",
              )}
        </p>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Stress tests déterministes — « et si vous partiez en pleine
// crise ? »  Les trois périodes noires du passé sont rejouées
// telles quelles (aucun hasard) : on voit ce que la rente
// devient vraiment quand le départ tombe pile dessus.
// ───────────────────────────────────────────────────────────
function StressTestsSection({
  inputs,
  startingCapital,
  startingBasis,
  darkMode,
}: {
  inputs: SimulationInputs
  startingCapital: number
  startingBasis: number
  darkMode: boolean
}) {
  const { tr } = useLang()
  const results = useMemo(() => {
    if (startingCapital <= 0) return []
    return STRESS_TEST_SCENARIOS.map(scenario => ({
      scenario,
      result: runStressTest(inputs, startingCapital, scenario, startingBasis),
    }))
  }, [inputs, startingCapital, startingBasis])

  if (results.length === 0) return null

  return (
    <div className="pt-2">
      <p className="text-[10px] text-text-dim leading-relaxed mb-3">
        {tr(
          "Les trois pires fenêtres réelles, rejouées telles quelles : mêmes rendements, même inflation, mêmes garde-fous.",
        )}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {results.map(({ scenario, result }) => (
          <StressTestCard key={scenario.id} scenario={scenario} result={result} darkMode={darkMode} />
        ))}
      </div>
    </div>
  )
}

function StressTestCard({
  scenario,
  result,
  darkMode,
}: {
  scenario: (typeof STRESS_TEST_SCENARIOS)[number]
  result: StressTestResult
  darkMode: boolean
}) {
  const { tr, fmtCurrency, fmtDecimal } = useLang()
  const [open, setOpen] = useState(false)
  const survived = result.survived
  const ruinYear = result.ruinYear
  const drawdown = result.worstDrawdown
  const theme = useMemo(() => chartTheme(darkMode), [darkMode])

  return (
    <div className="glass rounded-2xl p-4 space-y-2.5" style={{ borderTop: `3px solid ${scenario.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-bold">{scenario.label}</div>
        </div>
        <span
          className={cn(
            "text-[9px] mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
            survived
              ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
              : "bg-[var(--color-danger)]/20 text-[var(--color-danger)]",
          )}
        >
          {survived ? tr("Survit") : tr("Épuisé")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-glass p-2">
          <div className="text-[9px] text-text-dim uppercase tracking-wider">{tr("Capital final")}</div>
          <div
            className={cn(
              "mono text-xs font-bold",
              survived ? "text-[var(--color-success)]" : "text-[var(--color-danger)]",
            )}
          >
            {survived ? fmtCurrency(result.finalCapital) : tr("0 €")}
          </div>
        </div>
        <div className="rounded-xl bg-glass p-2">
          <div className="text-[9px] text-text-dim uppercase tracking-wider">{tr("Perte max")}</div>
          <div className="mono text-xs font-bold text-[var(--color-danger)]">
            −{Math.round(drawdown * 100)}%{" "}
            <span className="text-[9px] text-text-dim font-normal">{tr("(pic → creux)")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-text-dim">
        <span>
          {ruinYear !== null
            ? tr("Rente stoppée en {n}", { n: result.scenario.startYear + (ruinYear ?? 0) - 1 })
            : tr("Rente versée jusqu'au bout")}
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 hover:text-text transition-colors"
        >
          {tr("Voir le détail")} <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-border/60 pt-2.5">
          <div className="flex items-center gap-2 text-[9px] text-text-dim">
            <span>{tr("Rendements réels rejoués :")}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.windowReturns.map(({ year, return: r }) => (
              <span
                key={year}
                title={`${year} : ${fmtDecimal(r * 100, 1)} %`}
                className={cn(
                  "mono text-[9px] px-1 py-0.5 rounded",
                  r >= 0
                    ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                    : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
                )}
              >
                {year} {fmtDecimal(r * 100, 1)} %
              </span>
            ))}
          </div>
          <div className="mt-1 space-y-1 text-[9px] text-text-dim">
            <div className="flex justify-between">
              <span>{tr("Capital le plus bas")}</span>
              <span className="mono font-bold text-text">{fmtCurrency(result.minCapital)}</span>
            </div>
            <div className="flex justify-between">
              <span>{tr("Total retiré sur la période")}</span>
              <span className="mono font-bold text-text">{fmtCurrency(result.totalWithdrawn)}</span>
            </div>
          </div>
          {/* Mini-graphique du capital */}
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={result.yearsPath.map((v, i) => ({ y: i, v }))}
                margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={scenario.color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <ReferenceLine y={0} stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="2 2" />
                <XAxis dataKey="y" hide />
                <YAxis hide domain={[0, "auto"]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
