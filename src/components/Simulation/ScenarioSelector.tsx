import { CheckCircle2, TrendingUp } from "lucide-react"
import { getHistoricalDataset } from "../../engine"
import { HelpTip } from "../shared/HelpTip"
import { cn } from "../../utils/cn"
import type { ReturnScenario, SimulationInputs } from "../../types"

interface ScenarioSelectorProps {
  inputs: SimulationInputs
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

interface ScenarioDef {
  id: ReturnScenario
  label: string
  desc: string
  help: string
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: "prudent",
    label: "Prudent",
    desc: "rendement réel composé",
    help: "Le taux le plus bas des trois : le rendement géométrique composé de l'historique, une fois l'inflation retirée (≈ 5,99 %/an pour le MSCI World). Un plancher honnête pour planifier sans dépendre de la chance.",
  },
  {
    id: "central",
    label: "Central",
    desc: "rendement géométrique composé",
    help: "Le rendement que la bourse a VRAIMENT composé sur toute la période, krachs inclus (≈ 8,22 %/an pour le MSCI World). C'est la projection « médiane » : moins flatteuse que la moyenne arithmétique, mais plus honnête.",
  },
  {
    id: "optimiste",
    label: "Optimiste",
    desc: "moyenne arithmétique",
    help: "La moyenne arithmétique des années (≈ 10,07 %/an pour le MSCI World) : le taux moyen d'une année, pas le gain réellement composé. Les mauvaises années (-37 %…) pèsent davantage sur un compte réel que sur cette moyenne.",
  },
]

/**
 * Choix du scénario de rendement de la projection principale (paquet 1) :
 * les trois étages de l'échelle historique — prudent (réel composé), central
 * (géométrique composé, défaut), optimiste (moyenne arithmétique). Un
 * bandeau rappelle que le défaut est la médiane historique, pas la meilleure
 * moyenne.
 */
export function ScenarioSelector({ inputs, updateInput }: ScenarioSelectorProps) {
  const historical = getHistoricalDataset(inputs.historicalIndex)
  const rates: Record<ReturnScenario, number> = {
    prudent: historical.netReturn,
    central: historical.compoundedReturn,
    optimiste: historical.avgReturn,
  }
  const fmtRate = (r: number): string => `${(r * 100).toFixed(2).replace(".", ",")} %`

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={13} className="text-primary shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">Scénario de rendement</span>
        <HelpTip
          text="Le Simulateur applique chaque année le même taux de référence, choisi parmi trois scénarios. Monte Carlo et la Rente, eux, rejouent toujours l'historique réel année par année — leur médiane se calcule toute seule."
          className="ml-0.5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SCENARIOS.map(sc => {
          const isActive = inputs.returnScenario === sc.id
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => updateInput("returnScenario", sc.id)}
              aria-pressed={isActive}
              className={cn(
                "relative rounded-xl p-3 text-left border transition-all",
                isActive
                  ? "border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--color-primary-rgb),0.25)]"
                  : "glass border-border hover:bg-glass-hover",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-text")}>{sc.label}</span>
                {isActive && <CheckCircle2 size={13} className="text-primary shrink-0" />}
              </div>
              <div className="mono text-base font-extrabold text-text leading-tight mt-1">
                {fmtRate(rates[sc.id])}
                <span className="text-[9px] font-medium text-text-dim ml-1">/an</span>
              </div>
              <div className="text-[9px] text-text-dim mt-1 leading-snug">{sc.desc}</div>
            </button>
          )
        })}
      </div>
      {inputs.returnScenario === "central" && (
        <p className="text-[10px] text-text-muted mt-3 leading-relaxed flex items-start gap-1.5 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
          <CheckCircle2 size={11} className="text-primary shrink-0 mt-0.5" aria-hidden />
          <span>
            Projection centrale basée sur la <strong className="text-text">médiane historique</strong> (rendement
            composé {fmtRate(rates.central)}/an, krachs inclus) —{" "}
            <strong className="text-text">pas sur la meilleure moyenne</strong>.
          </span>
        </p>
      )}
    </div>
  )
}
