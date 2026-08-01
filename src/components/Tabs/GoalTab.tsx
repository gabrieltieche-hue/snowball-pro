import { useMemo } from "react"
import { fmtCurrency, solveGoal } from "../../engine"
import { GoalProgress } from "../Simulation/GoalProgress"
import { SliderInput } from "../shared/SliderInput"
import { cn } from "../../utils/cn"
import type { GoalDifficulty, SimulationInputs, YearRow } from "../../types"

interface GoalTabProps {
  inputs: SimulationInputs
  rows: YearRow[]
  darkMode: boolean
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

const DIFFICULTY_META: Record<GoalDifficulty, { label: string; tone: string }> = {
  easy: { label: "Atteignable (livrets, obligations)", tone: "#4ADE80" },
  moderate: { label: "Marché actions diversifié", tone: "var(--color-primary)" },
  ambitious: { label: "Très ambitieux", tone: "#F87171" },
  impossible: { label: "Objectif irréaliste", tone: "#F87171" },
}

const COMPARISON_RATES = [3, 5, 7, 10, 12]

export function GoalTab({ inputs, rows, darkMode, updateInput }: GoalTabProps) {
  const goalResult = useMemo(() => solveGoal(inputs), [inputs])
  const lastRow = rows[rows.length - 1]
  const difficulty = DIFFICULTY_META[goalResult.difficulty]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-3xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold mb-1">🎯 Objectif d'épargne</h2>
          <p className="text-xs text-text-muted leading-relaxed max-w-xl">
            Vous savez combien vous voulez avoir plus tard : l'app calcule combien épargner chaque mois (et quel
            rendement de la bourse viser) pour y arriver.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <SliderInput
            label="Objectif (€)"
            id="goal-target"
            value={inputs.goalTarget}
            min={10000}
            max={5000000}
            step={10000}
            color="#6366F1"
            onChange={v => updateInput("goalTarget", v)}
          />
          <SliderInput
            label="Capital de départ (€)"
            id="goal-capital"
            value={inputs.goalCapital}
            min={0}
            max={200000}
            step={1000}
            color="#6366F1"
            onChange={v => updateInput("goalCapital", v)}
          />
          <SliderInput
            label="Durée (années)"
            id="goal-duration"
            value={inputs.goalDuration}
            min={1}
            max={50}
            step={1}
            color="#6366F1"
            onChange={v => updateInput("goalDuration", v)}
          />
          <SliderInput
            label="Rendement de la bourse (%)"
            id="goal-rate"
            value={inputs.goalAnnualReturn * 100}
            min={0.1}
            max={20}
            step={0.1}
            color="#6366F1"
            suffix={`Épargne de référence : ${fmtCurrency(inputs.goalPayment)}/mois`}
            onChange={v => updateInput("goalAnnualReturn", v / 100)}
          />
          <SliderInput
            label="Épargne mensuelle de référence (€)"
            id="goal-payment"
            value={inputs.goalPayment}
            min={0}
            max={10000}
            step={50}
            color="#6366F1"
            suffix="utilisée pour calculer le rendement nécessaire"
            onChange={v => updateInput("goalPayment", v)}
          />
        </div>

