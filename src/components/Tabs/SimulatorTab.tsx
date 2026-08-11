import { useMemo, useState } from "react"
import { Activity, ChevronDown, ChevronUp, Landmark, Table } from "lucide-react"
import { computeKPIs, computeMilestones } from "../../engine"
import { SectionHeader } from "../shared/SectionHeader"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { HeroResult } from "../Simulation/HeroResult"
import { SummaryStats } from "../Simulation/SummaryStats"
import { EquityChart } from "../Charts/EquityChart"
import { DrawdownChart } from "../Charts/DrawdownChart"
import { CapitalAllocation } from "../Charts/CapitalAllocation"
import { AIInsightCard } from "../Simulation/AIInsightCard"
import { AmortissementTable } from "../Simulation/AmortissementTable"
import { CashflowCalendar } from "../Simulation/CashflowCalendar"
import { FeeImpact } from "../Simulation/FeeImpact"
import { FiscalPanel } from "../Simulation/FiscalPanel"
import { KpiGrid } from "../Simulation/KpiGrid"
import { MethodologyPanel } from "../Simulation/MethodologyPanel"
import { MilestoneTimeline } from "../Simulation/MilestoneTimeline"
import { ScenarioSelector } from "../Simulation/ScenarioSelector"
import type { SimulationInputs, YearRow } from "../../types"

interface SimulatorTabProps {
  rows: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

export function SimulatorTab({ rows, inputs, darkMode, updateInput }: SimulatorTabProps) {
  const kpis = useMemo(() => computeKPIs(rows, inputs), [rows, inputs])
  const milestones = useMemo(() => computeMilestones(rows), [rows])
  const [tableOpen, setTableOpen] = useState(false)

  /* Entonnoir v6 (refonte hiérarchique) : le résultat d'abord, l'analyse
     ensuite, les détails techniques repliés par défaut.
       1. Héro — « le nombre magique » + décomposition épargne / croissance
       2. 4 cartes de synthèse (SummaryStats, rétrogradé derrière le héro)
       3. Le graphique principal
       4. L'insight (« d'où vient votre argent ») — avant, noyé en bas
       5. Statistiques clés + jalons / frais (toujours visibles)
       6. Détails repliés par défaut : graphiques détaillés, fiscalité,
          méthodologie, calendrier, tableau annuel */
  return (
    <div className="space-y-5 animate-fade-in">
      <ScenarioSelector inputs={inputs} updateInput={updateInput} />
      <HeroResult rows={rows} inputs={inputs} />
      <SummaryStats rows={rows} inputs={inputs} />
      <EquityChart rows={rows} inputs={inputs} darkMode={darkMode} />

      <AIInsightCard rows={rows} inputs={inputs} kpis={kpis} />

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MilestoneTimeline milestones={milestones} rows={rows} />
        <FeeImpact rows={rows} inputs={inputs} />
      </div>

      {/* Graphiques secondaires repliés : ils racontent des histoires utiles,
          mais n'appartiennent plus au chemin de lecture principal. */}
      <CollapsibleSection title="Graphiques détaillés" icon={<Activity size={12} />} defaultOpen={false}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DrawdownChart rows={rows} darkMode={darkMode} />
          <CapitalAllocation rows={rows} inputs={inputs} darkMode={darkMode} showReal={inputs.showReal} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Fiscalité détaillée" icon={<Landmark size={12} />} defaultOpen={false}>
        <FiscalPanel rows={rows} inputs={inputs} />
      </CollapsibleSection>

      <MethodologyPanel inputs={inputs} />

      <CashflowCalendar rows={rows} showReal={inputs.showReal} />

      <div className="glass rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTableOpen(!tableOpen)}
          aria-expanded={tableOpen}
          aria-controls="annual-detail-table"
          className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-glass-hover transition-colors"
        >
          <SectionHeader bare level="card" icon={Table} title="Détail année par année" className="flex-1 min-w-0" />
          <span className="text-[10px] text-text-dim flex items-center gap-1 shrink-0">
            {tableOpen ? (
              <>
                Réduire <ChevronUp size={12} />
              </>
            ) : (
              <>
                Voir le détail annuel <ChevronDown size={12} />
              </>
            )}
          </span>
        </button>
        {tableOpen && (
          <div id="annual-detail-table" className="px-4 sm:px-6 pb-5">
            <AmortissementTable rows={rows} />
          </div>
        )}
      </div>
    </div>
  )
}
