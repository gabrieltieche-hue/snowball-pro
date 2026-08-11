import { useRef } from "react"
import type { KeyboardEvent } from "react"
import { CheckCircle2 } from "lucide-react"
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
 * Choix du scénario de rendement de la projection principale (v6.4.1) : les
 * trois étages de l'échelle historique — prudent (réel composé), central
 * (géométrique composé, défaut), optimiste (moyenne arithmétique). Version
 * compacte verticale, adaptée à la section « Votre épargne » de la sidebar :
 * le sélecteur a quitté le haut de l'onglet Projection pour ne plus gâcher la
 * vue du résultat. Un bandeau rappelle que le défaut est la médiane
 * historique, pas la meilleure moyenne.
 */
export function ScenarioSelector({ inputs, updateInput }: ScenarioSelectorProps) {
  const historical = getHistoricalDataset(inputs.historicalIndex)
  const rates: Record<ReturnScenario, number> = {
    prudent: historical.netReturn,
    central: historical.compoundedReturn,
    optimiste: historical.avgReturn,
  }
  const fmtRate = (r: number): string => `${(r * 100).toFixed(2).replace(".", ",")} %`
  const groupRef = useRef<HTMLDivElement>(null)

  // Roving tabindex + ←/→/Home/End (pattern radiogroup ARIA, identique au
  // SegmentedControl « Tolérance au risque ») : seul le scénario actif est
  // dans l'ordre de tabulation, les flèches déplacent sélection ET focus.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return
    e.preventDefault()
    const radios = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])
    const idx = radios.findIndex(b => b.getAttribute("aria-checked") === "true")
    let next: HTMLButtonElement | undefined
    if (e.key === "Home") next = radios[0]
    else if (e.key === "End") next = radios[radios.length - 1]
    else {
      const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1
      next = radios[(idx + delta + radios.length) % radios.length]
    }
    if (next) {
      next.click()
      next.focus()
    }
  }

  return (
    <div className="mt-4 pt-3.5 border-t border-border">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
          Scénario de rendement
        </span>
        <HelpTip
          text="Le Simulateur applique chaque année le même taux de référence, choisi parmi trois scénarios. Monte Carlo et la Rente, eux, rejouent toujours l'historique réel année par année — leur médiane se calcule toute seule."
          className="ml-0.5"
        />
      </div>
      <div ref={groupRef} role="radiogroup" aria-label="Scénario de rendement" onKeyDown={handleKeyDown} className="grid gap-1.5">
        {SCENARIOS.map(sc => {
          const isActive = inputs.returnScenario === sc.id
          return (
            <button
              key={sc.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => updateInput("returnScenario", sc.id)}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                isActive
                  ? "border-primary/60 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(var(--color-primary-rgb),0.25)]"
                  : "glass border-border hover:bg-glass-hover",
              )}
            >
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[11px] font-bold leading-tight",
                    isActive ? "text-primary" : "text-text",
                  )}
                >
                  {sc.label}
                  {isActive && (
                    <CheckCircle2 size={12} className="inline-block text-primary ml-1 -mt-0.5" aria-hidden />
                  )}
                </span>
                <span className="block text-[9px] text-text-dim leading-snug mt-0.5">{sc.desc}</span>
              </span>
              <span className="mono text-sm font-extrabold text-text leading-none whitespace-nowrap shrink-0">
                {fmtRate(rates[sc.id])}
                <span className="text-[9px] font-medium text-text-dim ml-0.5">/an</span>
              </span>
            </button>
          )
        })}
      </div>
      {inputs.returnScenario === "central" && (
        <p className="text-[10px] text-text-muted mt-2.5 leading-relaxed flex items-start gap-1.5 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
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