        {/* Résultats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 border-2 border-[#6366F1]/40 bg-[#6366F1]/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1] mb-2">
              💰 Épargne mensuelle nécessaire
            </p>
            <p className="mono text-3xl font-extrabold text-text mb-2">
              {goalResult.pmtPerMonth !== null && goalResult.pmtPerMonth > 0
                ? fmtCurrency(goalResult.pmtPerMonth)
                : "—"}
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Pour atteindre <strong className="text-text">{fmtCurrency(inputs.goalTarget)}</strong> en{" "}
              <strong className="text-text">{inputs.goalDuration} ans</strong> avec un rendement de{" "}
              <strong className="text-text">{(inputs.goalAnnualReturn * 100).toFixed(0)}%</strong>/an
              {inputs.goalCapital > 0 && ` et un capital de départ de ${fmtCurrency(inputs.goalCapital)}`}.
            </p>
            {goalResult.pmtPerMonth !== null && goalResult.pmtPerMonth > 0 && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-[11px] text-text-muted ${darkMode ? "bg-white/5" : "bg-black/5"}`}
              >
                Total épargné : <strong className="text-text">{fmtCurrency(goalResult.totalInvested ?? 0)}</strong> —
                Gains de la bourse : <strong className="text-primary">{fmtCurrency(goalResult.totalGains ?? 0)}</strong>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5 border-2 border-[#4ADE80]/30 bg-[#4ADE80]/8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#4ADE80] mb-2">
              📈 Rendement nécessaire ({fmtCurrency(inputs.goalPayment)}/mois d'épargne)
            </p>
            <p className="mono text-3xl font-extrabold text-text mb-2">
              {goalResult.requiredRate !== null ? `${goalResult.requiredRate.toFixed(2)}%` : "Impossible"}
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Rendement de la bourse nécessaire chaque année pour obtenir{" "}
              <strong className="text-text">{fmtCurrency(inputs.goalTarget)}</strong> en{" "}
              <strong className="text-text">{inputs.goalDuration} ans</strong> en épargnant{" "}
              <strong className="text-text">{fmtCurrency(inputs.goalPayment)}/mois</strong>
              {inputs.goalCapital > 0 && ` avec un capital initial de ${fmtCurrency(inputs.goalCapital)}`}.
            </p>
            <div className={`mt-3 flex items-center gap-2 p-2.5 rounded-lg ${darkMode ? "bg-white/5" : "bg-black/5"}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: difficulty.tone }} />
              <span className="text-[11px] text-text-muted">{difficulty.label}</span>
            </div>
          </div>
        </div>

        {/* Progression */}
        <GoalProgress current={lastRow?.nominal ?? 0} target={inputs.goalTarget} />

        {/* Tableau comparatif */}
        <div className="glass rounded-2xl p-5 border border-border">
          <p className="text-xs font-bold mb-4">
            📊 Comparaison des scénarios (objectif : {fmtCurrency(inputs.goalTarget)})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Rendement/an",
                    "Épargne /mois",
                    "Total épargné",
                    "Gains de la bourse",
                    "Part de l'objectif épargnée",
                  ].map(h => (
                    <th
                      key={h}
                      className="text-[9px] font-bold uppercase tracking-wider text-text-dim py-2.5 px-3 text-left whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_RATES.map(rr => {
                  const res = solveGoal({ ...inputs, goalAnnualReturn: rr / 100 })
                  if (res.pmtPerMonth === null || res.pmtPerMonth <= 0) return null
                  const isCurrent = Math.abs(inputs.goalAnnualReturn * 100 - rr) < 0.01
                  const gains = res.totalGains ?? 0
                  const totalPaid = res.totalInvested ?? 0
                  return (
                    <tr key={rr} className={cn("border-b border-border/30", isCurrent && "bg-[#6366F1]/10")}>
                      <td className={cn("py-2.5 px-3 font-bold", isCurrent ? "text-[#6366F1]" : "text-text")}>
                        {rr}%{isCurrent && " ←"}
                      </td>
                      <td className="py-2.5 px-3 mono text-primary font-semibold">{fmtCurrency(res.pmtPerMonth)}</td>
                      <td className="py-2.5 px-3 mono text-text">{fmtCurrency(totalPaid)}</td>
                      <td className={cn("py-2.5 px-3 mono font-semibold", gains > 0 ? "text-primary" : "text-danger")}>
                        {gains > 0 ? "+" : ""}
                        {fmtCurrency(gains)}
                      </td>
                      <td className="py-2.5 px-3 text-text-dim">
                        {inputs.goalTarget > 0 ? Math.round((totalPaid / inputs.goalTarget) * 100) : 0}% de l'objectif
                        provient de votre épargne
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
