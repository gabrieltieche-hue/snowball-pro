import type {
  SimulationInputs,
  YearRow,
  KPIs,
  Milestone,
  GoalResult,
  GoalDifficulty,
  ScenarioComparison,
} from "../types"
import { roundCent, calcXIRR } from "./taxes"
import { calcMaxDrawdown, PMTfromFV, monthlyRate, futureValue } from "./math"

/**
 * Construit les flux de trésorerie mensuels (capital initial + versements
 * indexés) et la valeur finale pour calculer un rendement interne réel (XIRR).
 * Le CAGR naïf ignore les versements périodiques ; le XIRR les prend en compte.
 */
export function buildCashFlows(inputs: SimulationInputs, finalValue: number): { flows: number[]; months: number[] } {
  const totalMonths = Math.max(0, Math.round(inputs.duration * 12))
  const flows: number[] = []
  const months: number[] = []

  // Capital initial : flux sortant à t=0
  if (inputs.capitalInitial > 0) {
    flows.push(-inputs.capitalInitial)
    months.push(0)
  }

  // Versements mensuels (avec indexation annuelle, comme dans runSimulation),
  // soumis au MÊME plafond PEA que le moteur (150/300 k€) : sans ce plafond,
  // le XIRR d'un PEA au-delà du cap comptait des versements jamais investis
  // et sous-évaluait le rendement (audit v5.6.2 : 6,2 % au lieu de ~10 %).
  let monthlyPayment = inputs.monthlyPayment
  const peaCap = inputs.envelope === "pea" ? (inputs.taxCouple ? 300_000 : 150_000) : Infinity
  let invested = Math.max(0, inputs.capitalInitial)
  for (let m = 1; m <= totalMonths; m += 1) {
    const monthInYear = (m - 1) % 12
    if (monthInYear === 0 && m > 1) monthlyPayment = monthlyPayment * (1 + inputs.indexation)
    const allowed = Math.min(monthlyPayment, Math.max(0, peaCap - invested))
    if (allowed > 0) {
      flows.push(-allowed)
      months.push(m)
      invested += allowed
    }
  }

  // Valeur finale : flux entrant à la fin
  if (finalValue > 0) {
    flows.push(finalValue)
    months.push(totalMonths)
  }
  return { flows, months }
}

export function computeXIRR(inputs: SimulationInputs, finalValue: number): number {
  // Valeur finale nulle ou négative → flux uniquement sortants : le XIRR n'a
  // pas de racine et Newton diverge vers des taux absurdes (~4 700 %/an). On
  // renvoie 0, même sémantique que le cas « aucun flux » (audit B4).
  if (finalValue <= 0) return 0
  const { flows, months } = buildCashFlows(inputs, finalValue)
  if (flows.length < 2) return 0
  const rate = calcXIRR(flows, months)
  return Number.isFinite(rate) ? rate : 0
}

export function computeKPIs(rows: YearRow[], inputs: SimulationInputs): KPIs {
  const last = rows[rows.length - 1]
  const first = rows[0]
  if (!last || !first)
    return {
      cagr: 0,
      xirr: 0,
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
  const xirr = computeXIRR(inputs, last.nominal)
  // Le Sharpe n'a plus de sens : l'app rejoue toujours des rendements réels
  // (plus de mode aléatoire gaussien) → rendements déterministes, écart-type
  // ~0 et ratio explosé. On le force à 0 (masqué dans l'UI).
  const sharpe = 0
  const drawdown = calcMaxDrawdown(rows.map(r => r.nominal))
  const contributionPct = last.nominal > 0 ? last.investedNom / last.nominal : 0
  // Rendement RÉEL mesuré sur la simulation, pas sur les inputs : le XIRR
  // (rendement annualisé des flux réels) déflaté par l'inflation RÉELLEMENT
  // appliquée pendant la projection (rapport nominal/réel cumulé). Avant
  // l'audit v5.2.2, on utilisait (1+taux saisi)/(1+inflation)−1, ce qui
  // donnait un chiffre faux dès que le mode était historique ou aléatoire
  // (le rendement saisi n'est pas celui rejoué). Depuis l'Option A (v5.5.0),
  // il n'y a plus de taux saisi du tout : le XIRR de la simulation réelle
  // rejouée est la seule source de vérité.
  const cumulativeInflationFactor = last.nominal > 0 && last.real > 0 ? last.nominal / last.real : 1 + inputs.inflation
  const avgAnnualInflation = Math.pow(Math.max(0.05, cumulativeInflationFactor), 1 / years) - 1
  const realReturn = xirr > -0.99 && avgAnnualInflation > -0.99 ? (1 + xirr) / (1 + avgAnnualInflation) - 1 : 0
  const totalWithFees = last.nominal + last.feesLost
  const feeImpactPct = totalWithFees > 0 ? last.feesLost / totalWithFees : 0

  // Le temps de doublement doit refléter le RENDEMENT RÉEL du capital (XIRR,
  // versements compris), pas le CAGR brut gonflé par les versements mensuels.
  // À 8 %/an : ~9 ans — l'affichage « 4,4 ans » d'avant était trompeur.
  let doublingTime: number | null = null
  if (xirr > 0) doublingTime = roundCent(Math.log(2) / Math.log(1 + xirr))
  if (doublingTime !== null && (doublingTime > 200 || !Number.isFinite(doublingTime))) doublingTime = null

  return {
    cagr: roundCent(cagr * 100),
    xirr: roundCent(xirr * 100),
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
  const goalRate = inputs.goalAnnualReturn
  const monthly = monthlyRate(goalRate)
  const pmt = PMTfromFV(target, inputs.goalCapital, monthly, periods)
  const pmtPerMonth = pmt > 0 && Number.isFinite(pmt) ? roundCent(pmt) : 0
  const totalInvested = roundCent(inputs.goalCapital + pmtPerMonth * periods)
  // Des gains « négatifs » n'ont pas de sens : si le capital de départ dépasse
  // déjà l'objectif, il n'y a aucun gain à générer (0 €), pas une perte
  // inventée de -400 k€ (audit B5).
  const totalGains = roundCent(Math.max(0, target - totalInvested))

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
    // Cohérent avec difficulty : au-delà de 14 %/an requis (ou taux non
    // convergent), l'objectif est « impossible » — il ne peut pas être à la
    // fois impossible et atteignable (contradiction signalée par l'audit).
    achievable: difficulty !== "impossible",
    difficulty,
  }
}

export function compareScenarios(rowsA: YearRow[], rowsB: YearRow[], showReal = false): ScenarioComparison {
  const lastA = rowsA[rowsA.length - 1]
  const lastB = rowsB[rowsB.length - 1]
  const finalA =
    showReal && lastA ? lastA.taxNet * (lastA.nominal > 0 ? lastA.real / lastA.nominal : 1) : (lastA?.taxNet ?? 0)
  const finalB =
    showReal && lastB ? lastB.taxNet * (lastB.nominal > 0 ? lastB.real / lastB.nominal : 1) : (lastB?.taxNet ?? 0)
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
