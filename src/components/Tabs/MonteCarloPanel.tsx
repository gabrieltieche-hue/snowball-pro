import { useMemo, useState } from "react"
import { AlertTriangle, Play } from "lucide-react"
import { fmtCurrency, runMonteCarlo, runSimulation } from "../../engine"
import { MonteCarloChart } from "../Charts/MonteCarloChart"
import { cn } from "../../utils/cn"
import type { MonteCarloResult, SimulationInputs } from "../../types"

interface MonteCarloPanelProps {
  inputs: SimulationInputs
}

export function MonteCarloPanel({ inputs }: MonteCarloPanelProps) {
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null)
  const [running, setRunning] = useState(false)
  const [computedFor, setComputedFor] = useState("")

  const inputsHash = useMemo(
    () =>
      JSON.stringify({
        capitalInitial: inputs.capitalInitial,
        monthlyPayment: inputs.monthlyPayment,
        annualReturn: inputs.annualReturn,
        volatility: inputs.volatility,
        duration: inputs.duration,
        indexation: inputs.indexation,
        envelope: inputs.envelope,
        returnMode: inputs.returnMode,
        historicalIndex: inputs.historicalIndex,
        crisisEnabled: inputs.crisisEnabled,
        crisisProfile: inputs.crisisProfile,
        crisisYear: inputs.crisisYear,
        crisisAmplitude: inputs.crisisAmplitude,
        etfFees: inputs.etfFees,
        brokerageFees: inputs.brokerageFees,
        insuranceFees: inputs.insuranceFees,
        managementFees: inputs.managementFees,
        dividendYield: inputs.dividendYield,
        seed: inputs.seed,
      }),
    [inputs],
  )

  const isStale = mcResult !== null && computedFor !== inputsHash

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => {
      setMcResult(runMonteCarlo(inputs, inputs.mcRuns))
      setComputedFor(inputsHash)
      setRunning(false)
    }, 30)
  }

  const lastRow = useMemo(() => runSimulation(inputs).slice(-1)[0], [inputs])
  const noCrisisRow = useMemo(
    () => (inputs.crisisEnabled ? runSimulation({ ...inputs, crisisEnabled: false }).slice(-1)[0] : undefined),
    [inputs],
  )

  const scenarioCards = mcResult
    ? [
        { label: "Scénario pessimiste (P10)", value: mcResult.p10[mcResult.p10.length - 1] ?? 0, tone: "#F87171", sub: "1 chance sur 10 de faire moins" },
        { label: "Scénario médian (P50)", value: mcResult.p50[mcResult.p50.length - 1] ?? 0, tone: "#D4AF37", sub: "Résultat le plus probable" },
        { label: "Scénario optimiste (P90)", value: mcResult.p90[mcResult.p90.length - 1] ?? 0, tone: "#4ADE80", sub: "1 chance sur 10 de faire mieux" },
      ]
    : []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold mb-1">🎲 Simulation de Monte Carlo</h2>
            <p className="text-xs text-text-muted leading-relaxed max-w-xl">
              {inputs.mcRuns.toLocaleString("fr-FR")} simulations avec un rendement aléatoire (loi normale, σ ≈{" "}
              {(inputs.volatility * 100).toFixed(0)}%). Résultats : P10 (pessimiste), P50 (médian), P90 (optimiste).
            </p>
          </div>
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-colors whitespace-nowrap",
              running
                ? "bg-text-dim/20 text-text-dim cursor-not-allowed"
                : "bg-gradient-to-r from-[#C9A324] to-[#D4AF37] text-[#12100E] shadow-gold hover:from-[#D4AF37] hover:to-[#E5C158]",
            )}
          >
            <Play size={13} fill="currentColor" /> {running ? "Calcul..." : `Lancer ${inputs.mcRuns} simulations`}
          </button>
        </div>

        {!mcResult && (
          <div className="min-h-80 flex items-center justify-center flex-col gap-3 text-text-muted rounded-2xl border border-dashed border-border">
            <div className="text-4xl">🎲</div>
            <p className="text-xs font-semibold">Cliquez sur « Lancer » pour générer le nuage de probabilités</p>
          </div>
        )}

        {mcResult && (
          <div className="space-y-5">
            <MonteCarloChart result={mcResult} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {scenarioCards.map(card => (
                <div key={card.label} className="glass rounded-2xl p-4" style={{ borderColor: `${card.tone}30` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: card.tone }}>
                    {card.label}
                  </p>
                  <p className="mono text-lg font-bold text-text">{fmtCurrency(card.value)}</p>
                  <p className="text-[10px] text-text-dim mt-1.5">{card.sub}</p>
                </div>
              ))}
              <div className="glass rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[#60A5FA]">Objectif atteint</p>
                <p className="mono text-lg font-bold text-text">{mcResult.successRate.toFixed(0)}%</p>
                <p className="text-[10px] text-text-dim mt-1.5">
                  des scénarios ≥ {fmtCurrency(mcResult.goalTarget)}
                </p>
              </div>
            </div>
            {isStale && (
              <p className="text-[10px] text-warning flex items-center gap-1">
                <AlertTriangle size={11} /> Paramètres modifiés depuis le lancement — relancez pour mettre à jour.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Krach recap */}
      {inputs.crisisEnabled && lastRow && noCrisisRow && (
        <div className="rounded-2xl p-5 border border-[#8B3A3A]/30 bg-gradient-to-br from-[#1a1210] to-[#160d0b] border-l-2 border-l-danger">
          <h3 className="text-xs font-bold text-danger uppercase tracking-wider mb-2.5">
            ⚠️ Impact du krach simulé
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Un choc de <strong className="text-text">-{inputs.crisisAmplitude}%</strong> en année{" "}
            <strong className="text-text">{inputs.crisisYear}</strong> est intégré. Le patrimoine final est de{" "}
            <strong className="text-danger">{fmtCurrency(lastRow?.nominal ?? 0)}</strong> au lieu de{" "}
            <strong className="text-text">{fmtCurrency(noCrisisRow?.nominal ?? 0)}</strong> sans krach.
          </p>
        </div>
      )}
    </div>
  )
}
