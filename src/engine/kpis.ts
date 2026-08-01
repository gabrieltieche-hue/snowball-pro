import type {
  SimulationInputs,
  YearRow,
  KPIs,
  Milestone,
  GoalResult,
  GoalDifficulty,
  ScenarioComparison,
} from "../types"
import { roundCent } from "./taxes"
import { calcMaxDrawdown, average, standardDeviation, PMTfromFV, monthlyRate, futureValue } from "./math"

const RISK_FREE_RATE = 0.03

export function computeKPIs(rows: YearRow[], inputs: SimulationInputs): KPIs {
  const last = rows[rows.length - 1]
  const first = rows[0]
  if (!last || !first)
    return {
      cagr: 0,
      sharpe: 0,
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      capitalMultiple: 0,
      doublingTime: null,
      contributionPct: 0,
      gainsPct: 0,
      realReturn: 0,
      feeImpactPct: 0,
      totalFees: 0,
      totalTax: 0,
      netCapital: 0,
      powerPurchaseRatio: 0,
    }

  const years = Math.max(1, inputs.duration)
  const cagr = first.nominal > 0 ? Math.pow(last.nominal / first.nominal, 1 / years) - 1 : 0
  const netReturns = rows
    .slice(1)
    .map(r => r.yearlyReturn)
    .filter(v => Number.isFinite(v))
  const sharpe =
    standardDeviation(netReturns) > 0 ? (average(netReturns) - RISK_FREE_RATE) / standardDeviation(netReturns) : 0
  const drawdown = calcMaxDrawdown(rows.map(r => r.nominal))
  const contributionPct = last.nominal > 0 ? last.investedNom / last.nominal : 0
  const realReturn = (1 + inputs.annualReturn) / (1 + inputs.inflation) - 1
  const totalWithFees = last.nominal + last.feesLost
  const feeImpactPct = totalWithFees > 0 ? last.feesLost / totalWithFees : 0

  let doublingTime: number | null = null
  if (cagr > 0) doublingTime = roundCent(Math.log(2) / Math.log(1 + cagr))
  if (doublingTime !== null && (doublingTime > 200 || !Number.isFinite(doublingTime))) doublingTime = null

  return {
    cagr: roundCent(cagr * 100),
    sharpe: roundCent(sharpe),
    maxDrawdown: roundCent(drawdown.maxDrawdown),
    maxDrawdownPct: roundCent(drawdown.maxDrawdownPct * 100),
    capitalMultiple: last.investedNom > 0 ? roundCent(last.nominal / last.investedNom) : 0,
    doublingTime,
    contributionPct: roundCent(contributionPct * 100),
    gainsPct: roundCent((1 - contributionPct) * 100),
    realReturn: roundCent(realReturn * 100),
    feeImpactPct: roundCent(feeImpactPct * 100),
    totalFees: last.feesLost,
    totalTax: last.tax,
    netCapital: last.taxNet,
    powerPurchaseRatio: last.nominal > 0 ? roundCent((last.real / last.nominal) * 100) : 0,
  }
}

export function computeMilestones(rows: YearRow[]): Milestone[] {
  const targets = [
    { id: "first-100k", value: 100_000, label: "Premier 100k" },
    { id: "half-million", value: 500_000, label: "500k investissables" },
    { id: "million", value: 1_000_000, label: "Cap du million" },
    { id: "two-million", value: 2_000_000, label: "Indépendance avancée" },
    { id: "three-million", value: 3_000_000, label: "Liberté financière" },
  ]
  const last = rows[rows.length - 1]
  const milestones = targets.map(target => {
    const reached = rows.find(r => r.nominal >= target.value)
    return {
      id: target.id,
      year: reached?.year ?? -1,
      value: target.value,
      label: target.label,
      reached: Boolean(last && last.nominal >= target.value),
    }
  })
  const dominance = rows.find(r => r.interestsNom > r.investedNom)
  milestones.push({
    id: "compound-dominance",
    year: dominance?.year ?? -1,
    value: dominance?.nominal ?? 0,
    label: "Les gains dépassent les versements",
    reached: Boolean(dominance),
  })
  return milestones
}

export function solveGoal(inputs: SimulationInputs): GoalResult {
  const target = Math.max(0, inputs.goalTarget)
  const periods = Math.max(1, Math.round(inputs.goalDuration * 12))
  const goalRate = inputs.goalAnnualReturn ?? inputs.annualReturn
  const monthly = monthlyRate(goalRate)
  const pmt = PMTfromFV(target, inputs.goalCapital, monthly, periods)
  const pmtPerMonth = pmt > 0 && Number.isFinite(pmt) ? roundCent(pmt) : 0
  const totalInvested = roundCent(inputs.goalCapital + pmtPerMonth * periods)
  const totalGains = roundCent(target - totalInvested)

  const requiredRate = (() => {
    if (futureValue(inputs.goalCapital, inputs.goalPayment, 0, periods) >= target) return 0
    let low = -0.2
    let high = 0.6
    for (let i = 0; i < 120; i += 1) {
      const mid = (low + high) / 2
      const fv = futureValue(inputs.goalCapital, inputs.goalPayment, monthlyRate(mid), periods)
      if (fv < target) low = mid
      else high = mid
    }
    const solved = (low + high) / 2
    return solved >= 0.595 ? null : roundCent(solved * 100)
  })()

  const requiredYears = (() => {
    if (target <= inputs.goalCapital) return 0
    let cap = inputs.goalCapital
    for (let m = 1; m <= 80 * 12; m += 1) {
      cap = cap * (1 + monthly) + inputs.goalPayment
      if (cap >= target) return roundCent(m / 12)
    }
    return null
  })()

  const difficulty: GoalDifficulty = (() => {
    if (requiredRate === null) return "impossible"
    if (requiredRate <= 5) return "easy"
    if (requiredRate <= 9) return "moderate"
    if (requiredRate <= 14) return "ambitious"
    return "impossible"
  })()

  return {
    pmtPerMonth,
    requiredRate,
    requiredYears,
    totalInvested,
    totalGains,
    achievable: requiredRate !== null,
    difficulty,
  }
}

export function compareScenarios(rowsA: YearRow[], rowsB: YearRow[]): ScenarioComparison {
  const finalA = rowsA[rowsA.length - 1]?.taxNet ?? 0
  const finalB = rowsB[rowsB.length - 1]?.taxNet ?? 0
  const diffAbsolute = roundCent(finalB - finalA)
  const diffPercent = finalA > 0 ? roundCent((diffAbsolute / finalA) * 100) : 0
  return {
    finalA,
    finalB,
    diffAbsolute,
    diffPercent,
    betterScenario: Math.abs(diffAbsolute) < 0.01 ? "equal" : diffAbsolute > 0 ? "B" : "A",
  }
}
