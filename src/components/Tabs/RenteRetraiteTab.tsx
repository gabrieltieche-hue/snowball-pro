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

import { fmtCurrency, fmtCompact, fmtDecimal, runStressTest, STRESS_TEST_SCENARIOS } from "../../engine"
import { chartTheme } from "../../utils/chartTheme"
import { cn } from "@/utils/cn"
import { useChartA11y } from "../../hooks/useChartA11y"
import { useIsCoarsePointer } from "../../hooks/useIsCoarsePointer"
import { Toggle } from "../shared/Toggle"
import { SectionHeader } from "../shared/SectionHeader"
import { TerminalHistogram } from "../Simulation/TerminalHistogram"

import type { DecumulationResult, SimulationInputs, StressTestResult, WithdrawalModel, YearRow } from "../../types"

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
    tone: "#4ADE80",
  },
  {
    id: "ultra-safe",
    label: "Très prudent",
    desc: "Retrait conservateur de 2,5 %/an",
    rate: 0.025,
    icon: PiggyBank,
    tone: "#60A5FA",
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
}: RenteRetraiteTabProps) {
  const theme = chartTheme(darkMode)
  const startingCapital = lastRow?.nominal && lastRow.nominal > 0 ? lastRow.nominal : inputs.capitalInitial
  const selectedModel = WITHDRAWAL_MODELS.find(m => m.id === inputs.withdrawalModel) ?? WITHDRAWAL_MODELS[0]

  // Rente mensuelle estimée (avant simulation Monte-Carlo) — affichage instantané
  const estimatedMonthly = useMemo(() => {
    if (inputs.withdrawalModel === "custom") {
      return Math.max(0, inputs.withdrawalFixed)
    }
    return (startingCapital * selectedModel.rate) / 12
  }, [inputs.withdrawalModel, inputs.withdrawalFixed, startingCapital, selectedModel.rate])

  // Aperçu comparatif (toujours affiché, basé sur le capital)
  const comparisonRates = [0.025, 0.04, 0.055]

  // Note de transparence sur le krach paramétrable, affichée avec les résultats
  const crisisNote = inputs.crisisScenario
    ? `Un krach de −${Math.round(inputs.crisisIntensity * 100)} % frappe chaque scénario en année ${
        inputs.crisisStartOffset + 1
      } de la retraite (partir en période difficile).`
    : null

  // Les stress tests historiques sont repliés par défaut : ils ne s'imposent
  // plus à chaque visite, on les ouvre à la demande (v5.6.0).
  const [stressOpen, setStressOpen] = useState(false)

  return (
    <div className="space-y-5">
      {/* ──────────────────────────────────────────────────────────
          En-tête + capital à décumuler
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-4 sm:p-6">
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <SectionHeader
              as="h2"
              level="page"
              icon={TrendingUp}
              title="Simulation de décaissement & rente"
              className="mb-2"
            />
            <p className="text-[11px] text-text-dim leading-relaxed max-w-xl">
              Analysez la soutenabilité de vos retraits sur{" "}
              <strong className="text-text">{inputs.retirementYears} ans</strong> via une simulation Monte-Carlo.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-dim">
              <AlertTriangle size={11} className="text-primary" />
              <span>La rente n'est pas garantie — les performances passées ne préjugent pas des résultats futurs.</span>
            </div>
          </div>

          <div className="glass rounded-2xl px-4 py-3 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins size={11} className="text-text-dim" />
              <span className="text-[10px] text-text-dim uppercase tracking-wider">Capital à décumuler</span>
            </div>
            <div className="mono text-lg sm:text-xl font-bold text-primary leading-tight">
              {fmtCurrency(startingCapital)}
            </div>
            <div className="text-[10px] text-text-dim mt-1">
              {lastRow?.nominal && lastRow.nominal > 0
                ? `Nominal en fin d'accumulation`
                : `Capital initial (aucune simulation)`}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            Modèle + paramètres (2 colonnes)
           ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Sélecteur de modèle */}
          <div className="lg:col-span-3">
            <SectionHeader level="label">Modèle de retrait</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {WITHDRAWAL_MODELS.map(model => {
                const isActive = inputs.withdrawalModel === model.id
                const Icon = model.icon
                return (
                  <motion.button
                    key={model.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateInputs({ withdrawalModel: model.id })}
                    className={cn(
                      "relative rounded-xl p-3.5 border text-left transition-all",
                      isActive
                        ? "border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--color-primary-rgb),0.25)]"
                        : "glass border-border hover:bg-glass-hover",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${model.tone}18`, color: model.tone }}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{model.label}</span>
                          {isActive && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5 leading-snug">{model.desc}</div>
                        {model.rate > 0 && (
                          <div className="text-[10px] mono text-text-dim mt-1.5">
                            ≈ {fmtCurrency((startingCapital * model.rate) / 12)} / mois
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Guide de choix : comble le vide sous les modèles (colonne
                gauche) et aide à choisir le bon taux de retrait. */}
            <div className="mt-3 rounded-xl bg-primary/8 border border-primary/20 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={12} className="text-primary shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Quel modèle choisir ?
                </span>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">
                La <strong className="text-text">règle des 4 %</strong> est le standard historique (Bengen) : elle a
                tenu sur toutes les périodes de 30 ans testées.{" "}
                <strong className="text-text">Très prudent</strong> sacrifie du confort pour la sécurité, pendant que{" "}
                <strong className="text-text">Optimiste</strong> convient si vous pouvez réduire vos retraits les
                mauvaises années. Le mode <strong className="text-text">Personnalisé</strong> teste le montant exact
                que vous visez.
              </p>
            </div>
          </div>

          {/* Paramètres */}
          <div className="lg:col-span-2 space-y-3">
            <SectionHeader level="label">Paramètres</SectionHeader>

            {/* Aperçu rente */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-text-dim uppercase tracking-wider">Rente mensuelle initiale</span>
                <span
                  className="text-[10px] mono font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${selectedModel.tone}20`, color: selectedModel.tone }}
                >
                  {inputs.withdrawalModel === "custom"
                    ? "FIXE"
                    : `${fmtDecimal(selectedModel.rate * 100, 1).replace(/,0$/, "")} %`}
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
                    aria-label="Montant de la rente fixe en euros par mois"
                    className="mono text-base font-bold bg-glass border border-border rounded-lg px-2 py-1 outline-none focus:border-primary/50 transition-colors w-32"
                  />
                  <span className="text-xs text-text-dim">€ / mois</span>
                </div>
              ) : (
                <div className="mt-1">
                  <div className="mono text-2xl font-bold text-primary leading-none">
                    {fmtCurrency(estimatedMonthly)}
                  </div>
                  <div className="text-[10px] text-text-dim mt-1.5">
                    soit <span className="mono">{fmtCurrency(estimatedMonthly * 12)}</span> / an
                    {inputs.withdrawalInflation && " · indexée sur l'inflation"}
                  </div>
                </div>
              )}
            </div>

            {/* Durée de la retraite */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-text-dim uppercase tracking-wider">Durée de la rente</span>
                <span className="text-xs mono font-bold text-text">{inputs.retirementYears} ans</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={inputs.retirementYears}
                onChange={e => updateInput("retirementYears", Number(e.target.value))}
                className="w-full mt-2"
                aria-label="Durée de la rente en années"
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
                <div className="text-xs font-semibold">Indexer sur l'inflation</div>
                <div className="text-[10px] text-text-dim mt-0.5">
                  Préserve le pouvoir d'achat ({fmtPercent(inputs.inflation)})
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
            <div className="glass rounded-xl p-4 border border-danger/20">
              <Toggle
                checked={inputs.crisisScenario}
                onChange={v => updateInput("crisisScenario", v)}
                label="Partir en période difficile"
                sub="Simule un krach au moment et à l'intensité de votre choix"
              />
              {inputs.crisisScenario && (
                <div className="mt-3 space-y-3 animate-fade-in border-t border-border/50 pt-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-text-dim uppercase tracking-wider">Le krach frappe après</span>
                      <span className="text-xs mono font-bold text-text">
                        {inputs.crisisStartOffset === 0
                          ? "dès le début"
                          : `${inputs.crisisStartOffset} an${inputs.crisisStartOffset > 1 ? "s" : ""}`}
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
                            aria-label="Années avant le krach"
                            style={rangeFill(Math.min(inputs.crisisStartOffset, maxOffset), 0, maxOffset, "var(--color-danger)")}
                          />
                          <div className="flex justify-between text-[10px] text-text-dim mt-1">
                            <span>Année 1</span>
                            <span>{maxOffset === 0 ? "Année 1" : `+${maxOffset} ans`}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-text-dim uppercase tracking-wider">Intensité du krach</span>
                      <span className="text-xs mono font-bold text-danger">
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
                      aria-label="Intensité du krach en pourcentage"
                      style={rangeFill(Math.round(inputs.crisisIntensity * 100), 10, 60, "var(--color-danger)")}
                    />
                    <div className="flex justify-between text-[10px] text-text-dim mt-1">
                      <span>−10 %</span>
                      <span>−60 %</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-text-dim leading-snug flex items-start gap-1">
                    <AlertTriangle size={10} className="shrink-0 mt-0.5 text-danger" />
                    Chaque scénario subit cette chute la même année — le « et si le départ tombait en pleine crise ? »
                    appliqué à 100 % des cas, pas seulement au cas pessimiste.
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
              {running ? `Calcul... ${progress}%` : "Lancer la simulation Monte-Carlo"}
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
                  {progress}% — interface fluide pendant le calcul
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          Fiabilité & sûreté du modèle (options désactivables)
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-4 sm:p-6">
        <SectionHeader as="h3" level="card" icon={ShieldCheck} title="Fiabilité & sûreté des estimations" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <Toggle
            checked={inputs.parameterUncertainty}
            onChange={v => updateInput("parameterUncertainty", v)}
            label="Incertitude des paramètres"
            sub="La moyenne et la volatilité du marché sont des estimations, pas des vérités : chaque scénario tire les siennes. Élargit honnêtement le taux de survie."
          />
          <Toggle
            checked={inputs.extendedHistory}
            onChange={v => updateInput("extendedHistory", v)}
            label="Historique étendu (100 ans)"
            sub="Rejoue 100 ans de rendements réels (1929, 1931, 1933…) au lieu des 56 dernières années : plus de krachs testés."
          />
          <Toggle
            checked={inputs.stochasticInflation}
            onChange={v => updateInput("stochasticInflation", v)}
            label="Inflation stochastique"
            sub="L'indexation rejoue l'inflation française réelle 1970-2025 (pics à 13,7 % en 1974) au lieu d'un taux fixe."
          />
          <Toggle
            checked={inputs.dynamicGuardrails}
            onChange={v => updateInput("dynamicGuardrails", v)}
            label="Garde-fous dynamiques (Guyton–Klinger)"
            sub="Après une année boursière négative, la rente de l'année suivante est réduite de 10 % — sauve la majorité des cas de ruine."
          />
        </div>
        <p className="text-[9px] text-text-dim mt-2.5">
          Ces 4 options sont actives par défaut : elles rendent les estimations plus honnêtes (bandes plus larges, taux
          de survie plus crédibles). Désactivez-les pour comparer avec le comportement historique simple.
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────
          Résultats de la simulation
         ────────────────────────────────────────────────────────── */}
      {decumResult ? (
        <div className="space-y-3">
          {isStale && (
            <p className="text-[10px] text-warning flex items-center gap-1">
              <AlertTriangle size={11} /> Paramètres modifiés depuis le lancement — relancez la simulation pour mettre à
              jour les résultats.
            </p>
          )}
          <ResultsSection decumResult={decumResult} theme={theme} crisisNote={crisisNote} />
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
                Et si vous partiez en pleine crise ?{" "}
                <span className="text-text-dim font-medium">(scénarios réels 1973 · 2000 · 2008)</span>
              </>
            }
            className="flex-1 min-w-0"
          />
          <span className="text-[10px] text-text-dim flex items-center gap-1 shrink-0">
            {stressOpen ? "Réduire" : "Voir le détail"}
            <ChevronDown size={12} className={cn("transition-transform", stressOpen && "rotate-180")} />
          </span>
        </button>
        {stressOpen && (
          <div className="px-4 sm:px-6 pb-5 animate-fade-in">
            <StressTestsSection inputs={inputs} startingCapital={startingCapital} darkMode={darkMode} />
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          Comparatif rapide : 3 taux
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-4 sm:p-6">
        <SectionHeader
          as="h3"
          level="card"
          icon={Sparkles}
          title="Aperçu — rente possible selon le taux de retrait"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comparisonRates.map(rate => {
            const monthly = (startingCapital * rate) / 12
            const yearly = monthly * 12
            const isCurrent = Math.abs(selectedModel.rate - rate) < 0.0001
            const tone = rate <= 0.025 ? "#60A5FA" : rate <= 0.04 ? "#4ADE80" : "var(--color-primary)"
            const label = rate <= 0.025 ? "Très prudent" : rate <= 0.04 ? "Équilibré (Bengen)" : "Dynamique"
            return (
              <div
                key={rate}
                className={cn("glass rounded-2xl p-4 transition-all", isCurrent && "ring-1 ring-primary/60")}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider">
                    Taux {fmtDecimal(rate * 100, 1).replace(/,0$/, "")} %
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] mono font-bold text-primary uppercase tracking-wider">Actuel</span>
                  )}
                </div>
                <div className="mono text-lg sm:text-xl font-bold" style={{ color: tone }}>
                  {fmtCurrency(monthly)}
                  <span className="text-[10px] text-text-dim font-normal"> / mois</span>
                </div>
                <div className="text-[10px] text-text-dim mt-1.5">
                  <span className="mono">{fmtCurrency(yearly)}</span> / an · {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Sous-composants
// ───────────────────────────────────────────────────────────

function fmtPercent(v: number): string {
  return `${fmtDecimal(v * 100, 1).replace(/,0$/, "")} %`
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
}: {
  decumResult: DecumulationResult
  theme: ReturnType<typeof chartTheme>
  crisisNote?: string | null
}) {
  const survival = decumResult.survivalProbability
  const survivalTone = survival >= 90 ? "#4ADE80" : survival >= 75 ? "var(--color-primary)" : "#F87171"
  const survivalLabel = survival >= 90 ? "Excellente" : survival >= 75 ? "Correcte" : "Risquée"
  const ruinYear = decumResult.ruinYearMedian
  const finalMedian = decumResult.p50[decumResult.p50.length - 1] ?? 0
  const finalSurvival = finalMedian > 0
  const success = survival >= 85
  const [showGuide, setShowGuide] = useState(false)
  const chartRef = useChartA11y("Votre capital pendant la retraite — P10, P50 et P90")
  const coarse = useIsCoarsePointer()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-3xl p-4 sm:p-6 space-y-5"
    >
      {/* Verdict global */}
      <div
        className={cn(
          "rounded-2xl p-4 flex items-start gap-3 border",
          success ? "bg-[#4ADE80]/8 border-[#4ADE80]/30" : "bg-[#F87171]/8 border-[#F87171]/30",
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            success ? "bg-[#4ADE80]/20" : "bg-[#F87171]/20",
          )}
        >
          {success ? (
            <CheckCircle2 size={18} className="text-[#4ADE80]" />
          ) : (
            <XCircle size={18} className="text-[#F87171]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold">{success ? "Votre rente est sûre" : "Votre rente est risquée"}</h3>
            <span
              className="text-[10px] mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: `${survivalTone}20`, color: survivalTone }}
            >
              {survivalLabel}
            </span>
          </div>
          <p className="text-[11px] text-text-dim mt-1 leading-relaxed">
            Nous avons rejoué votre plan{" "}
            <strong className="text-text">{decumResult.runs.toLocaleString("fr-FR")} fois</strong>, avec des évolutions
            de bourse différentes à chaque fois. Résultat : votre rente de{" "}
            <strong className="text-text">{fmtCurrency(decumResult.initialWithdrawal)} / mois</strong> est payée
            jusqu'au bout dans{" "}
            <strong className={success ? "text-[#4ADE80]" : "text-[#F87171]"}>{fmtPct(survival)}</strong> des cas.
          </p>
          {crisisNote && (
            <div className="mt-2 rounded-xl bg-danger/8 px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={13} className="text-danger shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-text-dim">
                <strong className="text-danger">Krach simulé :</strong> {crisisNote}
              </p>
            </div>
          )}
          <div className="mt-2 rounded-xl bg-primary/8 px-3 py-2 flex items-start gap-2">
            <Lightbulb size={13} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-text-dim">
              <strong className="text-text">En clair :</strong>{" "}
              {ruinYear !== null ? (
                <>
                  sur <strong className="text-text">100 personnes dans votre situation</strong>, environ{" "}
                  <strong className="text-[#4ADE80]">{Math.round(survival)}</strong> touchent leur rente pendant{" "}
                  {decumResult.years.length - 1} ans sans manquer d'argent. Pour les quelques cas d'échec, l'argent
                  manque généralement autour de l'année {ruinYear}.
                </>
              ) : (
                <>
                  dans <strong className="text-text">100 % des simulations</strong>, votre rente est payée jusqu'au bout
                  — et il reste toujours de l'argent à la fin.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 4 KPI cards */}
      <p className="text-[10px] text-text-dim italic">
        Montants en <strong className="text-text not-italic">euros courants</strong> (non corrigés de l'inflation) —
        l'accumulation affichait les deux échelles, le décaissement est projeté en valeur nominale du compte.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Votre rente"
          value={fmtCurrency(decumResult.initialWithdrawal)}
          sub={`par mois, pendant ${decumResult.years.length - 1} ans`}
          tone="var(--color-primary)"
        />
        <KpiCard
          label="La rente dure-t-elle ?"
          value={fmtPct(survival)}
          sub={`≈ ${Math.round(survival)} cas sur 100`}
          tone={survivalTone}
          gauge={survival / 100}
        />
        <KpiCard
          label="Capital épuisé (si échec)"
          value={ruinYear !== null ? `Année ${ruinYear}` : "Jamais"}
          sub={
            ruinYear !== null
              ? `l'argent manque vers l'année ${ruinYear} dans les cas défavorables`
              : "le capital résiste dans 100 % des cas"
          }
          tone={ruinYear !== null ? "#F87171" : "#4ADE80"}
        />
        <KpiCard
          label="Capital restant"
          value={fmtCurrency(finalMedian)}
          sub={`reste à la fin dans le scénario moyen (sur ${decumResult.years.length - 1} ans)`}
          tone={finalSurvival ? "#4ADE80" : "#F87171"}
        />
      </div>

      {/* Précision du taux de survie : un point, pas une vérité */}
      <div className="rounded-xl bg-glass border border-border px-3 py-2 flex items-start gap-2">
        <HelpCircle size={12} className="text-text-dim shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-text-dim">
          Ce « {fmtPct(survival)} » n'est pas un point exact : sur {decumResult.runs.toLocaleString("fr-FR")}{" "}
          simulations, le taux de survie réel se situe entre{" "}
          <strong className="text-text">
            {fmtPct(decumResult.survivalRateCI.low)} et {fmtPct(decumResult.survivalRateCI.high)}
          </strong>{" "}
          (intervalle de confiance à 95 %). La moyenne des capitaux finaux ({" "}
          <strong className="text-text">{fmtCurrency(decumResult.mean)}</strong>) est tirée par quelques cas très
          chanceux — planifiez sur la médiane.
        </p>
      </div>

      {/* Histogramme des issues terminales : la queue de chance visible */}
      {decumResult.terminalDistribution.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <SectionHeader
            as="h3"
            level="card"
            icon={BarChart3}
            title="Distribution des capitaux finaux"
            className="mb-3 px-1"
            trailing={<span className="text-[10px] text-text-dim">0 € = capital épuisé</span>}
          />
          <TerminalHistogram
            bins={decumResult.terminalDistribution}
            mean={decumResult.mean}
            median={finalMedian}
            format={fmtCurrency}
            highlightRuin
            leftNote="0 € = rente stoppée"
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
            title="Votre capital, année après année"
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
                <HelpCircle size={11} /> Comment lire ?
                <ChevronDown size={11} className={cn("transition-transform", showGuide && "rotate-180")} />
              </button>
            }
          />
          <p className="text-[10px] text-text-dim mb-2 px-1">
            {decumResult.runs.toLocaleString("fr-FR")} évolutions de bourse différentes testées · chaque ligne est un
            cas possible
          </p>

          {showGuide && (
            <div className="mb-3 rounded-xl bg-glass border border-border p-3 sm:p-4 text-[11px] text-text-dim leading-relaxed space-y-2">
              <p>
                <strong className="text-text">Pourquoi ce graphique ?</strong> Personne ne peut prédire l'avenir de la
                bourse. Nous avons donc rejoué votre plan {decumResult.runs.toLocaleString("fr-FR")} fois, avec des
                évolutions différentes, pour voir dans quels cas votre argent dure jusqu'au bout.
              </p>
              <ul className="space-y-1.5 list-disc pl-4">
                <li>
                  <strong className="text-primary">Ligne dorée (scénario moyen)</strong> : le cas le plus courant. Une
                  fois sur deux, votre résultat est meilleur ; une fois sur deux, il est moins bon.
                </li>
                <li>
                  <strong className="text-text">Zone jaune pâle</strong> : votre vrai résultat se situera probablement
                  quelque part entre la ligne verte et la ligne rouge.
                </li>
                <li>
                  <strong className="text-[#4ADE80]">Ligne verte (bonne période de bourse)</strong> : la bourse vous
                  sourit. Seul 1 cas sur 10 fait encore mieux.
                </li>
                <li>
                  <strong className="text-[#F87171]">Ligne rouge (période difficile)</strong> : la bourse est décevante.
                  Seul 1 cas sur 10 fait encore moins bien.
                </li>
                <li>
                  <strong className="text-text">Quand une ligne touche 0 €</strong> : dans ce scénario, tout le capital
                  a été dépensé avant la fin — la rente s'arrête.
                </li>
              </ul>
              <p className="italic text-[10px]">
                Astuce : regardez surtout si la ligne rouge tient jusqu'à la fin de votre retraite. Si oui, votre plan
                résiste même quand la bourse est mauvaise.
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
                    year: y === 0 ? "Aujourd'hui" : `+${y}`,
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
                          {label === "Aujourd'hui" ? "Aujourd'hui" : `${label} ans`}
                        </div>
                        {payload
                          .filter(entry => entry.name !== "Fourchette (pire – meilleur cas)")
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
                  name="Fourchette (pire – meilleur cas)"
                  stroke="none"
                  fill="url(#bandGradientRente)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="p90"
                  name="Bonne période de bourse (P90)"
                  stroke="#4ADE80"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="médian"
                  name="Scénario moyen (P50)"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p10"
                  name="Période difficile (P10)"
                  stroke="#F87171"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <ReferenceLine y={0} stroke="#F87171" strokeWidth={1} strokeDasharray="2 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Légende simplifiée — langage débutant */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] leading-snug">
            <LegendItem
              color="#4ADE80"
              label="Bonne période de bourse (P90)"
              desc="La bourse vous sourit — seul 1 cas sur 10 fait encore mieux"
            />
            <LegendItem
              color="var(--color-primary)"
              label="Scénario moyen (P50)"
              desc="Le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien"
            />
            <LegendItem
              color="#F87171"
              label="Période difficile (P10)"
              desc="La bourse est décevante — seul 1 cas sur 10 fait encore moins bien"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function fmtPct(v: number): string {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
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
    <div className="glass rounded-2xl p-4">
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
  return (
    <div className="glass rounded-3xl p-8 sm:p-12 border border-dashed border-border">
      <div className="max-w-md mx-auto text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <TrendingUp size={24} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold">Lancez la simulation Monte-Carlo</h3>
        <p className="text-[11px] text-text-dim leading-relaxed">
          {hasAccumulation
            ? "Analysez sur des centaines de scénarios stochastiques la viabilité de votre stratégie de décaissement."
            : "Commencez par simuler une phase d'accumulation dans l'onglet Simulateur pour disposer d'un capital à décumuler."}
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
  darkMode,
}: {
  inputs: SimulationInputs
  startingCapital: number
  darkMode: boolean
}) {
  const results = useMemo(() => {
    if (startingCapital <= 0) return []
    return STRESS_TEST_SCENARIOS.map(scenario => ({
      scenario,
      result: runStressTest(inputs, startingCapital, scenario),
    }))
  }, [inputs, startingCapital])

  if (results.length === 0) return null

  return (
    <div className="pt-2">
      <p className="text-[10px] text-text-dim leading-relaxed mb-4 max-w-2xl">
        Les percentiles ci-dessus mélangent toutes les époques. Ici, nous rejouons{" "}
        <strong className="text-text">
          les trois pires fenêtres historiques telles qu'elles se sont réellement déroulées
        </strong>{" "}
        (rendements contigus réels, inflation réelle de l'époque, garde-fous et indexation appliqués à l'identique).
        Aucun hasard : c'est exactement ce que la bourse a fait. Pour un krach au moment de votre choix, utilisez
        l'option <strong className="text-text">« Partir en période difficile »</strong> dans les paramètres.
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
          <div className="text-[9px] text-text-dim mt-0.5 leading-snug">{scenario.desc}</div>
        </div>
        <span
          className={cn(
            "text-[9px] mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
            survived ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#F87171]/20 text-[#F87171]",
          )}
        >
          {survived ? "Survit" : "Épuisé"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-glass p-2">
          <div className="text-[9px] text-text-dim uppercase tracking-wider">Capital final</div>
          <div className={cn("mono text-xs font-bold", survived ? "text-[#4ADE80]" : "text-[#F87171]")}>
            {survived ? fmtCurrency(result.finalCapital) : "0 €"}
          </div>
        </div>
        <div className="rounded-xl bg-glass p-2">
          <div className="text-[9px] text-text-dim uppercase tracking-wider">Perte max</div>
          <div className="mono text-xs font-bold text-[#F87171]">
            −{Math.round(drawdown * 100)}% <span className="text-[9px] text-text-dim font-normal">(pic → creux)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-text-dim">
        <span>
          {ruinYear !== null
            ? `Rente stoppée en ${result.scenario.startYear + (ruinYear ?? 0) - 1}`
            : "Rente versée jusqu'au bout"}
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 hover:text-text transition-colors"
        >
          Voir le détail <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-border/60 pt-2.5">
          <div className="flex items-center gap-2 text-[9px] text-text-dim">
            <span>Rendements réels rejoués :</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.windowReturns.map(({ year, return: r }) => (
              <span
                key={year}
                title={`${year} : ${fmtDecimal(r * 100, 1)} %`}
                className={cn(
                  "mono text-[9px] px-1 py-0.5 rounded",
                  r >= 0 ? "bg-[#4ADE80]/15 text-[#4ADE80]" : "bg-[#F87171]/15 text-[#F87171]",
                )}
              >
                {year} {(r * 100).toFixed(1).replace(".", ",")} %
              </span>
            ))}
          </div>
          <div className="mt-1 space-y-1 text-[9px] text-text-dim">
            <div className="flex justify-between">
              <span>Capital le plus bas</span>
              <span className="mono font-bold text-text">{fmtCurrency(result.minCapital)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total retiré sur la période</span>
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
                <ReferenceLine y={0} stroke="#F87171" strokeWidth={1} strokeDasharray="2 2" />
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
