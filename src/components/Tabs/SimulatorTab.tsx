import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { computeKPIs, computeMilestones } from "../../engine"
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
import type { SimulationInputs, YearRow } from "../../types"

interface SimulatorTabProps {
  rows: YearRow[]
  inputs: SimulationInputs
  darkMode: boolean
}

export function SimulatorTab({ rows, inputs, darkMode }: SimulatorTabProps) {
  const kpis = useMemo(() => computeKPIs(rows, inputs), [rows, inputs])
  const milestones = useMemo(() => computeMilestones(rows), [rows])
  const [tableOpen, setTableOpen] = useState(false)

  return (
    <div className="space-y-5 animate-fade-in">
      <EquityChart rows={rows} inputs={inputs} darkMode={darkMode} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <KpiGrid kpis={kpis} />
        </div>
        <FiscalPanel rows={rows} inputs={inputs} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MilestoneTimeline milestones={milestones} rows={rows} />
        <FeeImpact rows={rows} inputs={inputs} />
      </div>

      {inputs.crisisEnabled ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DrawdownChart rows={rows} darkMode={darkMode} />
          <CapitalAllocation rows={rows} darkMode={darkMode} showReal={inputs.showReal} />
        </div>
      ) : (
        <CapitalAllocation rows={rows} darkMode={darkMode} showReal={inputs.showReal} />
      )}

      <AIInsightCard rows={rows} inputs={inputs} kpis={kpis} />

      <MethodologyPanel inputs={inputs} />

      <CashflowCalendar rows={rows} showReal={inputs.showReal} />

      <div className="glass rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTableOpen(!tableOpen)}
          className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-glass-hover transition-colors"
        >
          <span className="text-xs font-bold flex items-center gap-2">📋 Détail année par année</span>
          <span className="text-[10px] text-text-dim flex items-center gap-1">
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
          <div className="px-4 sm:px-6 pb-5">
            <AmortissementTable rows={rows} />
          </div>
        )}
      </div>
    </div>
  )
}
