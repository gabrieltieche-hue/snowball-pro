import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, BarChart3, Dices, Play, ShieldCheck } from "lucide-react"
import { fmtCurrency, fmtDecimal, getHistoricalDataset, runMonteCarloAsync } from "../../engine"
import { MonteCarloChart } from "../Charts/MonteCarloChart"
import { TerminalHistogram } from "../Simulation/TerminalHistogram"
import { HelpTip } from "../shared/HelpTip"
import { Toggle } from "../shared/Toggle"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { SectionHeader } from "../shared/SectionHeader"
import { cn } from "../../utils/cn"
import type { MonteCarloResult, SimulationInputs } from "../../types"

interface MonteCarloPanelProps {
  inputs: SimulationInputs
  darkMode: boolean
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

export function MonteCarloPanel({ inputs, darkMode, updateInput }: MonteCarloPanelProps) {
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
        // Fiabilité (v5.5.0) : ces options changent le résultat du Monte Carlo
        // — sans elles, l'avertissement « relancez » ne se déclencherait pas
        // après un basculement.
        parameterUncertainty: inputs.parameterUncertainty,
        extendedHistory: inputs.extendedHistory,
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
          help: "P10 = percentile 10 : seuls 10 % des scénarios finissent avec MOINS que ce montant. C'est le cas défavorable — 9 fois sur 10, vous ferez mieux.",
        },
        {
          label: "Scénario moyen (P50)",
          value: mcResult.p50[mcResult.p50.length - 1] ?? 0,
          tone: "var(--color-primary)",
          sub: "le cas le plus courant : 1 fois sur 2 mieux, 1 fois sur 2 moins bien",
          help: "P50 = la médiane : dans la moitié des scénarios le capital final est supérieur, dans l'autre moitié il est inférieur. Planifiez sur ce chiffre.",
        },
        {
          label: "Bonne période de bourse (P90)",
          value: mcResult.p90[mcResult.p90.length - 1] ?? 0,
          tone: "#4ADE80",
          sub: "1 cas sur 10 fait encore mieux",
          help: "P90 = percentile 90 : 90 % des scénarios finissent avec MOINS que ce montant. C'est le cas favorable — ne le planifiez pas comme certitude.",
        },
      ]
    : []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <SectionHeader as="h2" level="page" icon={Dices} title="Simulation de Monte Carlo" className="mb-2" />
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
                : "btn-shine bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary",
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

        {/* Options de fiabilité du modèle : l'honnêteté des estimations prime.
            Toutes ON par défaut (chaque option reste désactivable pour
            comparer), mais le panneau est replié par défaut (v6) : il n'impose
            plus ses options à chaque visite, on l'ouvre à la demande. */}
        <CollapsibleSection
          title="Fiabilité du modèle"
          icon={<ShieldCheck size={12} className="text-primary" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <Toggle
              checked={inputs.parameterUncertainty}
              onChange={v => updateInput("parameterUncertainty", v)}
              label="Incertitude des paramètres"
              sub="La moyenne 10,07 % et la volatilité ne sont PAS des vérités connues : chaque scénario tire les siennes autour des estimations historiques (Pástor–Stambaugh). Élargit honnêtement P10 et P90."
            />
            <Toggle
              checked={inputs.extendedHistory}
              onChange={v => updateInput("extendedHistory", v)}
              label="Historique étendu (100 ans)"
              sub="Rejoue 100 ans de rendements réels (S&P 500 1926-1969 + MSCI World 1970-2025) au lieu de 56 : les krachs de 1929, 1931, 1933 sont rejoués."
            />
          </div>
        </CollapsibleSection>

        {!mcResult && !running && (
          <div className="min-h-80 flex items-center justify-center flex-col gap-3 text-text-muted rounded-2xl border border-dashed border-border">
            <Dices size={44} className="text-primary/50" aria-hidden />
            <p className="text-xs font-semibold">
              Cliquez sur « Lancer » pour tester votre plan dans {inputs.mcRuns.toLocaleString("fr-FR")} situations de
              bourse différentes
            </p>
          </div>
        )}

        {mcResult && (
          <div className="space-y-5">
            <MonteCarloChart result={mcResult} darkMode={darkMode} />
            {/* Bandeau de fiabilité (v6) : un signal de confiance factuel — ce
                que l'estimation repose réellement sur, en une ligne. */}
            <p className="text-[10px] text-text-dim flex items-center gap-1.5 flex-wrap">
              <ShieldCheck size={11} className="text-primary shrink-0" aria-hidden />
              Basé sur <strong className="text-text">{mcResult.runs.toLocaleString("fr-FR")} scénarios</strong> ·{" "}
              {inputs.extendedHistory ? "100 ans" : "56 ans"} d'historique réel · fiscalité française incluse
            </p>
            <p className="text-[10px] text-text-dim italic">
              Montants en <strong className="text-text not-italic">euros courants</strong> (valeur sur le compte,
              non corrigés de l'inflation) et <strong className="text-text not-italic">nets d'impôts</strong> (liquidation
              théorique) — pour comparer avec le Simulateur en euros d'aujourd'hui, tenez compte de l'inflation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {scenarioCards.map(card => (
                <div key={card.label} className="glass rounded-2xl p-4" style={{ borderColor: `${card.tone}30` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.tone }}>
                      {card.label}
                    </p>
                    {card.help && <HelpTip text={card.help} className="shrink-0 -mt-0.5" />}
                  </div>
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
                <p className="text-[9px] text-text-dim mt-1 border-t border-border/60 pt-1.5">
                  Précision : {fmtDecimal(mcResult.successRate, 1)} % ±{" "}
                  {fmtDecimal((mcResult.successRateCI.high - mcResult.successRateCI.low) / 2, 1)} pt (intervalle de
                  confiance à 95 %)
                </p>
              </div>
            </div>
            {/* Histogramme des issues terminales : rend la queue droite visible */}
            <div className="glass rounded-2xl p-4">
              <SectionHeader
                as="h3"
                level="card"
                icon={BarChart3}
                title="Distribution des capitaux finaux"
                className="mb-3 px-1"
                trailing={
                  <span className="text-[10px] text-text-dim">
                    <span className="mono font-bold text-text">{mcResult.runs.toLocaleString("fr-FR")}</span> cas
                  </span>
                }
              />
              <TerminalHistogram
                bins={mcResult.terminalDistribution}
                mean={mcResult.mean}
                median={mcResult.p50[mcResult.p50.length - 1] ?? 0}
                format={fmtCurrency}
                leftNote="0 €"
              />
              <p className="text-[10px] text-text-dim mt-2 px-1 leading-relaxed">
                L'écart entre la <strong className="text-[#4ADE80]">médiane</strong> (cas le plus courant) et la{" "}
                <strong className="text-[#60A5FA]">moyenne</strong> montre la « queue de chance » : quelques cas très
                heureux tirent la moyenne vers le haut. Planifiez sur la médiane, pas sur la moyenne.
              </p>
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
