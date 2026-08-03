import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Play } from "lucide-react"
import { fmtCurrency, getHistoricalDataset, runMonteCarloAsync } from "../../engine"
import { MonteCarloChart } from "../Charts/MonteCarloChart"
import { cn } from "../../utils/cn"
import type { MonteCarloResult, SimulationInputs } from "../../types"

interface MonteCarloPanelProps {
  inputs: SimulationInputs
  darkMode: boolean
}

export function MonteCarloPanel({ inputs, darkMode }: MonteCarloPanelProps) {
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [computedFor, setComputedFor] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const inputsHash = useMemo(
    () =>
      JSON.stringify({
        capitalInitial: inputs.capitalInitial,
        monthlyPayment: inputs.monthlyPayment,
        duration: inputs.duration,
        indexation: inputs.indexation,
        envelope: inputs.envelope,
        historicalIndex: inputs.historicalIndex,
        etfFees: inputs.etfFees,
        brokerageFees: inputs.brokerageFees,
        insuranceFees: inputs.insuranceFees,
        managementFees: inputs.managementFees,
        seed: inputs.seed,
        mcRuns: inputs.mcRuns,
        // Monte Carlo rejoue TOUJOURS les rendements réels passés : plus de
        // taux saisi, de volatilité, de mode de rendement ni de crise
        // synthétique (tous supprimés en Option A) — ces paramètres ne
        // peuvent plus influencer le résultat. Paramètres qui changent le
        // résultat (taux de succès, fiscalité, inflation, années de
        // détention) : sans eux, l'avertissement « relancez » ne se
        // déclenchait pas à la modification.
        goalTarget: inputs.goalTarget,
        inflation: inputs.inflation,
        // Mode d'inflation (custom/historique/dynamique) : il change le
        // résultat via annualInflationForYear — son absence rendait le cache
        // « à jour » à tort après un basculement (audit B8).
        inflationMode: inputs.inflationMode,
        taxCouple: inputs.taxCouple,
        peaYearsHeld: inputs.peaYearsHeld,
        avYearsHeld: inputs.avYearsHeld,
        tmi: inputs.tmi,
        ctoTaxMode: inputs.ctoTaxMode,
      }),
    [inputs],
  )

  const isStale = mcResult !== null && computedFor !== inputsHash

  // Nettoyage au démontage : annule la simulation en cours et évite les
  // setState après unmount (setTimeout / promise en vol).
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const handleRun = async () => {
    if (running) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setProgress(0)
    setMcResult(null)
    try {
      const result = await runMonteCarloAsync(
        inputs,
        inputs.mcRuns,
        inputs.goalTarget,
        (done, total) => {
          if (mountedRef.current) setProgress(Math.round((done / total) * 100))
        },
        controller.signal,
      )
      if (!mountedRef.current) return
      setMcResult(result)
      setComputedFor(inputsHash)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (mountedRef.current) setMcResult(null)
    } finally {
      if (mountedRef.current) setRunning(false)
    }
  }

  const scenarioCards = mcResult
    ? [
        {
          label: "Mauvaise période de bourse (P10)",
          value: mcResult.p10[mcResult.p10.length - 1] ?? 0,
          tone: "#F87171",
          sub: "1 cas sur 10 fait encore moins bien",
        },
        {
          label: "Scénario moyen (P50)",
          value: mcResult.p50[mcResult.p50.length - 1] ?? 0,
          tone: "var(--color-primary)",
          sub: "le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien",
        },
        {
          label: "Bonne période de bourse (P90)",
          value: mcResult.p90[mcResult.p90.length - 1] ?? 0,
          tone: "#4ADE80",
          sub: "1 cas sur 10 fait encore mieux",
        },
      ]
    : []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold mb-1">🎲 Simulation de Monte Carlo</h2>
            <p className="text-xs text-text-muted leading-relaxed max-w-xl">
              L'avenir de la bourse est imprévisible : nous testons donc votre plan{" "}
              <strong className="text-text">{inputs.mcRuns.toLocaleString("fr-FR")} fois</strong>, en rééchantillonnant
              les <strong className="text-text">rendements réels passés</strong> de l'indice{" "}
              <strong className="text-text">{getHistoricalDataset(inputs.historicalIndex).name}</strong> (les krachs et
              les bull markets réels sont rejoués). Vous verrez le résultat de votre capital dans une{" "}
              <strong className="text-text">mauvaise</strong>, une <strong className="text-text">moyenne</strong> et une{" "}
              <strong className="text-text">bonne</strong> période de bourse.
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
                : "bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary",
            )}
          >
            <Play size={13} fill="currentColor" />{" "}
            {running ? `Calcul... ${progress}%` : `Lancer ${inputs.mcRuns} simulations`}
          </button>
        </div>

        {/* Barre de progression : le calcul est découpé en chunks pour ne pas geler l'interface */}
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

        {!mcResult && !running && (
          <div className="min-h-80 flex items-center justify-center flex-col gap-3 text-text-muted rounded-2xl border border-dashed border-border">
            <div className="text-4xl">🎲</div>
            <p className="text-xs font-semibold">
              Cliquez sur « Lancer » pour tester votre plan dans {inputs.mcRuns.toLocaleString("fr-FR")} situations de
              bourse différentes
            </p>
          </div>
        )}

        {mcResult && (
          <div className="space-y-5">
            <MonteCarloChart result={mcResult} darkMode={darkMode} />
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
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-[#60A5FA]">
                  Chances d'atteindre votre objectif
                </p>
                <p className="mono text-lg font-bold text-text">{mcResult.successRate.toFixed(0)}%</p>
                <p className="text-[10px] text-text-dim mt-1.5">
                  sur {mcResult.runs.toLocaleString("fr-FR")} cas, le capital final atteint au moins{" "}
                  {fmtCurrency(mcResult.goalTarget)}
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

      {/* La crise synthétique a été supprimée (Option A) : les krachs réels
          (2000, 2008, 2022…) sont déjà dans les scénarios rejoués par Monte
          Carlo — en simuler un les compterait deux fois. */}
    </div>
  )
}
