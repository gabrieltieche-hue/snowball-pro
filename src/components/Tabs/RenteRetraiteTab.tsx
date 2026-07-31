import { useMemo } from "react"
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
  Sparkles,
  AlertTriangle,
  Play,
  RefreshCw,
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
                  ? "bg-gradient-to-r from-[#C9A324] to-[#D4AF37] text-[#12100E] shadow-gold hover:from-[#D4AF37] hover:to-[#E5C158]"
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
  const startingCapital = decumResult.p50[0] ?? 0
  const finalSurvival = finalMedian > 0
  const success = survival >= 85

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
            <h3 className="text-sm font-bold">{success ? "Stratégie viable" : "Stratégie risquée"}</h3>
            <span
              className="text-[10px] mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: `${survivalTone}20`, color: survivalTone }}
            >
              {survivalLabel}
            </span>
          </div>
          <p className="text-[11px] text-text-dim mt-1 leading-relaxed">
            Sur <strong className="text-text">{decumResult.runs.toLocaleString("fr-FR")}</strong> simulations
            Monte-Carlo, votre rente initiale de{" "}
            <strong className="text-text">{fmtCurrency(decumResult.initialWithdrawal)} / mois</strong>{" "}
            {success ? (
              <>
                tient dans <strong className="text-[#4ADE80]">{survival.toFixed(1)} %</strong> des scénarios.
              </>
            ) : (
              <>
                ne tient que dans <strong className="text-[#F87171]">{survival.toFixed(1)} %</strong> des scénarios.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Rente initiale"
          value={fmtCurrency(decumResult.initialWithdrawal)}
          sub="par mois"
          tone="#D4AF37"
        />
        <KpiCard
          label="Probabilité de survie"
          value={`${survival.toFixed(1)} %`}
          sub={`sur ${decumResult.years.length - 1} ans`}
          tone={survivalTone}
        />
        <KpiCard
          label="Ruine médiane"
          value={ruinYear !== null ? `Année ${ruinYear}` : "Jamais"}
          sub={ruinYear !== null ? "1 simulation sur 2 ruinée" : "Capital préservé"}
          tone={ruinYear !== null ? "#F87171" : "#4ADE80"}
        />
        <KpiCard
          label="Capital final médian"
          value={fmtCurrency(finalMedian)}
          sub={startingCapital > 0 ? `${((finalMedian / startingCapital - 1) * 100).toFixed(0)} % vs départ` : "—"}
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
                Évolution du capital — {decumResult.runs.toLocaleString("fr-FR")} simulations
              </span>
            </div>
            <button
              type="button"
              className="text-[10px] text-text-dim hover:text-text inline-flex items-center gap-1"
              title="Les percentiles P10/P90 représentent les scénarios pessimiste/optimiste. La médiane (P50) est le scénario central."
            >
              <HelpCircle size={11} /> Comment lire ?
            </button>
          </div>
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
                        {payload.map((entry, i) => (
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
                  name="Fourchette P10 – P90"
                  stroke="none"
                  fill="url(#bandGradientRente)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="p90"
                  name="P90 — optimiste"
                  stroke="#4ADE80"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="médian"
                  name="Médiane (P50)"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p10"
                  name="P10 — pessimiste"
                  stroke="#F87171"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <ReferenceLine y={0} stroke="#F87171" strokeWidth={1} strokeDasharray="2 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Légende corrigée (P10/P90 inversés dans la version précédente) */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] leading-snug">
            <LegendItem color="#4ADE80" label="P90 — optimiste" desc="Seuls 10 % des scénarios font mieux" />
            <LegendItem color="#D4AF37" label="Médiane (P50)" desc="50 % des scénarios au-dessus, 50 % en-dessous" />
            <LegendItem color="#F87171" label="P10 — pessimiste" desc="Seuls 10 % des scénarios font moins bien" />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
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
