import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  Shield,
  Wallet,
  PiggyBank,
  Coins,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Play,
  RefreshCw,
  Lightbulb,
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

import { fmtCurrency, fmtCompact } from "../../engine"
import { chartTheme } from "../../utils/chartTheme"
import { cn } from "@/utils/cn"

import type { DecumulationResult, SimulationInputs, WithdrawalModel, YearRow } from "../../types"

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
    tone: "#D4AF37",
  },
  { id: "custom", label: "Personnalisé", desc: "Montant fixe mensuel choisi", rate: 0, icon: Wallet, tone: "#C9A324" },
]

interface RenteRetraiteTabProps {
  inputs: SimulationInputs
  decumResult: DecumulationResult | null
  lastRow: YearRow | undefined
  darkMode: boolean
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  updateInputs: (partial: Partial<SimulationInputs>) => void
  runDecum: () => void
}

export function RenteRetraiteTab({
  inputs,
  decumResult,
  lastRow,
  darkMode,
  updateInput,
  updateInputs,
  runDecum,
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

  return (
    <div className="space-y-5">
      {/* ──────────────────────────────────────────────────────────
          En-tête + capital à décumuler
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-4 sm:p-6">
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center">
                <TrendingUp size={14} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-sm sm:text-base font-bold">Simulation de décaissement & rente</h2>
            </div>
            <p className="text-[11px] text-text-dim leading-relaxed max-w-xl">
              Analysez la soutenabilité de vos retraits sur{" "}
              <strong className="text-text">{inputs.retirementYears} ans</strong> via une simulation Monte-Carlo.
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-dim">
              <AlertTriangle size={11} className="text-[#D4AF37]" />
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
            <SectionTitle>Modèle de retrait</SectionTitle>
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
                        ? "border-[#D4AF37]/60 bg-[#D4AF37]/10 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.25)]"
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
                          {isActive && <CheckCircle2 size={13} className="text-[#D4AF37] shrink-0" />}
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
          </div>

          {/* Paramètres */}
          <div className="lg:col-span-2 space-y-3">
            <SectionTitle>Paramètres</SectionTitle>

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
                    : `${(selectedModel.rate * 100).toFixed(1).replace(/\.0$/, "")} %`}
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
                style={{ accentColor: "#D4AF37" }}
              />
              <div className="flex justify-between text-[9px] text-text-dim mt-1">
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
                inputs.withdrawalInflation && "border border-[#D4AF37]/40",
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
                  inputs.withdrawalInflation ? "bg-[#D4AF37]" : "bg-text-dim/30",
                )}
              >
                <motion.div
                  animate={{ x: inputs.withdrawalInflation ? 18 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute w-4 h-4 bg-white rounded-full top-0.5 shadow-sm"
                />
              </div>
            </button>

            {/* Lancer la simulation */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={runDecum}
              disabled={!lastRow || lastRow.nominal <= 0}
              className={cn(
                "w-full rounded-xl py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors",
                lastRow && lastRow.nominal > 0
                   ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-gold hover:from-primary-light hover:to-primary"
                  : "bg-text-dim/20 text-text-dim cursor-not-allowed",
              )}
            >
              <Play size={13} fill="currentColor" /> Lancer la simulation Monte-Carlo
              {decumResult && <RefreshCw size={11} className="opacity-70" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          Résultats de la simulation
         ────────────────────────────────────────────────────────── */}
      {decumResult ? (
        <ResultsSection decumResult={decumResult} theme={theme} />
      ) : (
        <EmptyState hasAccumulation={!!lastRow} />
      )}

      {/* ──────────────────────────────────────────────────────────
          Comparatif rapide : 3 taux
         ────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={13} className="text-text-dim" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Aperçu — rente possible selon le taux de retrait
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {comparisonRates.map(rate => {
            const monthly = (startingCapital * rate) / 12
            const yearly = monthly * 12
            const isCurrent = Math.abs(selectedModel.rate - rate) < 0.0001
            const tone = rate <= 0.025 ? "#60A5FA" : rate <= 0.04 ? "#4ADE80" : "#D4AF37"
            const label = rate <= 0.025 ? "Très prudent" : rate <= 0.04 ? "Équilibré (Bengen)" : "Dynamique"
            return (
              <div
                key={rate}
                className={cn("glass rounded-2xl p-4 transition-all", isCurrent && "ring-1 ring-[#D4AF37]/60")}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider">
                    Taux {(rate * 100).toFixed(1).replace(/\.0$/, "")} %
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] mono font-bold text-[#D4AF37] uppercase tracking-wider">Actuel</span>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted mb-3">
      <span className="w-1 h-3 rounded-full bg-[#D4AF37]" />
      {children}
    </div>
  )
}

function fmtPercent(v: number): string {
  return `${(v * 100).toFixed(1).replace(/\.0$/, "")} %`
}

function ResultsSection({
  decumResult,
  theme,
}: {
  decumResult: DecumulationResult
  theme: ReturnType<typeof chartTheme>
}) {
  const survival = decumResult.survivalProbability
  const survivalTone = survival >= 90 ? "#4ADE80" : survival >= 75 ? "#D4AF37" : "#F87171"
  const survivalLabel = survival >= 90 ? "Excellente" : survival >= 75 ? "Correcte" : "Risquée"
  const ruinYear = decumResult.ruinYearMedian
  const finalMedian = decumResult.p50[decumResult.p50.length - 1] ?? 0
  const finalSurvival = finalMedian > 0
  const success = survival >= 85
  const [showGuide, setShowGuide] = useState(false)

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
          <div className="mt-2 rounded-xl bg-[#D4AF37]/8 border-l-2 border-[#D4AF37]/50 px-3 py-2 flex items-start gap-2">
            <Lightbulb size={13} className="text-[#D4AF37] shrink-0 mt-0.5" />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Votre rente"
          value={fmtCurrency(decumResult.initialWithdrawal)}
          sub={`par mois, pendant ${decumResult.years.length - 1} ans`}
          tone="#D4AF37"
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

      {/* Graphique */}
      {decumResult.years.length > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-text-dim" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Votre capital, année après année
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(v => !v)}
              className={cn(
                "text-[10px] text-text-dim hover:text-text inline-flex items-center gap-1 transition-colors",
                showGuide && "text-[#D4AF37]",
              )}
            >
              <HelpCircle size={11} /> Comment lire ?
              <ChevronDown size={11} className={cn("transition-transform", showGuide && "rotate-180")} />
            </button>
          </div>
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
                  <strong className="text-[#D4AF37]">Ligne dorée (scénario moyen)</strong> : le cas le plus courant. Une
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
          <div className="h-72 sm:h-80">
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
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: theme.tick, fontSize: 10 }}
                  interval={Math.max(0, Math.floor(decumResult.years.length / 10))}
                />
                <YAxis tick={{ fill: theme.tick, fontSize: 10 }} tickFormatter={(v: number) => fmtCompact(v)} />
                <Tooltip
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
                  stroke="#D4AF37"
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
              color="#D4AF37"
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
        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto">
          <TrendingUp size={24} className="text-[#D4AF37]" />
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
